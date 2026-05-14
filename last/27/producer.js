import express from 'express'
import amqplib from 'amqplib'

const app = express()
app.use(express.json())

let channel = null

async function connectRabbit() {
  const conn = await amqplib.connect('amqp://localhost')
  channel = await conn.createChannel()
  await channel.assertQueue('tasks_queue', { durable: true })
  console.log('Producer подключён к RabbitMQ')
}

app.post('/tasks', async (req, res) => {
  const { type, payload } = req.body
  if (!type || !payload) {
    return res.status(400).json({ error: 'Поля type и payload обязательны' })
  }

  const task = {
    id: Date.now(),
    type,
    payload,
    createdAt: new Date().toISOString(),
  }

  channel.sendToQueue('tasks_queue', Buffer.from(JSON.stringify(task)), {
    persistent: true,
  })

  res.json({ status: 'ok', taskId: task.id })
})

const PORT = 3000
app.listen(PORT, async () => {
  await connectRabbit()
  console.log(`Producer запущен на http://localhost:${PORT}`)
  console.log('Пример POST запроса: curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d \'{"type":"email","payload":{"to":"user@test.com","subject":"Hello"}}\'')
})