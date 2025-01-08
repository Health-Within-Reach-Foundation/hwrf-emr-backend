const { DataTypes, Model } = require('sequelize');

class Queue extends Model {
  /**
   * Define associations for the Queue model
   * @param {Object} models - All Sequelize models
   */
  static associate(models) {
   
    // Queue belongs to a Patient
    Queue.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });

    // Queue belongs to a Specialty
    Queue.belongsTo(models.Specialty, { foreignKey: 'specialtyId', as: 'specialty' });

    // One Queue belongs to one Clinic
    Queue.belongsTo(models.Clinic, { foreignKey: 'clinicId', as: 'clinic' });

  }
}

const initModel = (sequelize) => {
  Queue.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      queueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      queueType: {
        type: DataTypes.ENUM('GP', 'Dentistry', 'Mammography'),
      },
      tokenNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      specialtyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'specialties',
          key: 'id',
        },
      },
      patientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id',
        },
      },
      clinicId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'clinics', // References Clinic table
          key: 'id',
        },
        onDelete: 'CASCADE', // Delete queue if clinic is deleted
        onUpdate: 'CASCADE',
      },
      campId: {
        type: DataTypes.UUID,
        allowNull: true, // Optional as queues may not always belong to a camp
        references: {
          model: 'camps', // Reference Camp table
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },      
    },
    {
      sequelize,
      modelName: 'Queue',
      tableName: 'queues',
      timestamps: true,
      underscored: true,
    }
  );
};

module.exports = { Queue, initModel };
