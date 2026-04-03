const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

// --- 1. Database Configuration ---
const databaseConfig = {
  database: process.env.DB_NAME || 'snapscale',
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: false, 
};

console.log('🔧 Database Configuration:', databaseConfig);

// --- 2. Create the Sequelize instance ---
// Note: We don't call connectToDatabase here; we define the instance first
let sequelize = null;

// --- 3. Database Initialization Function ---
async function initializeDatabase() {
  const { host, username, password, database, port } = databaseConfig;

  try {
    // A. Connect to MySQL server without a specific database
    const connection = await mysql.createConnection({ 
      host, 
      user: username, 
      password, 
      port 
    });

    // B. Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    console.log(`\n📦 Checked/Created Database: ${database}`);
    await connection.end();

    global.db = new Sequelize(
      databaseConfig.database,
      databaseConfig.username,
      databaseConfig.password,
      {
        host: databaseConfig.host,
        port: databaseConfig.port,
        dialect: databaseConfig.dialect,
        logging: databaseConfig.logging,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        timezone: '+00:00',
        dialectOptions: {
          dateStrings: true,
          typeCast: function (field, next) {
            if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
              return field.string();
            }
            return next();
          },
        },
      }
    );

    // C. Authenticate with Sequelize now that DB exists
    await global.db.authenticate();
    console.log('✅ Connection to the MySQL database has been established successfully.');

  } catch (error) {
    console.error('❌ Database Initialization Error:', error);
    // In K8s, exiting with 1 will trigger a pod restart, which is a good retry strategy
    process.exit(1); 
  }
}

// Execute the init
initializeDatabase();

module.exports = {
  sequelize,
  initializeDatabase
};