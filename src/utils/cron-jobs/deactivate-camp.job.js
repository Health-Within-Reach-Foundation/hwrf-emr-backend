const cron = require('node-cron');
const { Op } = require('sequelize');
const { Camp } = require('../../models/camp.model');
const logger = require('../../config/logger');

/**
 * Updates the status of Camp records to "inactive" where the endDate has passed.
 */
const updateCampStatus = async () => {
  try {
    const result = await Camp.update(
      { status: 'inactive' },
      {
        where: {
          endDate: {
            [Op.lt]: new Date(), // Compare endDate with the current date
          },
          status: { [Op.ne]: 'inactive' }, // Optional: Avoid unnecessary updates
        },
      }
    );
    logger.warn(`[CRON] Updated ${result[0]} camp(s) to inactive status.`);
  } catch (error) {
    logger.error('[CRON] Error updating camp status:', error);
  }
};

// Schedule the cron job to run daily at midnight
const scheduleCampStatusUpdate = () => {
  cron.schedule('0 0 * * *', async () => {
    logger.warn('[CRON] Running daily camp status update...');
    await updateCampStatus();
  });
};

module.exports = { scheduleCampStatusUpdate };
