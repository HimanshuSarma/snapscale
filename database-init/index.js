require('dotenv').config();
const { initializeDatabase } = require('./dbConnection');

const setup = async () => {
  await initializeDatabase();
  const { images } = require('./models/Image');
  const { jobs } = require('./models/Job');
  const { processed_images } = require('./models/ProcessedImages');
};

setup();