require('dotenv').config();
const axios = require('axios');
const sharp = require('sharp');
const db = require('./dbConnection');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { images } = require('./models/Image');
const { processed_images } = require('./models/ProcessedImages');
const { jobs } = require('./models/Job');
const { connectRabbitMQ } = require('./rabbitmqConnection'); // Assuming you export a way to get the channel
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const QUEUE_NAME = process.env.QUEUE_NAME || 'image_processing';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function startWorker() {
  await connectRabbitMQ();

  if (!global.channel) {
    console.error("❌ RabbitMQ Channel not ready. Retrying in 5s...");
    setTimeout(startWorker, 5000);
    return;
  }

  // Prefetch(1) ensures the worker only takes 1 job at a time.
  // This is crucial for heavy tasks like image processing.
  await global.channel.prefetch(1);

  console.log(`[*] Waiting for messages in ${QUEUE_NAME}. To exit press CTRL+C`);

  global.channel.consume(QUEUE_NAME, async (msg) => {
    if (msg !== null) {
      const { jobId, imageId } = JSON.parse(msg.content.toString());

      console.log(`[📥] Received Job ID: ${jobId} for Image ID: ${imageId}`);


      try {
        // 1. Fetch Image details from DB
        const fetchedImage = await db.models.images.findOne({ where: { id: imageId } });
        if (!fetchedImage) throw new Error("Image not found in DB");
        
        const imageUrl = fetchedImage.image;
        console.log(`[🛠️] Downloading image: ${imageUrl}`);

        // 2. Update status to 'processing'
        await db.models.jobs.update({ status: 'processing' }, { where: { id: jobId } });

        // 3. Download the image as a Buffer
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const inputBuffer = Buffer.from(response.data, 'binary');

        // 4. Generate the Watermark with Sharp
        // We create an SVG overlay for the text "Hello World"
        const svgText = `
          <svg width="500" height="100">
            <style>
              .title { fill: rgba(255, 255, 255, 0.5); font-size: 40px; font-weight: bold; font-family: Arial; }
            </style>
            <text x="50%" y="50%" text-anchor="middle" class="title">Hello World Image id: ${imageId}</text>
          </svg>`;
        const svgBuffer = Buffer.from(svgText);

        console.log(`[🎨] Adding watermark to Image ID: ${imageId}`);
        const outputBuffer = await sharp(inputBuffer)
          .composite([{ input: svgBuffer, gravity: 'center' }]) // Put text in the middle
          .toBuffer();

        // 5. Upload Processed Image back to S3
        const processedKey = `processed/watermarked-${Date.now()}-${imageId}.png`;
        
        await s3.send(new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: processedKey,
          Body: outputBuffer,
          ContentType: 'image/png',
          // ACL: 'public-read' // Optional: if you want the output to be public immediately
        }));

        const processedUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${processedKey}`;

        // 6. Update DB with the new URL and 'completed' status
        await db.models.processed_images.create({ image: processedUrl, userId: fetchedImage.userId }, { where: { id: imageId } });
        await db.models.jobs.update({ status: 'completed' }, { where: { id: jobId } });

        console.log(`[✅] Job ${jobId} finished. New URL: ${processedUrl}`);
        global.channel.ack(msg);

        await db.models.jobs.destroy({ where: { id: jobId } });

      } catch (error) {
        console.error(`[❌] Error processing Job ID: ${jobId}`, error);
        await db.models.jobs.update({ status: 'failed' }, { where: { id: jobId } });
        global.channel.nack(msg, false, false);
      }
    }
  });
}

// Start the consumer
startWorker();