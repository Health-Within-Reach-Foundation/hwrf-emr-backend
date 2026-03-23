const axios = require('axios');
const config = require('../../config/config');
const logger = require('../../config/logger');

const { gupshup } = config.whatsapp;

/**
 * Sends a single WhatsApp template message via Gupshup
 * @param {string} destination - Recipient phone number with country code (e.g. 919876543210)
 * @param {string} templateId - Gupshup template ID
 * @param {object} params - Key-value pairs for template variables
 * @returns {object} - { providerMessageId, raw }
 */
const sendTemplateMessage = async (destination, templateId, params = {}) => {
  try {
    const response = await axios.post(
      `${gupshup.baseUrl}/wa/api/v1/template/msg`,
      new URLSearchParams({
        apikey: gupshup.apiKey,
        app_id: gupshup.appId,
        source: gupshup.sourceNumber,
        destination,
        template: JSON.stringify({
          id: templateId,
          params: Object.values(params),
        }),
        'src.name': gupshup.appName,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    logger.info(`[Gupshup] Message sent to ${destination}: ${JSON.stringify(response.data)}`);

    return {
      providerMessageId: response.data?.messageId || response.data?.response?.id || null,
      raw: response.data,
    };
  } catch (error) {
    const errData = error.response?.data || error.message;
    logger.error(`[Gupshup] Failed to send to ${destination}: ${JSON.stringify(errData)}`);
    throw error;
  }
};

/**
 * Fetches all templates from Gupshup account
 * @param {object} options - { page, pageSize }
 * @returns {Array} - List of templates
 */
const fetchTemplates = async ({ page = 0, pageSize = 20 } = {}) => {
  try {
    const response = await axios.get(`${gupshup.baseUrl}/wa/app/${gupshup.appId}/template`, {
      headers: {
        apikey: gupshup.apiKey,
      },
      params: { page, pageSize },
    });

    logger.info(`[Gupshup] Fetched templates for appId ${gupshup.appId}`);
    return response.data?.templates || response.data || [];
  } catch (error) {
    const errData = error.response?.data || error.message;
    logger.error(`[Gupshup] Failed to fetch templates: ${JSON.stringify(errData)}`);
    throw error;
  }
};

/**
 * Submits a template to Gupshup for WhatsApp verification
 * @param {object} templatePayload - Full template definition
 * @returns {object} - Provider response
 */
// TODO: Re-enable when needed
// const submitTemplate = async (templatePayload) => {
//   try {
//     const response = await axios.post(
//       `${gupshup.baseUrl}/wa/api/v1/template/create`,
//       {
//         ...templatePayload,
//         app_id: gupshup.appId,
//         apikey: gupshup.apiKey,
//       },
//       {
//         headers: { 'Content-Type': 'application/json' },
//       }
//     );

//     logger.info(`[Gupshup] Template submitted: ${JSON.stringify(response.data)}`);
//     return response.data;
//   } catch (error) {
//     const errData = error.response?.data || error.message;
//     logger.error(`[Gupshup] Failed to submit template: ${JSON.stringify(errData)}`);
//     throw error;
//   }
// };

module.exports = {
  sendTemplateMessage,
  fetchTemplates,
  // submitTemplate,
};
