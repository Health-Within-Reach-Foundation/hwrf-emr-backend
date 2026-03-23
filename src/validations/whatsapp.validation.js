const Joi = require('joi');

const sendMessage = {
  body: Joi.object().keys({
    recipientPhone: Joi.string().required(),
    templateId: Joi.string().required(),
    params: Joi.object().optional().default({}),
    patientId: Joi.string().uuid().optional(),
  }),
};

const getRemoteTemplates = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(0).default(0),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = {
  sendMessage,
  getRemoteTemplates,
};
