const { DataTypes } = require('sequelize');
const db = require('../dbConnection');

const schema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  imageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'image_id', // Maps the camelCase property to snake_case DB column
    references: {
      model: 'images',
      key: 'id',
    },
  },
  jobType: {
    type: DataTypes.STRING(50),
    defaultValue: 'watermark',
    field: 'job_type'
  },
  status: {
    type: DataTypes.ENUM('queued', 'processing', 'completed', 'failed'),
    defaultValue: 'queued'
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: true
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
};

const jobs = db.define('jobs', 
  schema, {
  tableName: 'jobs',
  timestamps: true,
  createdAt: 'Created_At',
  updatedAt: 'Updated_At',
});

// Optional: Manual sync if you need to create the table immediately
async function syncModel() {
  try {
    await db.models.jobs.sync({
      alter: true
    });
    console.log('✅ The jobs table was created (or already exists).');
  } catch (error) {
    console.error('❌ Error syncing model:', error);
  }
}
syncModel();

module.exports = {
  jobs,
};