const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

// Подключаем Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// Начальные товары (10 штук)
let products = [
  {
    id: nanoid(6),
    name: 'Ноутбук',
    category: 'Электроника',
    description: 'Мощный игровой ноутбук',
    price: 1200,
    stock: 5,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&fit=crop'
  },
  {
    id: nanoid(6),
    name: 'Смартфон',
    category: 'Электроника',
    description: 'Последняя модель',
    price: 800,
    stock: 10,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&fit=crop'
  },
  {
    id: nanoid(6),
    name: 'Книга',
    category: 'Книги',
    description: 'Фантастика',
    price: 15,
    stock: 50,
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&fit=crop'
  },
  {
    id: nanoid(6),
    name: 'Футболка',
    category: 'Одежда',
    description: 'Хлопок',
    price: 20,
    stock: 30,
    rating: 4.0,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&fit=crop'
  },
  {
    id: nanoid(6),
    name: 'Кроссовки',
    category: 'Обувь',
    description: 'Беговые',
    price: 100,
    stock: 15,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&fit=crop'
  },
  {
    id: nanoid(6),
    name: 'Кофеварка',
    category: 'Техника',
    description: 'Капельная',
    price: 80,
    stock: 7,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&fit=crop'
  },
  {
    id: nanoid(6),
    name: 'Наушники',
    category: 'Аудио',
    description: 'Беспроводные',
    price: 150,
    stock: 12,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&fit=crop'
  },
  {
    id: nanoid(6),
    name: 'Рюкзак',
    category: 'Аксессуары',
    description: 'Для ноутбука',
    price: 50,
    stock: 20,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&fit=crop'
  },
  {
    id: nanoid(6),
    name: 'Планшет',
    category: 'Электроника',
    description: 'Для рисования',
    price: 600,
    stock: 3,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&fit=crop'
  },
  {
    id: nanoid(6),
    name: 'Игра',
    category: 'Игры',
    description: 'Приключения',
    price: 60,
    stock: 8,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&fit=crop'
  },
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

// Настройка Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API управления товарами',
      version: '1.0.0',
      description: 'Простое API для интернет-магазина (товары)',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Локальный сервер',
      },
    ],
  },
  // Путь к файлам с JSDoc-комментариями (текущий файл)
  apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Подключаем Swagger UI по адресу /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Описание схемы товара
/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор товара (генерируется автоматически)
 *           example: "abc123"
 *         name:
 *           type: string
 *           description: Название товара
 *           example: "Ноутбук"
 *         category:
 *           type: string
 *           description: Категория товара
 *           example: "Электроника"
 *         description:
 *           type: string
 *           description: Краткое описание
 *           example: "Мощный игровой ноутбук"
 *         price:
 *           type: number
 *           format: float
 *           description: Цена в рублях
 *           example: 1200
 *         stock:
 *           type: integer
 *           description: Количество на складе
 *           example: 5
 *         rating:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Рейтинг товара (от 0 до 5)
 *           example: 4.5
 *         image:
 *           type: string
 *           nullable: true
 *           description: URL изображения
 *           example: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&fit=crop"
 */

// Вспомогательная функция
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

// ==================== МАРШРУТЫ ====================

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получает товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Product not found"
 */
app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создаёт новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *                 nullable: true
 *               image:
 *                 type: string
 *                 nullable: true
 *             example:
 *               name: "Монитор"
 *               category: "Электроника"
 *               description: "4K IPS"
 *               price: 35000
 *               stock: 2
 *               rating: 4.8
 *               image: "https://example.com/monitor.jpg"
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Не заполнены обязательные поля
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing required fields"
 */
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

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Частично обновляет товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *                 nullable: true
 *               image:
 *                 type: string
 *                 nullable: true
 *             example:
 *               price: 1100
 *               stock: 3
 *     responses:
 *       200:
 *         description: Обновлённый товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет полей для обновления или неверные данные
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Nothing to update"
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Product not found"
 */
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

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаляет товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удалён (нет тела ответа)
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Product not found"
 */
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
  console.log(`Документация Swagger доступна по адресу http://localhost:${port}/api-docs`);
});