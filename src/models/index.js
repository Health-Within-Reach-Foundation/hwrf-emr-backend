// const fs = require('fs');
// const path = require('path');
// const Sequelize = require('sequelize');
// const logger = require('../config/logger');
// const config = require('../config/config');

// const basename = path.basename(__filename);
// const db = {};

// // Initialize Sequelize using the `pg.url` from config
// const sequelize = new Sequelize(config.pg.url, {
//   logging: (msg) => logger.debug(msg),
//   dialect: 'postgres',
//   define: {
//     // underscored: true, // Use snake_case column names
//     timestamps: true, // Automatically manage `createdAt` and `updatedAt`
//   },
//   dialectOptions: config.env === 'production' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
// });

// // Dynamically import all model files in the `models` folder
// // fs.readdirSync(__dirname)
// //   .filter((file) => {
// //     return (
// //       file.indexOf('.') !== 0 && // Exclude hidden files
// //       file !== basename && // Exclude this index file
// //       file.slice(-3) === '.js' // Include only JavaScript files
// //     );
// //   })
// //   .forEach((file) => {
// //     const modelPath = path.join(__dirname, file);
// //     const model = require(modelPath); // Import the model

// //     // Check if the model has an `init` method for initialization
// //     if (model.initModel) {
// //       console.log("******** model ", model)
// //       model.initModel(sequelize); // Initialize the model
// //       db[model.name] = model; // Add the model to the db object
// //     } else {
// //       logger.warn(`Model at ${modelPath} does not export an initModel method`);
// //     }
// //   });

// fs.readdirSync(__dirname)
//   .filter((file) => {
//     return (
//       file.indexOf('.') !== 0 && // Exclude hidden files
//       file !== basename && // Exclude this index file
//       file.slice(-3) === '.js' // Include only JavaScript files
//     );
//   })
//   .forEach((file) => {
//     const modelPath = path.join(__dirname, file);
//     const model = require(modelPath); // Import the model

//     // Check if the model has an `init` method for initialization
//     if (model.initModel) {
//       console.log('******** Initializing model:', model);
//       model.initModel(sequelize); // Initialize the model

//       // Use Sequelize's model manager to get the registered name
//       const registeredModel = sequelize.modelManager.getModel(model.modelName, { attribute: 'modelName' });
//       if (registeredModel) {
//         console.log(`******** Registered Model Name: ${registeredModel.name}`);
//         db[registeredModel.name] = registeredModel; // Assign the model to the db object
//       } else {
//         logger.warn(`Failed to register model at ${modelPath}`);
//       }
//     } else {
//       logger.warn(`Model at ${modelPath} does not export an initModel method`);
//     }
//   });

// // Set up model associations if defined
// // Object.keys(db).forEach((modelName) => {
// //   console.log('Setting the association', db);
// //   if (db[modelName].associate) {
// //     console.log('Setting the association ---');
// //     db[modelName].associate(db);
// //   }
// // });

// Object.keys(db).forEach((modelName) => {
//   console.log(`Setting up associations for model: ${modelName}`);
//   console.log('Setting the association', db);

//   if (db[modelName].associate) {
//     db[modelName].associate(db); // Pass the full db object
//   }
// });

// // Define relationships

// // Export the Sequelize instance and all models
// db.sequelize = sequelize;
// db.Sequelize = Sequelize;

// module.exports = db;

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
