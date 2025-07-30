// whatsappService.js - Service to send WhatsApp messages
const axios = require('axios');
const config = require('../config/config');

/**
 * Sends a WhatsApp template message via Meta Cloud API
 * @param {string} recipientPhone - The patient's phone number (must include country code)
 * @param {string} templateName - The name of the approved WhatsApp template
 * @param {Array} templateVariables - The dynamic parameters for the template
 */
const sendWhatsAppMessage = async (recipientPhone, templateName, templateVariables = []) => {
  console.log('config.whatsapp.api_url', config.whatsapp.api_url);
  console.log('config.whatsapp.phone_number_id', config.whatsapp.phone_number_id);
  console.log('config.whatsapp.access_token', config.whatsapp.access_token);
  try {
    const url = `${config.whatsapp.api_url}/${config.whatsapp.phone_number_id}/messages`;
    const headers = {
      Authorization: `Bearer ${config.whatsapp.access_token}`,
      'Content-Type': 'application/json',
    };

    const payload = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: templateVariables.map((variable) => ({
              type: 'text',
              text: variable,
            })),
          },
        ],
      },
    };

    const response = await axios.post(url, payload, { headers });
    console.log(`✅ Message sent to ${recipientPhone}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp message:`, error.response?.data || error.message);
    throw new Error('WhatsApp message sending failed');
  }
};

/**
 * Sends a WhatsApp template message to multiple recipients
 * @param {Array} recipients - List of patient phone numbers (must include country code)
 * @param {string} templateName - The name of the approved WhatsApp template
 * @param {Array} templateVariables - The dynamic parameters for the template (same for all)
 */
const broadcastWhatsAppMessage = async (recipients, templateName, templateVariables = []) => {
  try {
    const url = `${config.whatsapp.api_url}/${config.whatsapp.phone_number_id}/messages`;
    const headers = {
      Authorization: `Bearer ${config.whatsapp.access_token}`,
      'Content-Type': 'application/json',
    };

    // Send message to each recipient
    const responses = await Promise.all(
      recipients.map(async (recipientPhone) => {
        const payload = {
          messaging_product: 'whatsapp',
          to: recipientPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: templateVariables.map((variable) => ({
                  type: 'text',
                  text: variable,
                })),
              },
            ],
          },
        };

        try {
          const response = await axios.post(url, payload, { headers });
          console.log(`✅ Message sent to ${recipientPhone}`);
          return { recipientPhone, status: 'success', response: response.data };
        } catch (error) {
          console.error(`❌ Failed for ${recipientPhone}:`, error.response?.data || error.message);
          return { recipientPhone, status: 'failed', error: error.response?.data || error.message };
        }
      })
    );

    return responses;
  } catch (error) {
    console.error(`❌ Broadcast failed:`, error.message);
    throw new Error('Broadcast message sending failed');
  }
};

module.exports = {
  sendWhatsAppMessage,
  broadcastWhatsAppMessage,
};
