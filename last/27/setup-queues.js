import amqplib from 'amqplib'

async function setup() {
  const conn = await amqplib.connect('amqp://localhost')
  const ch = await conn.createChannel()

  // 1. Dead Letter Exchange
  await ch.assertExchange('dlx_exchange', 'direct', { durable: true })
  // 2. Dead Letter Queue
  await ch.assertQueue('dead_letter_queue', { durable: true })
  // 3. Привязка DLQ к DLX
  await ch.bindQueue('dead_letter_queue', 'dlx_exchange', 'dead')

  // 4. Основная очередь с DLX
  await ch.assertQueue('tasks_queue', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dlx_exchange',
      'x-dead-letter-routing-key': 'dead',
      'x-message-ttl': 60000, // 1 минута на обработку (опционально)
    },
  })

  console.log('✓ Очереди настроены: tasks_queue → dlx_exchange → dead_letter_queue')
  await ch.close()
  await conn.close()
}

setup().catch(console.error)