const { DataTypes, Model } = require('sequelize');

class Mammography extends Model {
  static associate(models) {
    // Each Mammography record belongs to a Patient
    Mammography.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
  }
}

const initModel = (sequelize) => {
  Mammography.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      menstrualAge: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      lastMenstrualDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      cycleType: {
        type: DataTypes.ENUM('Regular', 'Irregular'),
        allowNull: true,
      },
      obstetricHistory: {
        type: DataTypes.JSONB,
        defaultValue: { g: false, p: false, l: false },
        allowNull: false,
      },
      menopause: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
      },
      familyHistory: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
      },
      familyHistoryDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
   
      firstDegreeRelatives: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
      },
      previousCancer: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
      },
      previousBiopsy: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
      },
      previousSurgery: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
      },
      implants: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
      },
      screeningImage: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      mammoReport: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      smoking: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
      },
      smokingDetails: {
        type: DataTypes.JSONB,
        defaultValue: { packsPerDay: null, yearsSmoked: null },
        allowNull: false,
      },
      imagingStudies: {
        type: DataTypes.JSONB,
        defaultValue: { location: '', type: '', date: null },
        allowNull: false,
      },
      lump: {
        type: DataTypes.ENUM('No', 'Right', 'Left', 'Both'),
        allowNull: true,
      },
      discharge: {
        type: DataTypes.ENUM('No', 'Right', 'Left', 'Both'),
        allowNull: true,
      },
      dischargeDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      skinChanges: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
      },
      skinChangesDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      nippleRetraction: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
      },
      nippleRetractionDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      additionalInfo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      relevantDiagnosis: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
      },
      relevantDiagnosisDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pain: {
        type: DataTypes.ENUM('Yes', 'No'),
        allowNull: true,
      },
      patientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Mammography',
      tableName: 'mammographies',
      timestamps: true,
      underscored: true,
    }
  );
};

module.exports = { Mammography, initModel };
