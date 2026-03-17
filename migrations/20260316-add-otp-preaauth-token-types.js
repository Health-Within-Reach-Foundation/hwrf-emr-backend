'use strict';

module.exports = {
  up: async (queryInterface) => {
    // For PostgreSQL — adds new enum values to the existing type
    await queryInterface.sequelize.query("ALTER TYPE enum_tokens_type ADD VALUE IF NOT EXISTS 'otp';");
    await queryInterface.sequelize.query("ALTER TYPE enum_tokens_type ADD VALUE IF NOT EXISTS 'preAuth';");
  },

  down: async () => {
    // PostgreSQL does not support removing ENUM values directly.
    // To roll back, you would need to recreate the type without these values.
    console.warn('Rollback not supported for ENUM value removal in PostgreSQL');
  },
};
