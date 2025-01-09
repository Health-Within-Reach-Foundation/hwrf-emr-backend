const { DataTypes, Model, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { roles, ermRoles } = require('../config/roles');
const { Role } = require('./role.model');

class User extends Model {
  /**
   * Check if email is already taken
   * @param {string} email - The user's email
   * @param {number} [excludeUserId] - The ID of the user to exclude
   * @returns {Promise<boolean>}
   */
  static async isEmailTaken(email, excludeUserId) {
    const user = await User.findOne({
      where: {
        email,
        ...(excludeUserId && { id: { [Op.ne]: excludeUserId } }),
      },
    });
    return !!user;
  }

  /**
   * Check if the password matches the user's password
   * @param {string} password - Plain text password
   * @returns {Promise<boolean>}
   */
  async isPasswordMatch(password) {
    console.log('checking is passsword correct or not ', password, this.password);
    return bcrypt.compare(password, this.password);
  }

  /**
   * Define associations for the Patient model
   * @param {Object} models - All Sequelize models
   */
  static associate(models) {
    // One User can have many TreatementRecords
    // User.hasMany(models.TreatmentRecord, { foreignKey: 'docter_id', as: 'treatments' });

    // Many-to-Many: Users and Roles
    User.belongsToMany(models.Role, { through: 'user_roles', foreignKey: 'userId', otherKey: 'roleId', as: 'roles' });

    User.belongsTo(models.Clinic, { foreignKey: 'clinicId', as: 'clinic' });

    User.hasMany(models.Token, { foreignKey: 'userId', as: 'tokens' });

    User.belongsToMany(models.Specialty, {
      through: 'user_specialties', // Junction table
      foreignKey: 'userId',
      as: 'specialties',
    });

    User.belongsToMany(models.Camp, {
      through: 'user_camps', // Junction table
      foreignKey: 'userId',
      otherKey: 'campId',
      as: 'camps',
    });
  }
}

/**
 * Initialize the User model schema
 * @param {Sequelize} sequelize - The Sequelize instance
 */

const initModel = (sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name is required' },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { msg: 'Invalid email address' },
        },
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false, // You can make it false if it should be mandatory
        validate: {
          is: {
            args: [/^\+?[1-9]\d{1,14}$/], // A simple validation for an international phone number format
            msg: 'Phone number is invalid',
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [8],
            msg: 'Password must be at least 8 characters long',
          },
          isComplex(value) {
            if (!/\d/.test(value) || !/[a-zA-Z]/.test(value)) {
              throw new Error('Password must contain at least one letter and one number');
            }
          },
        },
      },
      // role: {
      //   type: DataTypes.ENUM(ermRoles),
      //   defaultValue: 'user',
      // },
      clinicId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'clinics',
          key: 'id',
        },
      },
      specialist: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      currentCampId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      paranoid: true,
      timestamps: true,
      underscored: true, // Use snake_case column names
      hooks: {
        /**
         * Hash the password before saving the user to the database
         */
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 8);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 8);
          }
        },
      },
      defaultScope: {
        attributes: { exclude: ['password'] }, // Exclude password by default
      },
    }
  );
};

module.exports = { User, initModel };
