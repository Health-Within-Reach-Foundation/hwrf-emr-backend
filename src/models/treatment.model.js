const { DataTypes, Model } = require('sequelize');

class Treatment extends Model {
  static associate(models) {
    // Each Treatment belongs to a Diagnosis
    Treatment.belongsTo(models.Diagnosis, {
      foreignKey: 'diagnosisId',
      as: 'diagnosis',
      onDelete: 'CASCADE', // Automatically delete related TreatmentSettings
      onUpdate: 'CASCADE',
    });

    Treatment.hasMany(models.TreatmentSetting, {
      foreignKey: 'treatmentId',
      as: 'treatmentSettings',
    });
  }
}

const initModel = (sequelize) => {
  Treatment.init(
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
      treatments: {
        type: DataTypes.ARRAY(DataTypes.STRING),
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
      totalAmount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      paidAmount: {
        type: DataTypes.DECIMAL,
        defaultValue: 0,
      },
      remainingAmount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      paymentStatus: {
        type: DataTypes.ENUM('paid', 'pending'),
        defaultValue: 'pending',
      },
      status: {
        type: DataTypes.ENUM('started', 'completed','not started'),
        defaultValue: 'started',
      },
      diagnosisId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'diagnoses',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    {
      sequelize,
      modelName: 'Treatment',
      tableName: 'treatments',
      timestamps: true,
      underscored: true,
    }
  );
};

module.exports = { Treatment, initModel };
