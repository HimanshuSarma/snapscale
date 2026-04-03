const { DataTypes } = require('sequelize');
const db = require('../dbConnection');

const schema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
};

const processed_images = db.define('processed_images', 
  schema, {
  tableName: 'processed_images',
  timestamps: true,
  createdAt: 'Created_At',
  updatedAt: 'Updated_At',
});

// async function syncModel() {
//   try {
//     await db.models.processed_images.sync({
//       alter: true
//     });
//     console.log('✅ The processed_images table was created (or already exists).');
//   } catch (error) {
//     console.error('❌ Error syncing model:', error);
//   }
// }

// syncModel();

module.exports = {
  processed_images,
};