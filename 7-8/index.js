const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const cors = require('cors');


const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;
const JWT_SECRET = 'your_secret_key_change_in_production';
const ACCESS_EXPIRES_IN = '15m';

// Хранилища данных (в памяти)
const users = [];
const products = [];

const findUserByEmail = (email) => users.find(u => u.email === email);
const findProductById = (id) => products.find(p => p.id === id);

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: 'email, first_name, last_name and password are required' });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: nanoid(),
    email,
    first_name,
    last_name,
    passwordHash,
  };
  users.push(newUser);

  const { passwordHash: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// Вход (выдаёт access‑токен)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  res.json({ accessToken });
});

// Защищённый маршрут – информация о текущем пользователе
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Создать товар
app.post('/api/products', (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: 'title, category, description and price are required' });
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

// Получить список всех товаров
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Получить товар по id
app.get('/api/products/:id', (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Обновить товар
app.put('/api/products/:id', (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { title, category, description, price } = req.body;
  if (title !== undefined) product.title = title;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);

  res.json(product);
});

// Удалить товар
app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  products.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});