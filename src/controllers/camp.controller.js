const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { campService } = require('../services');
const db = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Get a list of camps for the clinic associated with the authenticated user.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.clinicId - ID of the clinic associated with the user
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
const getCamps = catchAsync(async (req, res) => {
  const clinicId = req?.user?.clinicId;
  const camps = await campService.getCamps(clinicId);
  res.status(httpStatus.OK).json({ camps });
});

/**
 * Creates a new camp.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request containing camp data.
 * @param {Object} req.user - The user object containing user details.
 * @param {string} req.user.id - The ID of the user creating the camp.
 * @param {string} req.user.clinicId - The ID of the clinic associated with the user.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the camp is created and the response is sent.
 */
const createCamp = catchAsync(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const campData = {
      ...req.body,
      organizerId: req.user.id,
      clinicId: req.user.clinicId,
    };
    const camp = await campService.createCamp(campData, transaction);
    await transaction.commit();
    res.status(201).json({
      message: 'Camp created successfully',
      data: camp,
      success: true,
    });
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating camp');
  }
});

/**
 * Get camp details by ID.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.campId - ID of the camp.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A promise that resolves to void.
 */
const getCampById = catchAsync(async (req, res) => {
  const { campId } = req.params;
  const campDetails = await campService.getCampDetails(campId);
  // const campDetails = await campService.getCampById(campId);
  res.status(200).json({
    success: true,
    message: 'Camp details fetched successfully',
    data: campDetails,
  });
});

/**
 * Sets the current camp for the user.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.campId - The ID of the camp to set as current.
 * @param {Object} req.user - The user object.
 * @param {string} req.user.id - The ID of the user.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
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

/**
 * Updates a camp by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.campId - The ID of the camp to update.
 * @param {Object} req.body - The request body containing the camp data to update.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the camp is updated.
 */
const updateCampById = catchAsync(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { campId } = req.params;
    const updatedCamp = await campService.updateCampById(campId, req.body, transaction);
    await transaction.commit();
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Camp updated successfully',
      data: updatedCamp,
    });
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating camp');
  }
});

const getAllCampsAnalytics = catchAsync(async (req, res) => {
  const { clinicId } = req.user;
  const analytics = await campService.getAllCampsAnalytics(clinicId);
  res.status(200).json({
    success: true,
    message: 'Camps analytics fetched successfully',
    data: analytics,
  });
});


module.exports = {
  getCamps,
  createCamp,
  setCurrentCamp,
  getCampById,
  updateCampById,
  getAllCampsAnalytics,
};
