'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // List of diagnosisIds provided by the user
    const diagnosisIds = [
      '2a02c20e-2cd2-427d-8623-7bae1491987a',
      '686f92b5-844e-403a-be70-71ae854a95cd',
      'd00057b5-1dac-4de1-8eb3-bf34aaf26da6',
      'f7db1fae-31bf-4824-ae19-af90edb87d56',
    ];

    // Fetch diagnoses that are missing in the treatments table
    const missingTreatments = await queryInterface.sequelize.query(
      `SELECT d.id, d.complaints, d.treatments_suggested, d.estimated_cost
       FROM diagnoses d
       WHERE d.id IN (:diagnosisIds) 
       AND NOT EXISTS (
         SELECT 1 FROM treatments t WHERE t.diagnosis_id = d.id
       )`,
      {
        replacements: { diagnosisIds },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (missingTreatments.length > 0) {
      // Insert missing treatments
      console.log('Inserting missing treatments:', missingTreatments);
      await queryInterface.bulkInsert(
        'treatments',
        missingTreatments.map((diagnosis) => ({
          id: Sequelize.literal('uuid_generate_v4()'), // Generates a new UUID
          diagnosis_id: diagnosis.id,
          complaints: diagnosis.complaints,
          treatments: diagnosis.treatments_suggested,
          total_amount: diagnosis.estimated_cost,
          remaining_amount: 0,
          status: 'not started',
          paid_amount: 0,
          created_at: new Date(),
          updated_at: new Date(),
        }))
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove treatments that were added
    await queryInterface.bulkDelete('treatments', {
      diagnosisId: diagnosisIds,
    });
  },
};
