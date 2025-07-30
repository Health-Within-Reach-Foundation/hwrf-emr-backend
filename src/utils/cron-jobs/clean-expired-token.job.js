const cron = require('node-cron');
const { Op } = require('sequelize');
const { Token } = require('../../models/token.model');
const logger = require('../../config/logger');



const cleanupTokens = async () => {
  try {
    const now = new Date();
    const deleted = await Token.destroy({
      where: {
        expires: {
          [Op.lt]: now, // Tokens where expires < now
        },
      },
      force: true, // In case paranoid is enabled, force delete
    });

    logger.info(`Deleted ${deleted} expired tokens`);
  } catch (err) {
    logger.error('Error while deleting expired tokens', err);
  }
};

const scheduleTokenCleanup = () => {
  cron.schedule('0 2 * * *', async () => {
    logger.warn('[CRON] Running daily deleting expired tokens...');
    await cleanupTokens();
  });
  
  // For testing purpose
  // cron.schedule('* * * * *', async () => {
  //   logger.warn('[CRON] Running daily deleting expired tokens...');
  //   await cleanupTokens();
  // });
};

module.exports = {
  scheduleTokenCleanup,
};
