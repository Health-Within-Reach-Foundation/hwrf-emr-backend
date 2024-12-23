const db = require('../models');
const logger = require('../config/logger');

/**
 * Syncs the database models with the database schema.
 * This function is typically called during application initialization.
 * @param {Object} options - Options for syncing the database.
 * @param {boolean} options.force - If true, drops existing tables and recreates them.
 * @param {boolean} options.alter - If true, attempts to make schema changes without dropping tables.
 */
const initializeDatabase = async ({ force = false, alter = false } = {}) => {
  try {
    logger.info('Starting database synchronization...');
    db.sequelize.authenticate().then(() => {

      const defineUuidGenerateFunction = async () => {
        await db.sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
      };
      defineUuidGenerateFunction();
      // console.log("Connected to Database");
    })
    logger.info('Database connection has been established successfully.');

    await db.sequelize.sync({ force, alter });
    if (force) {
      logger.warn('All tables dropped and recreated (force sync).');
    } else if (alter) {
      logger.info('Database schema altered to match models (alter sync).');
    } else {
      logger.info('Database synchronized successfully.');
    }
  } catch (error) {
    logger.error('Unable to sync database:', error);
    throw error;
  }
};

module.exports = initializeDatabase;
