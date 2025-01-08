const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { campService } = require('../services');

const getCamps = catchAsync(async (req, res) => {
  const camps = await campService.getCamps();
  res.status(httpStatus.OK).json({ camps });
});

const createCamp = catchAsync(async (req, res) => {
  const campData = {
    ...req.body,
    organizerId: req.user.id,
    clinicId: req.user.clinicId,
  };
  const camp = await campService.createCamp(campData);
  res.status(httpStatus.CREATED).json(camp);
});

module.exports = {
  getCamps,
  createCamp,
};
