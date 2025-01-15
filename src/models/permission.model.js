const { DataTypes, Model } = require('sequelize');

class Permission extends Model {
  static associate(models) {
    // Many-to-Many relationship with Role
    Permission.belongsToMany(models.Role, {
      through: 'role_permissions', // Junction table
      foreignKey: 'permissionId',
      otherKey: 'roleId',
      as: 'roles',
    });
  }
}

const initModel = (sequelize) => {
  Permission.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Unique permission names
        validate: {
          notEmpty: { msg: 'Permission action is required' },
        },
      },
    },
    {
      sequelize,
      modelName: 'Permission',
      tableName: 'permissions',
      timestamps: true,
      underscored: true,
    }
  );
};

module.exports = { Permission, initModel };
