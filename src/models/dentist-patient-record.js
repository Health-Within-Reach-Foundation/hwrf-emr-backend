const { DataTypes, Model } = require('sequelize');

class DentistPatientRecord extends Model {
  static associate(models) {
    // DentistPatientRecord belongs to a PatientRecord
    DentistPatientRecord.belongsTo(models.PatientRecord, { foreignKey: 'recordId', as: 'record' });
  }
}

const initModel = (sequelize) => {
  DentistPatientRecord.init(
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
      treatment: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      dentalQuadrant: {
        type: DataTypes.JSONB,
        allowNull: true,
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
      // billing: {
      //   type: DataTypes.JSONB,
      //   allowNull: true, // JSON object for billing details
      // },
    },
    {
      sequelize,
      modelName: 'DentistPatientRecord',
      tableName: 'dentist_patient_records',
      timestamps: true,
      underscored: true,
    }
  );
};

module.exports = { DentistPatientRecord, initModel };
