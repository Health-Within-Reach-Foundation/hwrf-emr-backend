const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { campService } = require('../services');

const getCamps = catchAsync(async (req, res) => {
  const clinicId = req?.user?.clinicId;
  const camps = await campService.getCamps(clinicId);
  res.status(httpStatus.OK).json({ camps });
});

const createCamp = catchAsync(async (req, res) => {
  const campData = {
    ...req.body,
    organizerId: req.user.id,
    clinicId: req.user.clinicId,
  };
  const camp = await campService.createCamp(campData);

  res.status(201).json({
    message: 'Camp created successfully',
    data: camp,
    success: true,
  });
});

const getCampById = catchAsync(async (req, res) => {
  const { campId } = req.params;
  const campDetails = await campService.getCampById(campId);
  res.status(200).json({
    success: true,
    message: 'Camp details fetched successfully',
    data: campDetails,
  });
});

const setCurrentCamp = catchAsync(async (req, res) => {
  const campId = req.body.campId;
  const userId = req.user.id;

  const response = await campService.setCurrentCamp(campId, userId);

  res.status(200).json({
    message: 'Currently selected camp',
    data: response,
    success: true,
  });
});

const updateCampById = catchAsync(async (req, res) => {
  const { campId } = req.params;
  const updatedCamp = await campService.updateCampById(campId, req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Camp updated successfully',
    data: updatedCamp,
  });
});

module.exports = {
  getCamps,
  createCamp,
  setCurrentCamp,
  getCampById,
  updateCampById,
};
