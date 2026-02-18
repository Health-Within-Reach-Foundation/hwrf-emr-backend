/**
 * Sequelize Migration
 * Add referral_source column to patients table
 *
 * Description: Adds a new optional column 'referral_source' to the patients table
 * to track the source of patient referral (e.g., doctor, website, social media, etc.)
 *
 * Timestamp: 2025-02-08
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add referral_source column to patients table
      await queryInterface.addColumn(
        'patients',
        'referral_source',
        {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Source of patient referral (e.g., doctor, website, social media, etc.)',
        },
        { transaction }
      );

      await transaction.commit();
      console.log('✓ Migration completed: Added referral_source column to patients table');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove referral_source column from patients table
      await queryInterface.removeColumn('patients', 'referral_source', { transaction });

      await transaction.commit();
      console.log('✓ Migration rollback completed: Removed referral_source column from patients table');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration rollback failed:', error);
      throw error;
    }
  },
};
