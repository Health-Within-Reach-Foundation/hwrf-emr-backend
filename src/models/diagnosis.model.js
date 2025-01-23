const { DataTypes, Model } = require('sequelize');

class Diagnosis extends Model {
  static associate(models) {
    // Each Diagnosis belongs to an Appointment
    // Diagnosis.belongsTo(models.Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

    Diagnosis.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'diagnosis' });

    // Each Diagnosis can have many Treatments
    Diagnosis.hasOne(models.Treatment, { foreignKey: 'diagnosisId', as: 'treatment', });
  }
}

const initModel = (sequelize) => {
  Diagnosis.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      complaints: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
      },
      treatmentsSuggested: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      dentalQuadrantType: {
        type: DataTypes.ENUM('adult', 'child', 'all'),
        defaultValue: 'adult',
      },
      dentalQuadrant: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      selectedTeeth: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      // toothNumber: {
      //   type: DataTypes.ARRAY(DataTypes.INTEGER),
      //   allowNull: true,
      // },
      xrayStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      xray: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true, // URLs for X-rays
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // currentStatus: {
      //   type: DataTypes.ARRAY(DataTypes.TEXT),
      //   allowNull: true,
      // },
      additionalDetails: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      // appointmentId: {
      //   type: DataTypes.UUID,
      //   allowNull: true,
      //   references: {
      //      model: 'appointments',
      //     key: 'id',
      //    },
      //   onDelete: 'CASCADE',
      //   onUpdate: 'CASCADE',
      // },
      patientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Diagnosis',
      tableName: 'diagnoses',
      timestamps: true,
      underscored: true,
    }
  );
};

module.exports = { Diagnosis, initModel };
