const { DataTypes, Model, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { roles, ermRoles } = require('../config/roles');
const { Clinic } = require('./clinic.model');
const { User } = require('./user.model');

class Role extends Model {
  static associate(models) {
    // Many-to-Many: Roles and Users
    Role.belongsToMany(models.User, {
      through: 'user_roles',
      foreignKey: 'roleId',
      otherKey: 'userId',
      as: 'users',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Role.belongsToMany(models.Permission, {
      through: 'role_permissions', // Junction table
      foreignKey: 'roleId',
      otherKey: 'permissionId',
      as: 'permissions',
    });
  }
}

/**
 * Initialize the User model schema
 * @param {Sequelize} sequelize - The Sequelize instance
 */
const initModel = (sequelize) => {
  Role.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roleName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name is required' },
        },
      },
      roleDescription: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // userId: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: 'users',
      //     key: 'id',
      //   },
      // },
      clinicId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'clinics',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Role',
      tableName: 'roles',
      timestamps: true,
      underscored: true, // Use snake_case column names
    }
  );
};

module.exports = { Role, initModel };
