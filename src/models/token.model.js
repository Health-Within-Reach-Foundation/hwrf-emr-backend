// models/token.js
const { DataTypes, Model } = require('sequelize');
const { tokenTypes } = require('../config/tokens');
// const { User } = require('./user.model');

class Token extends Model {
  static associate(models) {
    Token.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

const initModel = (sequelize) => {
  Token.init(
    {
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Optionally make the token unique
        index: true, // Add index on token column for fast lookups
      },
      userId: {
        type: DataTypes.UUID, // Assuming UUID for userId (adjust if necessary)
        allowNull: false,
        references: {
          model: 'users', // Reference to the User model
          key: 'id', // Assuming 'id' is the primary key in the User model
        },
      },
      type: {
        type: DataTypes.ENUM(tokenTypes.ACCESS, tokenTypes.REFRESH, tokenTypes.RESET_PASSWORD,tokenTypes.VERIFY_EMAIL),
        allowNull: false,
      },
      expires: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      blacklisted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      timestamps: true, // Automatically adds createdAt and updatedAt
      modelName: 'Token',
      tableName: 'tokens', // Define the table name if you want a custom one
      paranoid: true, // Soft delete, adding a deletedAt column
      underscored: true, // Use snake_case column names
    }
  );
};

module.exports = {Token, initModel};
