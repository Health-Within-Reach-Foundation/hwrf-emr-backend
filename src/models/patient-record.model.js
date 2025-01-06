const { DataTypes, Model } = require('sequelize');

class PatientRecord extends Model {
  static associate(models) {
    // PatientRecord belongs to an Appointment
    PatientRecord.belongsTo(models.Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

    // PatientRecord belongs to a Patient
    PatientRecord.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });

    // PatientRecord can have DentistPatientRecord
    PatientRecord.hasOne(models.DentistPatientRecord, { foreignKey: 'recordId', as: 'dentalData' });
  }
}

const initModel = (sequelize) => {
  PatientRecord.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      billingDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      appointmentId:{
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }
    },
    {
      sequelize,
      modelName: 'PatientRecord',
      tableName: 'patient_records',
      timestamps: true,
      underscored: true,
    }
  );
};

module.exports = { PatientRecord, initModel };
