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
        allowNull: false,
      },
      height: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      complaints: {
        type: DataTypes.TEXT,
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
      findings: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      medicine: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      advice: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      followUpDate: {
        type: DataTypes.DATE,
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
