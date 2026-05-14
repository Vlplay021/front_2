import amqplib from 'amqplib'

const WORKER_ID = process.env.WORKER_ID || '1'
const MAX_RETRIES = 3

async function processTask(task) {
  console.log(`[Worker ${WORKER_ID}] Обработка задачи ${task.id} (тип: ${task.type})`)
  // Имитируем асинхронную работу
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Для демонстрации retry: если тип task === 'fail' – генерируем ошибку
  if (task.type === 'fail') {
    throw new Error('Преднамеренная ошибка обработки')
  }

  console.log(`[Worker ${WORKER_ID}] ✅ Задача ${task.id} выполнена`)
}

async function startWorker() {
  const conn = await amqplib.connect('amqp://localhost')
  const ch = await conn.createChannel()

  await ch.assertQueue('tasks_queue', { durable: true })
  // Обрабатываем по 1 задаче за раз
  ch.prefetch(1)

  console.log(`[Worker ${WORKER_ID}] Ожидание задач...`)

  ch.consume('tasks_queue', async (msg) => {
    if (!msg) return

    const task = JSON.parse(msg.content.toString())
    const retryCount = (msg.properties.headers?.['x-retry-count'] || 0)

    try {
      await processTask(task)
      ch.ack(msg)  // подтверждаем успех
    } catch (err) {
      console.error(`[Worker ${WORKER_ID}] ❌ Ошибка: ${err.message}, попытка ${retryCount + 1}/${MAX_RETRIES}`)

      if (retryCount < MAX_RETRIES - 1) {
        // Экспоненциальная задержка
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000) + Math.random() * 1000
        console.log(`[Worker ${WORKER_ID}] Повтор через ${Math.round(delay)}ms`)

        // Отправляем сообщение обратно в очередь с увеличенным счётчиком
        ch.sendToQueue('tasks_queue', msg.content, {
          persistent: true,
          headers: { 'x-retry-count': retryCount + 1 },
        })
        ch.ack(msg) // удаляем текущее (уже отправили новое)
      } else {
        // Исчерпаны попытки – сообщение попадёт в DLQ благодаря настройкам очереди
        console.error(`[Worker ${WORKER_ID}] 💀 Исчерпаны попытки, задача отправлена в DLQ`)
        ch.nack(msg, false, false) // не возвращать в очередь, позволить DLX забрать
      }
    }
  })
}

startWorker().catch(console.error)