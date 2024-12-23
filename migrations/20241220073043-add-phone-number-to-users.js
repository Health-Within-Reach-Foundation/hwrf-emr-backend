'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the phone_number column with a default value (or allow nulls for existing rows)


    // Optionally, update existing rows to have a valid default value for phone_number
    await queryInterface.sequelize.query(
      `UPDATE "users" SET "phone_number" = '' WHERE "phone_number" IS NULL;`
    );

    // Then, you can alter the column to make it NOT NULL if required
    await queryInterface.changeColumn('users', 'phone_number', {
      type: Sequelize.STRING,
      allowNull: false, // Make it NOT NULL after handling existing records
    });
  },

  down: async (queryInterface, Sequelize) => {
    // In the down method, remove the phone_number column if you need to rollback
    await queryInterface.removeColumn('users', 'phone_number');
  }
};
