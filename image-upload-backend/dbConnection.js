const { Sequelize } = require('sequelize');

// --- 1. Database Configuration ---
// Replace the placeholders with your actual database credentials
const databaseConfig = {
  database: process.env.DB_NAME,  // e.g., 'my_app_db'
  username: process.env.DB_USER,  // e.g., 'root'
  password: process.env.DB_PASSWORD,  // e.g., 'mysecretpassword'
  host: process.env.DB_HOST,               // e.g., '127.0.0.1' or a remote host
  dialect: 'mysql',
  logging: false, // Set to true to see SQL queries in the console
};

// --- 2. Create a Sequelize instance (connection) ---
const sequelize = new Sequelize(
  databaseConfig.database, 
  databaseConfig.username,
  databaseConfig.password,
  {
    port: process.env.DB_PORT,
    host: databaseConfig.host,
    dialect: databaseConfig.dialect,
    logging: databaseConfig.logging,
    // Optional: Other options like pool configuration
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+00:00', 
    dialectOptions: {
      // --- KEY CHANGE 2: Proper Date Handling ---
      // Removing typeCast: true (which can be unpredictable)
      // Keeping dateStrings: true to prevent JS Date object conversion
      dateStrings: true,
      typeCast: function (field, next) { 
        if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
          return field.string(); // Return the raw string from DB
        }
        return next();
      },
    },
  },
);

// --- 3. Test the connection ---
async function connectToDatabase() {
  try {
    // Authenticate attempts to connect to the database
    await sequelize.authenticate();
    console.log('✅ Connection to the MySQL database has been established successfully.');

    // At this point, you can define and sync your models (e.g., User, Product)
    // require('./models/User')(sequelize, DataTypes);
    // await sequelize.sync();
    // console.log('Database and tables synchronized.');

  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

connectToDatabase();

// --- Export the instance for use in other parts of the application ---
module.exports = sequelize;