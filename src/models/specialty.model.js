const { DataTypes, Model } = require('sequelize');

class Specialty extends Model {
  static associate(models) {
    // A Specialty can belong to many Clinics
    Specialty.belongsToMany(models.Clinic, {
      through: 'clinic_specialties', // Junction table name
      foreignKey: 'specialtyId',
      as: 'clinics',
    });

    // A specialty can have many appointments
    Specialty.hasMany(models.Appointment, { foreignKey: 'specialtyId', as: 'appointments' });

    Specialty.belongsToMany(models.User, {
      through: 'user_specialties', // Junction table
      foreignKey: 'specialtyId',
      as: 'users',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Specialty.belongsToMany(models.Camp, {
      through: 'camp_specialties',
      foreignKey: 'specialtyId',
      otherKey: 'campId',
      as: 'camps',
    });
  }
}

const initModel = (sequelize) => {
  Specialty.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Prevent duplicate specialties
        validate: {
          notEmpty: { msg: 'Specialty name is required' },
        },
      },
      departmentName: {
        type: DataTypes.STRING,
        allowNull: true,
      }
    },
    {
      sequelize,
      modelName: 'Specialty',
      tableName: 'specialties',
      timestamps: true,
      underscored: true,
    }
  );
};

module.exports = { Specialty, initModel };
