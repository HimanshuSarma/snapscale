const amqp = require('amqplib');

async function connectRabbitMQ() {
  const RABBIT_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
  
  try {
    // 1. Create Connection
    const connection = await amqp.connect(RABBIT_URL);
    
    // 2. Create Channel
    global.channel = await connection.createChannel();
    
    // 3. Assert Queue (Ensures the queue exists before sending)
    // 'durable: true' means the queue survives a RabbitMQ restart
    const queueName = 'image_processing';
    await global.channel.assertQueue(queueName, { durable: true });
    
    console.log("✅ RabbitMQ Connected and Queue Asserted");

    // Handle connection closure/errors
    connection.on('error', (err) => console.error("RabbitMQ Connection Error", err));
    connection.on('close', () => {
      console.error("RabbitMQ Connection Closed. Retrying...");
      setTimeout(connectRabbitMQ, 5000);
    });

  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error.message);
    // Retry connection every 5 seconds if it fails (common in K8s startup)
    setTimeout(connectRabbitMQ, 5000);
  }
}

// Call this in your app.listen() or at the start of index.js
connectRabbitMQ();