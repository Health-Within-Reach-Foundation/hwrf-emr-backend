const { DataTypes, Model } = require('sequelize');

class Specialty extends Model {
  static associate(models) {
    // A Specialty can belong to many Clinics
    Specialty.belongsToMany(models.Clinic, {
      through: 'clinic_specialties', // Junction table name
      foreignKey: 'specialtyId',
      as: 'clinics',
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
