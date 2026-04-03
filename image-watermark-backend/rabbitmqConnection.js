const amqp = require('amqplib');

async function connectRabbitMQ() {
  const RABBIT_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
  const queueName = process.env.QUEUE_NAME || 'image_processing';
  
  try {
    const connection = await amqp.connect(RABBIT_URL);
    
    // 2. Create Channel and set to global
    global.channel = await connection.createChannel();
    
    // 3. Assert the queue from ENV
    await global.channel.assertQueue(queueName, { durable: true });
    
    console.log(`✅ RabbitMQ Connected. Listening on: ${queueName}`);

    // Trigger the Worker's consumption logic once the channel is ready
    if (typeof global.startConsuming === 'function') {
        global.startConsuming();
    }

    connection.on('error', (err) => console.error("RabbitMQ Connection Error", err));
    connection.on('close', () => {
      console.error("RabbitMQ Connection Closed. Retrying...");
      setTimeout(connectRabbitMQ, 5000);
    });

  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}

module.exports = { connectRabbitMQ };