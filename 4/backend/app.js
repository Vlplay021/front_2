const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

// Начальные товары 10
let products = [
  { id: nanoid(6), name: 'Ноутбук', category: 'Электроника', description: 'Мощный игровой ноутбук', price: 1200, stock: 5, rating: 4.5, image: 'https://via.placeholder.com/150' },
  { id: nanoid(6), name: 'Смартфон', category: 'Электроника', description: 'Последняя модель', price: 800, stock: 10, rating: 4.7, image: 'https://via.placeholder.com/150' },
  { id: nanoid(6), name: 'Книга', category: 'Книги', description: 'Фантастика', price: 15, stock: 50, rating: 4.2, image: 'https://via.placeholder.com/150' },
  { id: nanoid(6), name: 'Футболка', category: 'Одежда', description: 'Хлопок', price: 20, stock: 30, rating: 4.0, image: 'https://via.placeholder.com/150' },
  { id: nanoid(6), name: 'Кроссовки', category: 'Обувь', description: 'Беговые', price: 100, stock: 15, rating: 4.6, image: 'https://via.placeholder.com/150' },
  { id: nanoid(6), name: 'Кофеварка', category: 'Техника', description: 'Капельная', price: 80, stock: 7, rating: 4.3, image: 'https://via.placeholder.com/150' },
  { id: nanoid(6), name: 'Наушники', category: 'Аудио', description: 'Беспроводные', price: 150, stock: 12, rating: 4.8, image: 'https://via.placeholder.com/150' },
  { id: nanoid(6), name: 'Рюкзак', category: 'Аксессуары', description: 'Для ноутбука', price: 50, stock: 20, rating: 4.4, image: 'https://via.placeholder.com/150' },
  { id: nanoid(6), name: 'Планшет', category: 'Электроника', description: 'Для рисования', price: 600, stock: 3, rating: 4.5, image: 'https://via.placeholder.com/150' },
  { id: nanoid(6), name: 'Игра', category: 'Игры', description: 'Приключения', price: 60, stock: 8, rating: 4.9, image: 'https://via.placeholder.com/150' }
];

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Логирование запросов
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      console.log('Body:', req.body);
    }
  });
  next();
});

// Вспомогательная функция поиска товара
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

// Получить все товары
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Получить товар по id
app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

// Создать товар
app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock, rating, image } = req.body;
  if (!name || !category || !description || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock),
    rating: rating ? Number(rating) : null,
    image: image || null
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Обновить товар
app.patch('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  const allowedFields = ['name', 'category', 'description', 'price', 'stock', 'rating', 'image'];
  const updates = req.body;
  const hasUpdates = Object.keys(updates).some(key => allowedFields.includes(key) && updates[key] !== undefined);
  if (!hasUpdates) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  if (updates.name !== undefined) product.name = updates.name.trim();
  if (updates.category !== undefined) product.category = updates.category.trim();
  if (updates.description !== undefined) product.description = updates.description.trim();
  if (updates.price !== undefined) product.price = Number(updates.price);
  if (updates.stock !== undefined) product.stock = Number(updates.stock);
  if (updates.rating !== undefined) product.rating = updates.rating ? Number(updates.rating) : null;
  if (updates.image !== undefined) product.image = updates.image || null;

  res.json(product);
});

// Удалить товар
app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const exists = products.some(p => p.id === id);
  if (!exists) return res.status(404).json({ error: 'Product not found' });
  products = products.filter(p => p.id !== id);
  res.status(204).send();
});

// 404 для неизвестных маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});