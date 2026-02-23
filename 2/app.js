const express = require('express');
const app = express();
const port = 3000;

let products = [
    { id: 1, name: 'Ноутбук', price: 50000 },
    { id: 2, name: 'Смартфон', price: 30000 },
    { id: 3, name: 'Планшет', price: 25000 }
];

app.use(express.json());
app.use(express.static('.'));

// главная страница
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// получить все товары
app.get('/products', (req, res) => {
    res.json(products);
});

// получить товар по id
app.get('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
});

// добавить новый товар
app.post('/products', (req, res) => {
    const { name, price } = req.body;

    // проверка обязательных полей
    if (!name || !price) {
        return res.status(400).json({ error: 'Укажите название и цену' });
    }

    // создаем новый товар с уникальным id
    const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        name,
        price: Number(price)
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

// обновить товар
app.patch('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });

    // обновляем только переданные поля
    if (req.body.name) product.name = req.body.name;
    if (req.body.price) product.price = req.body.price;

    res.json(product);
});

// удалить товар
app.delete('/products/:id', (req, res) => {
    const index = products.findIndex(p => p.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Товар не найден' });

    products.splice(index, 1);
    res.json({ message: 'Товар удален' });
});

// запуск
app.listen(port, () => {
    console.log(`Сервер запущен: http://localhost:${port}`);
    console.log(`Товаров: ${products.length}`);
});