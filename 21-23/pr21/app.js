const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { createClient } = require("redis")

const app = express()
app.use(express.json())

const PORT = 3000;

// Секреты
const ACCESS_SECRET = "access_secret"
const REFRESH_SECRET = "refresh_secret"

// Время жизни токенов
const ACCESS_EXPIRES_IN = "15m"
const REFRESH_EXPIRES_IN = "7d"

// Время хранения кэша
const USERS_CACHE_TTL = 60
const PRODUCTS_CACHE_TTL = 600

const users = [] // { id, username, passwordHash, role, blocked }

const products = [
	{ id: "0", name: "Ноутбук ASUS ROG", price: 85000, description: "Игровой ноутбук с RTX 4060" },
	{ id: "1", name: "Монитор LG 27\"", price: 32000, description: "IPS монитор 2K 144Hz" },
	{ id: "2", name: "Мышь Logitech G502", price: 5500, description: "Игровая мышь с настраиваемым весом" },
	{ id: "3", name: "Клавиатура HyperX Alloy", price: 7000, description: "Механическая клавиатура с RGB" },
	{ id: "4", name: "Наушники Sony WH-1000XM5", price: 22000, description: "Беспроводные с шумоподавлением" },
	{ id: "5", name: "iPhone 15", price: 90000, description: "Флагман Apple 2023" },
	{ id: "6", name: "Samsung Galaxy S24", price: 75000, description: "Флагман Samsung с AI" },
	{ id: "7", name: "Веб-камера Logitech C920", price: 8500, description: "Full HD 1080p для стриминга" },
	{ id: "8", name: "SSD Samsung 970 EVO 1TB", price: 9000, description: "NVMe M.2 накопитель" },
	{ id: "9", name: "Коврик SteelSeries QcK XXL", price: 3500, description: "Игровой коврик 900x400мм" },
] // { id, name, price, description }

const refreshTokens = new Set() // Хранилище refresh токенов

const redisClient = createClient({
	url: "redis://127.0.0.1:6379",
})

redisClient.on("error", (error) => console.log("Redis error:",error))

const initRedis = async () => {
	await redisClient.connect()
	console.log("Redis Connected")
}

const generateAccessToken = (user) => {
	return jwt.sign({
		sub: user.id,
		username: user.username,
		role: user.role,
	},
		ACCESS_SECRET,
		{
			expiresIn: ACCESS_EXPIRES_IN,
		}
	)
}

const generateRefreshToken = (user) => {
	return jwt.sign({
		sub: user.id,
		username: user.username,
		role: user.role,
	},
		REFRESH_SECRET,
		{
			expiresIn: REFRESH_EXPIRES_IN,
		}
		)
}

const authMiddleware = (req, res, next) => {
	const header = req.headers.authorization || "" // хранит jwt-токен авторизации
	const [scheme, token] = header.split(" ")
	
	if (scheme !== "Bearer" || !token) {
		return res.status(401).json({
			error: "Missing or invalid Authorization header",
		})
	}
	
	try {
		const payload = jwt.verify(token, ACCESS_SECRET)
		
		const user = users.find((user) => user.id === payload.sub)
		if (!user || user.blocked) {
			return res.status(401).json({
				error: "User not found or blocked",
			})
		}
		
		req.user = payload // добавляем подпись пользователя в запросы
		next()
	} catch (error) {
		return res.status(401).json({
			error: "Invalid or expired token",
		})
	}
}

const roleMiddleware = (allowedRoles) => {
	return (req, res, next) => {
		if (!req.user || !allowedRoles.includes(req.user.role)) {
			return res.status(403).json({
				error: "Forbidden",
			})
		}
		next()
	}
}

const cacheMiddleware = (keyBuilder, ttl) => {
	return async (req, res, next) => {
		try {
			const key = keyBuilder(req) // функция, которая возвращает путь req.params.sth
			const cachedData = await redisClient.get(key)
			
			if (cachedData) {
				return res.json({
					source: "cache",
					data: JSON.parse(cachedData),
				})
			}
			
			req.cacheKey = key
			req.cacheTTL = ttl
			next()
		} catch (error) {
			console.error("Cache read error:",error)
			next()
		}
	}
}

const saveToCache = async (key, data, ttl) => {
	try {
		await redisClient.set(key, JSON.stringify(data), {
			EX: ttl // expires time to live
		})
	} catch (err) {
		console.error("Cache save error:",err)
	}
}

const invalidateUsersCache = async (userId = null) => {
	try {
		await redisClient.del("users:all") // кэш app.get
		if (userId) {
			await redisClient.del(`users:${userId}`)
		}
	} catch (err) {
		console.error("Users cache invalidate error:", err)
	}
}

// Auth

app.post("/api/auth/register", async (req, res) => {
	const { username, password, role } = req.body
	
	if (!username || !password) {
		return res.status(401).json({
			error: "username and password are required",
		})
	}
	
	const exists = users.some((user) => user.username === username)
	if (exists) {
		return res.status(409).json({
			error: "username already exists",
		})
	}
	
	const passwordHash = await bcrypt.hash(password, 10)
	
	const user = {
		id: String(users.length),
		username,
		passwordHash,
		role: role || "user",
		blocked: false
	}
	
	users.push(user)
	
	res.status(201).json({
		id: user.id,
		username: user.username,
		role: user.role,
		blocked: user.blocked,
	})
})

app.post("/api/auth/login", async (req, res) => {
	const { username, password } = req.body
	
	if (!username || !password) {
		return res.status(400).json({
			error: "username and password are required",
		});
	}
	
	const user = users.find((user) => user.username === username)
	if (!user || user.blocked) {
		return res.status(401).json({
			error: "Invalid credentials or user is blocked",
		})
	}
	
	const isValid = await bcrypt.compare(password, user.passwordHash)
	if (!isValid) {
		return res.status(401).json({
			error: "Invalid credentials",
		})
	}
	
	const accessToken = generateAccessToken(user)
	const refreshToken = generateRefreshToken(user)
	
	refreshTokens.add(refreshToken)
	
	res.json({
		accessToken,
		refreshToken,
	})
})

app.post("/api/auth/refresh", async (req, res) => {
	const { refreshToken } = req.body
	
	if (!refreshToken) {
		return res.status(400).json({
			error: "refreshToken is required",
		})
	}
	
	if (!refreshTokens.has(refreshToken)) {
		return res.status(401).json({
			error: "Invalid refresh token",
		})
	}
	
	try {
		const payload = jwt.verify(refreshToken, REFRESH_SECRET)
		
		const user = users.find((user) => user.id === payload.sub)
		if (!user || user.blocked) {
			return res.status(401).json({
				error: "User not found or blocked",
			})
		}
		
		refreshTokens.delete(refreshToken)
		
		const newAccessToken = generateAccessToken(user)
		const newRefreshToken = generateRefreshToken(user)
		
		refreshTokens.add(newRefreshToken)
		
		res.json({
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
		})
	} catch (error) {
		res.status(401).json({
			error: "Invalid or expired refresh token",
		})
	}
})

app.get("/api/auth/me", authMiddleware, roleMiddleware(["user", "seller", "admin"]), (req, res) => {
	const user = users.find((user) => user.id === req.user.sub)
	
	res.json({
		id: user.id,
		username: user.username,
		role: user.role,
		blocked: user.blocked
	})
})

// Users

app.get(
	"/api/users",
	authMiddleware,
	roleMiddleware(["admin"]),
	cacheMiddleware(() => "users:all", USERS_CACHE_TTL),
	async (req, res) => {
		const data = users.map((user) => ({
			id: user.id,
			username: user.username,
			role: user.role,
			blocked: user.blocked,
		}))
		
		await saveToCache(req.cacheKey, data,  req.cacheTTL)
		
		res.json({
			source: "server",
			data
		})
	}
)

app.get(
	"/api/users/:id",
	authMiddleware,
	roleMiddleware(["admin"]),
	cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
	async (req, res) => {
		const user = users.find((user) => user.id === req.params.id)
		
		if (!user) {
			return res.status(404).json({
				error: "User not found"
			})
		}
		
		const data = {
			id: user.id,
			username: user.username,
			role: user.role,
			blocked: user.blocked
		};
		
		await saveToCache(req.cacheKey, data, req.cacheTTL)
		
		res.json({
			source: "server",
			data
		})
	}
)

app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
	const { username, role, blocked } = req.body
	const user = users.find((u) => u.id === req.params.id)
	if (!user) {
		return res.status(404).json({ error: "User not found" })
	}
	
	if (username !== undefined) user.username = username
	if (role !== undefined) user.role = role
	if (blocked !== undefined) user.blocked = blocked
	
	await invalidateUsersCache(user.id)
	res.json({
		id: user.id,
		username: user.username,
		role: user.role,
		blocked: user.blocked
	})
})

app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
	const user = users.find((u) => u.id === req.params.id);
	if (!user) {
		return res.status(404).json({ error: "User not found" })
	}
	user.blocked = true;
	await invalidateUsersCache(user.id);
	res.json({
		message: "User blocked",
		id: user.id
	})
})

// Products

app.get(
	"/api/products",
	cacheMiddleware(() => "products:all", PRODUCTS_CACHE_TTL),
	async (req, res) => {
		const data = products.map((product) => ({
			id: product.id,
			name: product.name,
			price: product.price,
			description: product.description,
		}))
		
		await saveToCache(req.cacheKey, data,  req.cacheTTL)
		
		res.json({
			source: "server",
			data
		})
	}
)

app.get(
	"/api/products/:id",
	cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL),
	async (req, res) => {
		const product = products.find((product) => product.id === req.params.id)
		
		if (!product) {
			return res.status(404).json({
				error: "Product not found"
			})
		}
		
		const data = {
			id: product.id,
			name: product.name,
			price: product.price,
			description: product.description
		};
		
		await saveToCache(req.cacheKey, data, req.cacheTTL)
		
		res.json({
			source: "server",
			data
		})
	}
)

initRedis().then(() => {
	app.listen(PORT, () => {
		console.log(`Сервер запущен на http://localhost:${PORT}`);
	})
})


