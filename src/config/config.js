const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    POSTGRES_URL: Joi.string().required().description('Postgres database URL'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30),
    SMTP_HOST: Joi.string(),
    SMTP_PORT: Joi.number(),
    SMTP_USERNAME: Joi.string(),
    SMTP_PASSWORD: Joi.string(),
    EMAIL_FROM: Joi.string(),
    SUPERADMIN_EMAIL: Joi.string(),
    CLIENT_DOMAIN: Joi.string(),
    AZURE_STORAGE_ACCOUNT_NAME: Joi.string().allow('', null).optional(),
    AZURE_STORAGE_ACCOUNT_KEY: Joi.string().allow('', null).optional(),
    AZURE_EMAIL_CONNECTION_STRING: Joi.string().allow('', null).optional(),
    MAIL_ALIAS_USER: Joi.string().allow('', null).optional(),
    WA_API_URL: Joi.string().allow('', null).optional(),
    WA_PHONE_NUMBER_ID: Joi.string().allow('', null).optional(),
    WA_ACCESS_TOKEN: Joi.string().allow('', null).optional(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  pg: {
    url: envVars.POSTGRES_URL,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  superadmin_email: envVars.SUPERADMIN_EMAIL,
  client_domain: envVars.CLIENT_DOMAIN,
  azure_storage_account_name: envVars.AZURE_STORAGE_ACCOUNT_NAME,
  azure_storage_account_key: envVars.AZURE_STORAGE_ACCOUNT_KEY,
  mail_alias_user: envVars.MAIL_ALIAS_USER,
  azure_email_connection_string: envVars.AZURE_EMAIL_CONNECTION_STRING,
  whatsapp: {
    api_url: envVars.WA_API_URL,
    phone_number_id: envVars.WA_PHONE_NUMBER_ID,
    access_token: envVars.WA_ACCESS_TOKEN,
  },
};
