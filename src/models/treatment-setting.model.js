const { DataTypes, Model } = require('sequelize');

class TreatmentSetting extends Model {
  static associate(models) {
    // Each TreatmentSetting belongs to a Diagnosis
    TreatmentSetting.belongsTo(models.Treatment, {
      foreignKey: 'treatmentId',
      as: 'treatment',
      onDelete: 'CASCADE', // Automatically delete related TreatmentSettings
      onUpdate: 'CASCADE',
    });
  }
}

const initModel = (sequelize) => {
  TreatmentSetting.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      treatmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      treatmentStatus: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      additionalDetails: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      treatmentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'treatments',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      xrayStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      xray: {
        type: DataTypes.JSONB,
        allowNull: true, // URLs for X-rays
      },
      treatingDoctor: {
        type: DataTypes.JSON,
        allowNull: true, // Each patient must belong to a clinic
      },
      nextDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      paymentMode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      onlineAmount: {
        type: DataTypes.DECIMAL,
        defaultValue: 0,
      },
      offlineAmount: {
        type: DataTypes.DECIMAL,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'TreatmentSetting',
      tableName: 'treatment_settings',
      timestamps: true,
      underscored: true,
    }
  );
};

module.exports = { TreatmentSetting, initModel };
