'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add otp and preAuth values to the enum_tokens_type enum
      await queryInterface.sequelize.query(`ALTER TYPE "enum_tokens_type" ADD VALUE IF NOT EXISTS 'otp';`, { transaction });
      await queryInterface.sequelize.query(`ALTER TYPE "enum_tokens_type" ADD VALUE IF NOT EXISTS 'preAuth';`, {
        transaction,
      });

      await transaction.commit();
      console.log('✓ Migration completed: Added otp and preAuth to enum_tokens_type');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration failed:', error);
      throw error;
    }
  },

  down: async () => {
    console.log('⚠ Rollback not supported for enum value removal in PostgreSQL');
  },
};
