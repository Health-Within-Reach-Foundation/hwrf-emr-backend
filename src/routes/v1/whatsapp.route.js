const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const whatsappCtrl = require('../../controllers/whatsapp.controller');
const whatsappValid = require('../../validations/whatsapp.validation');

const router = express.Router();

router.post('/messages/send', auth(), validate(whatsappValid.sendMessage), whatsappCtrl.sendMessage);

router.get('/templates/remote', auth(), validate(whatsappValid.getRemoteTemplates), whatsappCtrl.getRemoteTemplates);

module.exports = router;
