const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const vapidKeys = {
  publicKey: 'BJFEN0tlThI9YAioHOqn2OrwilDX-bexgQq7Ap-Cq_LorAim2CILwcyas-ST2BHRmBkFiJctECZ1ys3QhawmjsI',
  privateKey: '4iepwQC46VD7-qhm5CzXuMoJ6dO5NHz0f2ihvUT2Gz8'
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Хранилище подписок
let subscriptions = [];

// Эндпоинты для управления push-подписками
app.post('/subscribe', (req, res) => {
  subscriptions.push(req.body);
  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  res.status(200).json({ message: 'Подписка удалена' });
});

// Настройка HTTPS сервера
const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost.pem'))
};
const server = https.createServer(options, app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);

  socket.on('newTask', (task) => {
    io.emit('taskAdded', task);

    const payload = JSON.stringify({
      title: 'Новая задача',
      body: task.text
    });

    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
    });
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на https://localhost:${PORT}`);
});