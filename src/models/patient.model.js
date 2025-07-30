const { DataTypes, Model } = require('sequelize');

class Patient extends Model {
  /**
   * Define associations for the Patient model
   * @param {Object} models - All Sequelize models
   */
  static associate(models) {
    // One Patient can have many Appointments
    Patient.hasMany(models.Appointment, { foreignKey: 'patientId', as: 'appointments' });

    // Each Patient belongs to a Clinic
    Patient.belongsTo(models.Clinic, { foreignKey: 'clinicId', as: 'clinic' });
    Patient.hasOne(models.Mammography, { foreignKey: 'patientId', as: 'mammography' });

    Patient.hasMany(models.Diagnosis, { foreignKey: 'patientId', as: 'diagnoses' });

    // A Patient can have many Queues
    Patient.hasMany(models.Queue, { foreignKey: 'patientId', as: 'queues' });

    Patient.belongsToMany(models.Camp, {
      through: 'camp_patients', // Junction table
      foreignKey: 'patientId',
      otherKey: 'campId',
      as: 'camps',
    });

    Patient.hasMany(models.GeneralPhysicianRecord, { foreignKey: 'patientId', as: 'gpRecords' });
  }
}

/**
 * Initialize the Patient model schema
 * @param {Sequelize} sequelize - The Sequelize instance
 */

const initModel = (sequelize) => {
  Patient.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      regNo: {
        type: DataTypes.INTEGER,
        // unique: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name is required' },
        },
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sex: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: false,
      },
      mobile: {
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true,
        validate: {
          isNumeric: { msg: 'Mobile number must contain only digits' },
          len: {
            args: [10, 15],
            msg: 'Mobile number must be between 10 and 15 digits',
          },
        },
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      clinicId: {
        type: DataTypes.UUID,
        allowNull: false, // Each patient must belong to a clinic
        references: {
          model: 'clinics', // References the `clinics` table
          key: 'id',
        },
        onDelete: 'CASCADE', // Automatically delete patients if the clinic is deleted
        onUpdate: 'CASCADE',
      },
      primaryDoctor: {
        type: DataTypes.JSON,
        allowNull: true, // Each patient must belong to a clinic
      },
    },
    {
      sequelize,
      modelName: 'Patient',
      tableName: 'patients',
      timestamps: true,
      underscored: true,
    }
  );
};

module.exports = { Patient, initModel };
