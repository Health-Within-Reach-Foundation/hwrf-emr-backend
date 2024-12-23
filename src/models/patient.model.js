const { DataTypes, Model } = require('sequelize');

class Patient extends Model {
  /**
   * Define associations for the Patient model
   * @param {Object} models - All Sequelize models
   */
  static associate(models) {
    // One Patient can have many Appointments
    Patient.hasMany(models.Appointment, { foreignKey: 'patient_id', as: 'appointments' });
   
    // Each Patient belongs to a Clinic
    Patient.belongsTo(models.Clinic, { foreignKey: 'clinicId', as: 'clinic' });
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
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name is required' },
        },
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
