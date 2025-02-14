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
    subject = 'Reset password';
    body = `Dear user,
To reset your password, click on this link: ${url}
If you did not request any password resets, then ignore this email.`;
  } else if (type === 'setPassword') {
    subject = 'Set password';
    body = `Dear user,
To set your password, click on this link: ${url}
 If you encounter any issues, please contact the administration.`;
  }

  console.log("returning subject and body", { subject, body });
  return { subject, body };
};
module.exports = emailSubjectBodyForPassword;
