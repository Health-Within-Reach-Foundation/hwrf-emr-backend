// const { DataTypes, Model, Op } = require('sequelize');

// class UserRole extends Model {
  
//   static associate(models) {
    

//   }
// }

// /**
//  * Initialize the User model schema
//  * @param {Sequelize} sequelize - The Sequelize instance
//  */
// const initModel = (sequelize) => {

//   UserRole.init(
//     {
//       userId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         references: {
//           model: 'users',
//           key: 'id',
//         },
//       },
//       roleId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         references: {
//           model: 'roles',
//           key: 'id',
//         },
//       },
//     },
//     {
//       sequelize,
//       modelName: 'UserRole',
//       tableName: 'user_roles',
//       timestamps: true,
//       underscored: true, // Use snake_case column names
//     }
//   );
// };

// module.exports = { UserRole, initModel };
