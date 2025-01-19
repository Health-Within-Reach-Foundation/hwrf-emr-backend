// mail.config.js
const { EmailClient } = require('@azure/communication-email');
const config = require('./config');
// Initialize Azure Email Client with Connection String
const connectionString = config.azure_email_connection_string;

// Create an instance of the EmailClient using the Connection String
const transporter = new EmailClient(connectionString);

module.exports = transporter;
