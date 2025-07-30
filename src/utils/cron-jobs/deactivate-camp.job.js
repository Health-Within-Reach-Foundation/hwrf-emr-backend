const cron = require('node-cron');
const { Op } = require('sequelize');
const { Camp } = require('../../models/camp.model');
const { User } = require('../../models/user.model');
const logger = require('../../config/logger');

/**
 * Updates the status of Camp records to "inactive" where the endDate has passed,
 * and resets `currentCampId` for users assigned to those camps.
 */
const updateCampStatus = async () => {
  try {
    // Step 1: Find expired camps that are still active
    const expiredCamps = await Camp.findAll({
      where: {
        endDate: { [Op.lt]: new Date() }, // Camps with endDate before today
        status: { [Op.ne]: 'inactive' }, // Only update active camps
      },
      attributes: ['id'], // We only need the camp IDs
    });

    if (!expiredCamps.length) {
      logger.warn('[CRON] No active camps found for deactivation.');
      return;
    }

    // Extract camp IDs
    const expiredCampIds = expiredCamps.map((camp) => camp.id);

    // Step 2: Update those camps to "inactive"
    await Camp.update(
      { status: 'inactive' },
      {
        where: {
          id: { [Op.in]: expiredCampIds },
        },
      }
    );
    logger.warn(`[CRON] Updated ${expiredCampIds.length} camp(s) to inactive status.`);

    // Step 3: Find users whose `currentCampId` is in the list of inactivated camps
    const affectedUsers = await User.findAll({
      where: {
        currentCampId: { [Op.in]: expiredCampIds },
      },
      attributes: ['id', 'name', 'currentCampId'],
    });

    if (!affectedUsers.length) {
      logger.warn('[CRON] No users found with expired camp assignments.');
      return;
    }

    // Step 4: Update users to remove `currentCampId`
    await User.update(
      { currentCampId: null },
      {
        where: {
          currentCampId: { [Op.in]: expiredCampIds },
        },
      }
    );

    logger.warn(`[CRON] Reset currentCampId for ${affectedUsers.length} user(s).`);
  } catch (error) {
    logger.error('[CRON] Error updating camp status and resetting user camp assignments:', error);
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
