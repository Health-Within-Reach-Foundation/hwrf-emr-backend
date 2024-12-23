const { DataTypes, Model } = require('sequelize');

class Queue extends Model {
  /**
   * Define associations for the Queue model
   * @param {Object} models - All Sequelize models
   */
  static associate(models) {
    // A Queue can have many Appointments
    Queue.hasMany(models.Appointment, { foreignKey: 'queueId', as: 'appointments' });
  }
}

const initModel = (sequelize) => {
  Queue.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      queue_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      queue_type: {
        type: DataTypes.ENUM('GP', 'Dentistry', 'Mammography'),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Queue',
      tableName: 'queues',
      timestamps: true,
      underscored: true,
    }
  );
};

module.exports = { Queue, initModel };
