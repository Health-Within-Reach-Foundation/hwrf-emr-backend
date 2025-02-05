const { DataTypes, Model } = require('sequelize');

class Appointment extends Model {
  /**
   * Define associations for the Appointment model
   * @param {Object} models - All Sequelize models
   */
  static associate(models) {
    // Each Appointment belongs to a Patient
    Appointment.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });

  
    // Each Appointment belongs to a Clinic
    Appointment.belongsTo(models.Clinic, { foreignKey: 'clinicId', as: 'clinic' });

     // Appointment can have one Patient Record
     Appointment.hasMany(models.PatientRecord, { foreignKey: 'appointmentId', as: 'records' });
     
    //  Appointment.hasMany(models.Diagnosis, { foreignKey: 'appointmentId', as: 'diagnoses' });
     
     // An appointment belongs to one specialty
    Appointment.belongsTo(models.Specialty, { foreignKey: 'specialtyId', as: 'specialty' });

    Appointment.belongsTo(models.Camp, {
      foreignKey: 'campId',
      as: 'camp',
    });

  }
}

const initModel = (sequelize) => {
  Appointment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      // token_number: {
      //   type: DataTypes.INTEGER,
      //   allowNull: false,
      // },
      appointmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('in queue', 'in', 'out', 'cancelled'),
        defaultValue: 'in queue',
      },
      statusUpdatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      clinicId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'clinics',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      patientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id',
        },
      },
      specialtyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'specialties',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      campId: {
        type: DataTypes.UUID,
        allowNull: true, // Allow null as some appointments may not belong to a camp
        references: {
          model: 'camps', // Reference Camp table
          key: 'id',
        },
        onDelete: 'SET NULL', // Remove camp association if camp is deleted
        onUpdate: 'CASCADE',
      },
    },
    {
      sequelize,
      modelName: 'Appointment',
      tableName: 'appointments',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['clinic_id'], // Index for clinic filtering
        },
        {
          fields: ['patient_id'], // Index for patient filtering
        },
      ],
    }
  );
};

module.exports = { Appointment, initModel };
