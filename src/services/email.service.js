const { EmailClient } = require('@azure/communication-email');
const config = require('../config/config');
const logger = require('../config/logger');
const emailSubjectBodyForPassword = require('../utils/email-template-password');
const sendEmailAzure = require('./email.azure.service');

/**
 * Verify Azure Email Service Connection on initialization
 */
// if (config.env === 'development') {
try {
  // eslint-disable-next-line no-unused-vars
  const emailClient = new EmailClient(config.azure_email_connection_string);
  logger.info('✅ Azure Email Service client initialized successfully');
} catch (error) {
  logger.warn(`⚠️  Unable to initialize Azure Email Service: ${error.message}`);
  logger.warn('Make sure AZURE_EMAIL_CONNECTION_STRING is configured correctly in .env');
}
// }

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendPasswordEmail = async (to, token, type) => {
  // const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;

  const { subject, body } = emailSubjectBodyForPassword(type, token);
  //   const subject = 'Reset password';
  //   // replace this url with the link to the reset password page of your front-end app
  //   const text = `Dear user,
  // To reset your password, click on this link: ${resetPasswordUrl}
  // If you did not request any password resets, then ignore this email.`;

  console.log('Got the subject and body -->', subject, body);
  await sendEmailAzure(to, subject, body);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmailAzure(to, subject, text);
};

/**
 * Sends an email notification to the superadmin about a new clinic onboarding request.
 *
 * @param {Object} clinicDetails - The details of the clinic requesting onboarding.
 * @param {string} clinicDetails.clinicId - The unique identifier of the clinic.
 * @param {string} clinicDetails.clinicName - The name of the clinic.
 * @param {string} clinicDetails.contactEmail - The contact email of the clinic.
 * @param {string} clinicDetails.address - The address of the clinic.
 * @param {string} clinicDetails.city - The city where the clinic is located.
 * @param {string} clinicDetails.state - The state where the clinic is located.
 * @param {string} clinicDetails.adminName - The name of the clinic's admin.
 * @param {string} clinicDetails.adminEmail - The email of the clinic's admin.
 * @returns {Promise<void>} - A promise that resolves when the email has been sent.
 */
const sendClinicOnboardingNotification = async (clinicDetails) => {
  const subject = 'New Clinic Onboarding Request';

  // Create the link to the superadmin's approval page (this can be the admin dashboard or a special page)
  const onboardingApprovalUrl = `${config.client_domain}/clinics/${clinicDetails.clinicId}`;

  const text = `
    Dear Superadmin,

    A new clinic has requested onboarding to the system. Below are the clinic details:

    Clinic Name: ${clinicDetails.clinicName}
    Contact Email: ${clinicDetails.contactEmail}
    Address: ${clinicDetails.address}, ${clinicDetails.city}, ${clinicDetails.state}
    Admin details: Name: ${clinicDetails.adminName}, Email: ${clinicDetails.adminEmail}

    To approve or reject this clinic, please visit the following link: 
    ${onboardingApprovalUrl}

    If you did not request this, please ignore this email.

    Thank you,
    Your App Team
  `;

  // Send the email using the helper function
  await sendEmailAzure(config.superadmin_email, subject, text);
};

/**
 * Send patient export Excel file via email
 * @param {string} to - Recipient email address
 * @param {Buffer} excelBuffer - Excel file buffer
 * @param {string} filename - Name for the attachment file
 * @returns {Promise}
 */
const sendExcelExportEmail = async (to, excelBuffer, filename) => {
  const subject = 'Patient Export Report';
  const body = `
    <p>Dear User,</p>
    <p>Your patient export report has been generated successfully.</p>
    <p>Please find the attached Excel file: <strong>${filename}</strong></p>
    <p>This report was generated on ${new Date().toLocaleString()}.</p>
    <br/>
    <p>Regards,<br/>HWRF EMR Team</p>
  `;

  const attachment = [
    {
      name: filename,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      contentInBase64: excelBuffer.toString('base64'),
    },
  ];

  return sendEmailAzure(to, subject, body, attachment);
};

/**
 * Send OTP email for 2-step login verification
 * @param {string} to
 * @param {string} otp
 * @returns {Promise}
 */
const sendOtpEmail = async (to, otp) => {
  const subject = 'Your Login OTP - HWRF';
  const text = `Dear user,\n\nYour one-time password (OTP) for login is:\n\n${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.\n\nIf you did not attempt to log in, please ignore this email.\n\nBest regards,\nThe HWRF Team`;
  await sendEmailAzure(to, subject, text);
};

module.exports = {
  sendPasswordEmail,
  sendVerificationEmail,
  sendClinicOnboardingNotification,
  sendExcelExportEmail,
  sendOtpEmail,
};
