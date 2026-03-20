const transporter = require('../config/mail');
const logger = require('../config/logger');

const MAX_RETRIES = 3;

/**
 * Internal recursive helper — attempts to send via Azure and retries on transient failures.
 *
 * @param {Object} emailMessage - The Azure email message payload.
 * @param {string|string[]} receiversEmail - For logging purposes.
 * @param {number} attempt - Current attempt number (1-based).
 * @returns {Promise<boolean>}
 */
const attemptSend = async (emailMessage, receiversEmail, attempt) => {
  logger.info(`sendEmailAzure: Attempt ${attempt}/${MAX_RETRIES} — sending to ${JSON.stringify(receiversEmail)}`);

  try {
    // beginSend returns a poller; pollUntilDone() drives it to completion.
    const poller = await transporter.beginSend(emailMessage);
    const result = await poller.pollUntilDone();

    logger.info(`sendEmailAzure: Delivery status = ${result?.status}, messageId = ${result?.id}`);

    if (result?.error) {
      const errCode = result.error?.code || '';
      const errMsg = result.error?.message || String(result.error);

      // Suppression — Azure has blocked this recipient. Retrying won't help.
      if (errCode.includes('Suppressed') || errMsg.includes('Suppressed')) {
        logger.warn(
          `sendEmailAzure: Recipient suppressed by Azure (${errCode}). ` +
            `Remove the address from the Azure Communication Services suppression list ` +
            `in the portal. Recipient: ${JSON.stringify(receiversEmail)}`
        );
        return false;
      }

      // Transient delivery error — retry if attempts remain.
      logger.error(`sendEmailAzure: Delivery error on attempt ${attempt}: [${errCode}] ${errMsg}`);
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => {
          setTimeout(resolve, 1500 * attempt);
        });
        return attemptSend(emailMessage, receiversEmail, attempt + 1);
      }
      return false;
    }

    logger.info(
      `sendEmailAzure: Email successfully sent to ${JSON.stringify(receiversEmail)} at ${new Date().toISOString()}`
    );
    return true;
  } catch (error) {
    const errMsg = error?.message || String(error);

    // Suppression surfaces as a thrown exception too.
    if (errMsg.includes('Suppressed')) {
      logger.warn(
        `sendEmailAzure: Recipient suppressed by Azure. ` +
          `Remove the address from the Azure Communication Services suppression list ` +
          `in the portal. Recipient: ${JSON.stringify(receiversEmail)} | Error: ${errMsg}`
      );
      return false;
    }

    logger.error(`sendEmailAzure: Exception on attempt ${attempt}: ${errMsg}`);
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => {
        setTimeout(resolve, 1500 * attempt);
      });
      return attemptSend(emailMessage, receiversEmail, attempt + 1);
    }
  }

  logger.error(`sendEmailAzure: All ${MAX_RETRIES} attempts failed for ${JSON.stringify(receiversEmail)}`);
  return false;
};

/**
 * Sends an email using Azure's email service.
 *
 * @param {string|string[]} receiversEmail - Recipient email address(es).
 * @param {string} subject - Email subject.
 * @param {string} message - Plain text / HTML body.
 * @param {Object[]} [attachment] - Optional attachments array.
 * @returns {Promise<boolean>} - true if delivered successfully, false otherwise.
 */
const sendEmailAzure = async (receiversEmail, subject, message, attachment) => {
  if (!receiversEmail || (Array.isArray(receiversEmail) && receiversEmail.length === 0)) {
    logger.error('sendEmailAzure: Invalid or empty receiver email address');
    return false;
  }

  const attachments = attachment || [];

  const recipients = Array.isArray(receiversEmail)
    ? receiversEmail.map((email) => ({ address: email }))
    : [{ address: receiversEmail }];

  const emailMessage = {
    senderAddress: process.env.MAIL_ALIAS_USER,
    content: {
      subject: subject || 'No Subject',
      plainText: message || ' ',
      html: message || '<p>No message provided</p>',
    },
    recipients: { to: recipients },
    attachments: attachments.length > 0 ? attachments : undefined,
  };

  return attemptSend(emailMessage, receiversEmail, 1);
};

module.exports = sendEmailAzure;
