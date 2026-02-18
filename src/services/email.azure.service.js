const transporter = require('../config/mail');

/**
 * Sends an email using Azure's email service.
 *
 * @param {string|string[]} receivers_email - The email address or an array of email addresses of the recipients.
 * @param {string} subject - The subject of the email.
 * @param {string} message - The plain text or HTML body of the email.
 * @param {Object[]} [attachment] - An optional array of attachment objects.
 * @returns {Promise<boolean>} - Returns a promise that resolves to true if the email was sent successfully, otherwise false.
 */
const sendEmailAzure = async (receiversEmail, subject, message, attachment) => {
  // Validate the receiversEmail to ensure it's not empty
  if (!receiversEmail || (Array.isArray(receiversEmail) && receiversEmail.length === 0)) {
    console.error('Invalid receiver email address');
    return false;
  }

  // Construct the attachments array conditionally
  const attachments = attachment || [];

  // Ensure receiversEmail is an array of objects for Azure SDK
  const recipients = Array.isArray(receiversEmail)
    ? receiversEmail.map((email) => ({ address: email })) // Multiple recipients
    : [{ address: receiversEmail }]; // Single recipient

  // Construct the email message using Azure's email service
  const emailMessage = {
    senderAddress: process.env.MAIL_ALIAS_USER, // The sender email address
    content: {
      subject: subject || 'No Subject', // Email subject (fallback to "No Subject")
      plainText: message || ' ', // Plain text body of the email
      html: message || '<p>No message provided</p>', // HTML body of the email (fallback message)
    },
    recipients: {
      to: recipients, // Ensure the recipients are formatted correctly
    },
    attachments: attachments.length > 0 ? attachments : undefined, // Attachments if any
  };

  try {
    // Send the email using the Azure SDK's beginSend method
    const sendResult = await transporter.beginSend(emailMessage); // Using beginSend
    console.log('Mail sent to', receiversEmail, 'as', message);
    console.log('Mail sent API function call completed', new Date());
    return !!sendResult; // Check if messageId exists in the response
  } catch (error) {
    console.error('Error sending email:', error);
    return false; // Return false in case of error
  }
};

module.exports = sendEmailAzure;
