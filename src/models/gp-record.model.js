const { DataTypes, Model } = require('sequelize');

class GeneralPhysicianRecord extends Model {
  /**
   * Define associations for the GeneralPhysicianRecord model
   * @param {Object} models - All Sequelize models
   */
  static associate(models) {
    GeneralPhysicianRecord.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
  }
}

/**
 * Initialize the GeneralPhysicianRecord model schema
 * @param {Sequelize} sequelize - The Sequelize instance
 */
const initModel = (sequelize) => {
  GeneralPhysicianRecord.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      campId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'camps',
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      weight: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      height: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      sugar: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      bp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hb: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      complaints: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      kco: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      findings: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      systemicExamination: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      treatment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      advice: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      medicine: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      followUpDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      onlineAmount: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      offlineAmount: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      findingsOptionsDetails: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      systemicExaminationOptionsDetails: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      otherComplaints: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'GeneralPhysicianRecord',
      tableName: 'general_physician_records',
      timestamps: true,
      underscored: true,
    }
  );
};

module.exports = { GeneralPhysicianRecord, initModel };
