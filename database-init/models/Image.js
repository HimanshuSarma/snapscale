const { DataTypes } = require('sequelize');

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

const images = global.db.define('images', 
  schema, {
  tableName: 'images',
  timestamps: true,
  createdAt: 'Created_At',
  updatedAt: 'Updated_At',
});

async function syncModel() {
  try {
    await global.db.models.images.sync({
      alter: true
    });
    console.log('✅ The images table was created (or already exists).');
  } catch (error) {
    console.error('❌ Error syncing model:', error);
  }
}

syncModel();

module.exports = {
  images,
};