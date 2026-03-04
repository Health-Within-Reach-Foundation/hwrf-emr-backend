const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const logger = require('../config/logger');
const config = require('../config/config');

const basename = path.basename(__filename);
const db = {};

// Initialize Sequelize
const sequelize = new Sequelize(config.pg.url, {
  logging: (msg) => logger.debug(msg),
  dialect: 'postgres',
  define: {
    timestamps: true, // Automatically manage `createdAt` and `updatedAt`
  },
  dialectOptions: config.env === 'production' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

// Dynamically import and initialize models
fs.readdirSync(__dirname)
  .filter((file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js')
  .forEach((file) => {
    const modelPath = path.join(__dirname, file);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const model = require(modelPath); // Import the model

    if (model.initModel) {
      model.initModel(sequelize); // Initialize the model
    } else {
      logger.warn(`Model at ${modelPath} does not export an initModel method`);
    }
  });

// Populate `db` object with registered models from Sequelize
Object.keys(sequelize.models).forEach((modelName) => {
  db[modelName] = sequelize.models[modelName];
});

// Set up model associations if defined
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db); // Pass the full db object for associations
  }
});

// Export the Sequelize instance and all models
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
