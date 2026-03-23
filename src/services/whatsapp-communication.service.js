const whatsappProvider = require('../providers/whatsapp');
const logger = require('../config/logger');

/**
 * Sends a single WhatsApp template message
 * @param {string} recipientPhone - Recipient phone with country code (e.g. 919876543210)
 * @param {string} templateId - Gupshup template ID
 * @param {object} params - Key-value pairs for template variables e.g. { name: 'John', date: '1 Apr' }
 * @returns {object} - { providerMessageId, raw }
 */
const sendWhatsAppMessage = async (recipientPhone, templateId, params = {}) => {
  logger.info(`[WhatsappService] Sending message to ${recipientPhone} using template ${templateId}`);
  const result = await whatsappProvider.sendTemplateMessage(recipientPhone, templateId, params);
  return result;
};

/**
 * Fetches all available templates from Gupshup account
 * @param {object} options - { page, pageSize }
 * @returns {Array} - List of templates from Gupshup
 */
const getRemoteTemplates = async ({ page = 0, pageSize = 20 } = {}) => {
  logger.info(`[WhatsappService] Fetching remote templates`);
  const templates = await whatsappProvider.fetchTemplates({ page, pageSize });
  return templates;
};

module.exports = {
  sendWhatsAppMessage,
  getRemoteTemplates,
};
