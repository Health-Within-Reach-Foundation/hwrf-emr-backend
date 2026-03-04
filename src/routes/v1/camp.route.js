const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { campValidation } = require('../../validations');
const { campController } = require('../../controllers');

const router = express.Router();

router
  .get('/', auth(), campController.getCamps)
  .post('/', auth(), validate(campValidation.createCamp), campController.createCamp);

router.post('/set-camp', auth(), campController.setCurrentCamp);

router.post('/analytics', auth(), campController.getAllCampsAnalytics);
router
  .route('/:campId')
  .get(
    auth(),
    // roleAuthorization('admin', 'organizer'),
    validate(campValidation.getCampById),
    campController.getCampById
  )
  .patch(auth(), validate(campValidation.updateCampById), campController.updateCampById);

module.exports = router;
