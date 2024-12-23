const { DataTypes, Model } = require('sequelize');
const { clinicStatus } = require('../config/constants');

class Clinic extends Model {
  static associate(models) {
    Clinic.hasMany(models.User, { foreignKey: 'clinicId', as: 'users' });

    // A Clinic can have many Patients
    Clinic.hasMany(models.Patient, { foreignKey: 'clinicId', as: 'patients' });
    // A Clinic can have many Appointments
    Clinic.hasMany(models.Appointment, { foreignKey: 'clinicId', as: 'appointments' });

     // A Clinic can have many Specialties
     Clinic.belongsToMany(models.Specialty, {
      through: 'clinic_specialties', // Junction table name
      foreignKey: 'clinicId',
      as: 'specialties',
    });
  }
}

const initModel = (sequelize) => {
  Clinic.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      clinicName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name is required' },
        },
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          isNumeric: { msg: 'Mobile number must contain only digits' },
          // len: {
          //   args: [10, 15],
          //   msg: 'Mobile number must be between 10 and 15 digits',
          // },
        },
      },
      contactEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          isEmail: { msg: 'Invalid email address' },
        },
      },
      status: {
        type: DataTypes.ENUM(clinicStatus),
        defaultValue: 'pending',
      },
    },
    {
      sequelize,
      modelName: 'Clinic',
      tableName: 'clinics',
      timestamps: true,
      underscored: true, // Use snake_case column names
      indexes: [
        {
          fields: ['clinic_name'], // Add optional index for name (if used frequently for searching)
        },
      ],
    }
  );
};

module.exports = { Clinic, initModel };
