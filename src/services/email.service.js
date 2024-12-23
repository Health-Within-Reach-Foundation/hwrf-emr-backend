const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
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
  await sendEmail(to, subject, text);
};


const sendClinicOnboardingNotification = async (clinicDetails) => {
  const subject = 'New Clinic Onboarding Request';
  
  // Create the link to the superadmin's approval page (this can be the admin dashboard or a special page)
  const onboardingApprovalUrl = `${config.client_domain}/clinics/${clinicDetails.id}`;

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
  await sendEmail(config.superadmin_email, subject, text);
};


module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendClinicOnboardingNotification,
};
