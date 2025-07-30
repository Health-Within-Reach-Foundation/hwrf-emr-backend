const config = require('../config/config');

/**
 * Generates the subject and body for an email based on the type and token provided.
 *
 * @param {string} type - The type of email to generate. Can be 'resetPassword' or 'setPassword'.
 * @param {string} token - The token to be included in the email link.
 * @returns {{subject: string, body: string}} An object containing the subject and body of the email.
 */
const emailSubjectBodyForPassword = (type, token) => {
  let subject, body;
  const url = `${config.client_domain}/auth/set-password/${token}`;
  if (type === 'resetPassword') {
    subject = 'Password Reset Request';
    body = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Dear user,</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <p><a href="${url}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #0a58b8; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Thank you,<br>The Support Team</p>
      </div>
    `;
  } else if (type === 'setPassword') {
    subject = 'Set Your Password';
    body = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Set Your Password</h2>
        <p>Dear user,</p>
        <p>Welcome! Please click the button below to set your password:</p>
        <p><a href="${url}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #0a58b8; text-decoration: none; border-radius: 5px;">Set Password</a></p>
        <p>If you encounter any issues, please contact our support team.</p>
        <p>Thank you,<br>The Support Team</p>
      </div>
    `;
  }

  console.log("returning subject and body", { subject, body });
  return { subject, body };
};

module.exports = emailSubjectBodyForPassword;
