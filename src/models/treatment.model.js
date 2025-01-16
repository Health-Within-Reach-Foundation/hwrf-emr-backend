const { DataTypes, Model } = require('sequelize');

class Treatment extends Model {
  static associate(models) {
    // Each Treatment belongs to a Diagnosis
    Treatment.belongsTo(models.Diagnosis, { foreignKey: 'diagnosisId', as: 'diagnosis' });
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
      treatmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      complaints: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
      },
      
      treatments: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      dentalQuadrant: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      dentalQuadrantType: {
        type: DataTypes.ENUM('adult', 'child'),
        defaultValue: 'adult',
      },
      selectedTeeth: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      xrayStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      xray: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true, // URLs for X-rays
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
