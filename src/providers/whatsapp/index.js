const config = require('../../config/config');
const gupshup = require('./gupshup.provider');

const providers = {
  gupshup,
};

const whatsappProvider = providers[config.whatsapp.provider];

if (!whatsappProvider) {
  throw new Error(`Unknown WhatsApp provider: ${config.whatsapp.provider}`);
}

module.exports = whatsappProvider;
