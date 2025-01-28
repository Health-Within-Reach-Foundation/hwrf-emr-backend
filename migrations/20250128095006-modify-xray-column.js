'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Add a temporary column `xray_temp` of type JSONB
    await queryInterface.addColumn('diagnoses', 'xray_temp', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('treatments', 'xray_temp', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('treatment_settings', 'xray_temp', {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    // Step 2: Convert existing xray (VARCHAR[]) values to JSONB in the temporary column
    await queryInterface.sequelize.query(`
      UPDATE diagnoses 
      SET xray_temp = (SELECT jsonb_agg(x) FROM unnest(xray) AS x) 
      WHERE xray IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      UPDATE treatments 
      SET xray_temp = (SELECT jsonb_agg(x) FROM unnest(xray) AS x) 
      WHERE xray IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      UPDATE treatment_settings 
      SET xray_temp = (SELECT jsonb_agg(x) FROM unnest(xray) AS x) 
      WHERE xray IS NOT NULL;
    `);

    // Step 3: Remove the old `xray` column
    await queryInterface.removeColumn('diagnoses', 'xray');
    await queryInterface.removeColumn('treatments', 'xray');
    await queryInterface.removeColumn('treatment_settings', 'xray');

    // Step 4: Rename `xray_temp` to `xray`
    await queryInterface.renameColumn('diagnoses', 'xray_temp', 'xray');
    await queryInterface.renameColumn('treatments', 'xray_temp', 'xray');
    await queryInterface.renameColumn('treatment_settings', 'xray_temp', 'xray');
  },

  down: async (queryInterface, Sequelize) => {
    // Step 1: Add a temporary column `xray_temp` of type ARRAY(TEXT)
    await queryInterface.addColumn('diagnoses', 'xray_temp', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    });
    await queryInterface.addColumn('treatments', 'xray_temp', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    });
    await queryInterface.addColumn('treatment_settings', 'xray_temp', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    });

    // Step 2: Convert JSONB back to ARRAY(TEXT)
    await queryInterface.sequelize.query(`
      UPDATE diagnoses 
      SET xray_temp = ARRAY(SELECT jsonb_array_elements_text(xray)) 
      WHERE xray IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      UPDATE treatments 
      SET xray_temp = ARRAY(SELECT jsonb_array_elements_text(xray)) 
      WHERE xray IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      UPDATE treatment_settings 
      SET xray_temp = ARRAY(SELECT jsonb_array_elements_text(xray)) 
      WHERE xray IS NOT NULL;
    `);

    // Step 3: Remove the `xray` column
    await queryInterface.removeColumn('diagnoses', 'xray');
    await queryInterface.removeColumn('treatments', 'xray');
    await queryInterface.removeColumn('treatment_settings', 'xray');

    // Step 4: Rename `xray_temp` back to `xray`
    await queryInterface.renameColumn('diagnoses', 'xray_temp', 'xray');
    await queryInterface.renameColumn('treatments', 'xray_temp', 'xray');
    await queryInterface.renameColumn('treatment_settings', 'xray_temp', 'xray');
  },
};
