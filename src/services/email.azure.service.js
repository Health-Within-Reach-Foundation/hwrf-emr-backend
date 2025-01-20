const config = require('../config/config.js');
const transporter = require('../config/mail.js');

const sendEmailAzure = async (receivers_email, subject, message, attachment) => {
  // Validate the receivers_email to ensure it's not empty
  if (!receivers_email || (Array.isArray(receivers_email) && receivers_email.length === 0)) {
    console.error('Invalid receiver email address');
    return false;
  }

  // Construct the attachments array conditionally
  const attachments = attachment ? attachment : [];

  // Ensure receivers_email is an array of objects for Azure SDK
  const recipients = Array.isArray(receivers_email)
    ? receivers_email.map((email) => ({ address: email })) // Multiple recipients
    : [{ address: receivers_email }]; // Single recipient

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
    console.log('Mail sent to', receivers_email, 'as', message);
    console.log('Mail sent API function call completed', new Date());
    return !!sendResult; // Check if messageId exists in the response
  } catch (error) {
    console.error('Error sending email:', error);
    return false; // Return false in case of error
  }
};

module.exports = sendEmailAzure;
