const { DataTypes, Model } = require('sequelize');

class FormFields extends Model {
  /**
   * Define associations for the FormFields model
   * @param {Object} models - All Sequelize models
   */
  static associate(models) {
    // A FormFields belongs to a Clinic
    FormFields.belongsTo(models.Clinic, {
      foreignKey: 'clinicId',
      as: 'clinic',
    });
  }
}

/**
 * Initialize the FormFields model schema
 * @param {Sequelize} sequelize - The Sequelize instance
 */
const initModel = (sequelize) => {
  FormFields.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      clinicId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'clinics', // Clinic association
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      formName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Form name is required' },
        },
      },
      formFieldData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'FormFields',
      tableName: 'form_fields',
      timestamps: true,
      underscored: true, // Use snake_case column names
      indexes: [
        {
          fields: ['form_name'], // Index for faster name search
        },
        {
          fields: ['clinic_id'], // Index for faster clinic-based queries
        },
      ],
    }
  );
};

module.exports = { FormFields, initModel };
