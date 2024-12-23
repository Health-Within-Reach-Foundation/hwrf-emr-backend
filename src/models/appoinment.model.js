const { DataTypes, Model } = require('sequelize');

class Appointment extends Model {
  /**
   * Define associations for the Appointment model
   * @param {Object} models - All Sequelize models
   */
  static associate(models) {
    // Each Appointment belongs to a Patient
    Appointment.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });

    // Each Appointment belongs to a Queue
    Appointment.belongsTo(models.Queue, { foreignKey: 'queueId', as: 'queue' });

    // Each Appointment belongs to a Clinic
    Appointment.belongsTo(models.Clinic, { foreignKey: 'clinicId', as: 'clinic' });

    // One Appointment can have many TreatmentRecords
    // Appointment.hasMany(models.TreatmentRecord, { foreignKey: 'appointment_id', as: 'treatment_records' });
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
      token_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('registered', 'in', 'out'),
        allowNull: false,
        defaultValue: 'registered',
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
      queueId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'queues',
          key: 'id',
        },
        onDelete: 'CASCADE',
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
        {
          fields: ['queue_id'], // Index for queue filtering
        },
      ],
    }
  );
};

module.exports = { Appointment, initModel };
