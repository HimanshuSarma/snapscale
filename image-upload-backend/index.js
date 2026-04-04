const express = require('express');
const cors = require('cors');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const mysql = require('mysql2/promise');
const amqp = require('amqplib');
require('dotenv').config();
const db = require('./dbConnection');
const { images } = require('./models/Image');
const { jobs } = require('./models/Job');
const {  channel } = require('./rabbitmqConnection');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// 1. AWS S3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 2. Updated Multer-S3 Setup with S3_DIRECTORY
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      // Logic to ensure the directory path is clean
      const directory = process.env.S3_DIRECTORY || 'uploads';
      const cleanDir = directory.endsWith('/') ? directory : `${directory}/`;
      
      const fileName = `${Date.now().toString()}-${file.originalname}`;
      
      // Full path: directory/timestamp-filename.ext
      cb(null, `${cleanDir}${fileName}`);
    }
  })
});

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const s3Url = req.file.location;
    const userId = req.body.userId;

    // 1. Record the intent in the Database (The "Source of Truth")
    const newImage = await db.models.images.create({ image: s3Url, userId });
    
    const newJob = await db.models.jobs.create({
      imageId: newImage.id,
      status: 'queued', // We mark it as queued in the DB
      payload: { s3Url, text: "Hello World" }
    });

    console.log(`New Job Created: ${newJob.dataValues.id} for Image ID: ${newImage.dataValues.id}`);

    // 2. Hand off the task to RabbitMQ
    if (global.channel) {
      const message = JSON.stringify({ 
        jobId: newJob.dataValues.id,   // Pass the DB Job ID so the worker knows what to update
        imageId: newImage.id, 
        s3Url 
      });

      global.channel.sendToQueue(process.env.QUEUE_NAME || 'image_processing', Buffer.from(message), {
        persistent: true 
      });

      console.log(`Message sent to RabbitMQ for Job ID: ${newJob.dataValues.id}`);
    }

    res.status(202).json({ jobId: newJob.id, status: 'queued' });
  } catch (err) {
    console.log("Upload Error:", err);
    res.status(500).send("Failed to create job");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server 1 (Producer) listening on port ${PORT}`);
  // init();
});
