const config = require('../config/config');

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

  return { subject, body };
};
module.exports = emailSubjectBodyForPassword;
