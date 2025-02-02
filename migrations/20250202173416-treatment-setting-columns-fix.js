'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('treatment_settings', 'offline_amount', {
      type: Sequelize.DECIMAL,
      defaultValue: 0,
    });
    await queryInterface.addColumn('treatment_settings', 'online_amount', {
      type: Sequelize.DECIMAL,
      defaultValue: 0,
    });
    await queryInterface.addColumn('treatment_settings', 'paymentStatus', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE treatment_settings
      SET offline_amount = setting_paid_amount,
          paymentMode = 'offline'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('treatment_settings', 'offline_amount');
    await queryInterface.removeColumn('treatment_settings', 'online_amount');
    await queryInterface.removeColumn('treatment_settings', 'paymentStatus');
  }
};