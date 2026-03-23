const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { whatsappCommunicationService } = require('../services');

const sendMessage = catchAsync(async (req, res) => {
  const { recipientPhone, templateId, params } = req.body;

  const result = await whatsappCommunicationService.sendWhatsAppMessage(recipientPhone, templateId, params);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'WhatsApp message sent successfully',
    data: result,
  });
});

const getRemoteTemplates = catchAsync(async (req, res) => {
  const { page, pageSize } = req.query;

  const templates = await whatsappCommunicationService.getRemoteTemplates({ page, pageSize });

  res.status(httpStatus.OK).json({
    success: true,
    data: templates,
  });
});

module.exports = {
  sendMessage,
  getRemoteTemplates,
};
