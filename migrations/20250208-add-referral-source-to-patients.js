'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'patients',
        'referral_source',
        {
          type: queryInterface.sequelize.Sequelize.STRING,
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

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('patients', 'referral_source', {
        transaction,
      });

      await transaction.commit();
      console.log('✓ Migration rollback completed: Removed referral_source column from patients table');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration rollback failed:', error);
      throw error;
    }
  },
};
