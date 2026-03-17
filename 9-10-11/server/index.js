const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;
const ACCESS_SECRET = 'your_access_secret_change_me';
const REFRESH_SECRET = 'your_refresh_secret_change_me';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

// Хранилища
let users = [];
const products = [];
const refreshTokens = new Set();

// Вспомогательные функции
const findUserByEmail = (email) => users.find(u => u.email === email);
const findUserById = (id) => users.find(u => u.id === id);
const findProductById = (id) => products.find(p => p.id === id);

// Генерация токенов
const generateAccessToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
};

// Middleware для проверки access-токена и загрузки пользователя
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    const user = findUserById(payload.sub);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    const { passwordHash, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

// Middleware для проверки ролей
function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Инициализация тестовых пользователей
async function initUsers() {
  if (users.length === 0) {
    const saltRounds = 10;
    const adminHash = await bcrypt.hash('admin123', saltRounds);
    const sellerHash = await bcrypt.hash('seller123', saltRounds);
    const userHash = await bcrypt.hash('user123', saltRounds);

    users.push(
      {
        id: nanoid(),
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        passwordHash: adminHash,
        role: 'admin',
        active: true,
      },
      {
        id: nanoid(),
        email: 'seller@example.com',
        first_name: 'Seller',
        last_name: 'User',
        passwordHash: sellerHash,
        role: 'seller',
        active: true,
      },
      {
        id: nanoid(),
        email: 'user@example.com',
        first_name: 'Regular',
        last_name: 'User',
        passwordHash: userHash,
        role: 'user',
        active: true,
      }
    );
  }
}
initUsers();

// ---------- Auth endpoints ----------
app.post('/api/auth/register', async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: nanoid(),
    email,
    first_name,
    last_name,
    passwordHash,
    role: 'user',
    active: true,
  };
  users.push(newUser);

  const { passwordHash: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = findUserByEmail(email);
  if (!user || !user.active) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);

  res.json({ accessToken, refreshToken });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = findUserById(payload.sub);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// ---------- User endpoints (только для админа) ----------
app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const usersWithoutPass = users.map(u => {
    const { passwordHash, ...rest } = u;
    return rest;
  });
  res.json(usersWithoutPass);
});

app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { first_name, last_name, email, role } = req.body;
  if (first_name !== undefined) user.first_name = first_name;
  if (last_name !== undefined) user.last_name = last_name;
  if (email !== undefined) {
    const existingUser = findUserByEmail(email);
    if (existingUser && existingUser.id !== user.id) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    user.email = email;
  }
  if (role !== undefined && ['user', 'seller', 'admin'].includes(role)) {
    user.role = role;
  }

  const { passwordHash, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  user.active = false;
  res.status(204).send();
});

// ---------- Products endpoints ----------
app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const { title, category, description, price } = req.body;
  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const newProduct = {
    id: nanoid(),
    title,
    category,
    description,
    price: Number(price),
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.get('/api/products', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { title, category, description, price } = req.body;
  if (title !== undefined) product.title = title;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);

  res.json(product);
});

app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});