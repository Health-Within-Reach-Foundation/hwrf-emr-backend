const { DataTypes, Model } = require('sequelize');

class FormTemplate extends Model {
  /**
   * Define associations for the FormTemplate model
   * @param {Object} models - All Sequelize models
   */
  static associate(models) {
    // A FormTemplate belongs to a Clinic
    FormTemplate.belongsTo(models.Clinic, {
      foreignKey: 'clinicId',
      as: 'clinic',
    });
  }
}

/**
 * Initialize the FormTemplate model schema
 * @param {Sequelize} sequelize - The Sequelize instance
 */
const initModel = (sequelize) => {
  FormTemplate.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Form name is required' },
        },
      },
      formData: {
        type: DataTypes.JSONB,
        allowNull: false,
        validate: {
          isValidJsonArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('formData must be a valid JSON array of objects');
            }
            if (!value.every((item) => typeof item === 'object' && item !== null)) {
              throw new Error('Each item in formData must be a valid JSON object');
            }
          },
        },
        comment: 'Stores the form fields as an array of JSON objects',
      },
    },
    {
      sequelize,
      modelName: 'FormTemplate',
      tableName: 'form_templates',
      timestamps: true,
      underscored: true, // Use snake_case column names
      indexes: [
        {
          fields: ['name'], // Index for faster name search
        },
        {
          fields: ['clinic_id'], // Index for faster clinic-based queries
        },
      ],
    }
  );
};

module.exports = { FormTemplate, initModel };
