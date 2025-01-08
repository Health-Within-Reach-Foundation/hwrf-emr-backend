const { DataTypes, Model } = require('sequelize');
const { clinicStatus } = require('../config/constants'); // Assuming a status enum for Camp

class Camp extends Model {
  /**
   * Define associations for the Camp model
   * @param {Object} models - All Sequelize models
   */
  static associate(models) {
    // 1. Camp and User - Many-to-Many
    Camp.belongsToMany(models.User, {
      through: 'user_camps', // Junction table for User and Camp
      foreignKey: 'campId',
      otherKey: 'userId',
      as: 'users',
    });

    // 2. Camp and Clinic - Many-to-One
    Camp.belongsTo(models.Clinic, {
      foreignKey: 'clinicId',
      as: 'clinic', // Alias for clinic relation
    });

    // 3. Camp and Patients - Many-to-Many
    Camp.belongsToMany(models.Patient, {
      through: 'camp_patients', // Junction table for Patient and Camp
      foreignKey: 'campId',
      otherKey: 'patientId',
      as: 'patients',
    });

    // 4. Camp and Appointments - One-to-Many
    Camp.hasMany(models.Appointment, {
      foreignKey: 'campId',
      as: 'appointments', // Alias for appointments
    });

    // 5. Camp and Specialties - Many-to-Many
    Camp.belongsToMany(models.Specialty, {
      through: 'camp_specialties', // Junction table for Specialty and Camp
      foreignKey: 'campId',
      otherKey: 'specialtyId',
      as: 'specialties', // Alias for specialties
    });
  }
}

/**
 * Initialize the Camp model schema
 * @param {Sequelize} sequelize - The Sequelize instance
 */
const initModel = (sequelize) => {
  Camp.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organizerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      clinicId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'clinics', // Clinic association
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Camp name is required' },
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
      status: {
        type: DataTypes.ENUM(clinicStatus), // Assuming predefined camp statuses
        defaultValue: 'active',
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Camp',
      tableName: 'camps',
      timestamps: true,
      underscored: true, // Use snake_case column names
      indexes: [
        {
          fields: ['name'], // Index for faster name search
        },
      ],
    }
  );
};

module.exports = { Camp, initModel };
