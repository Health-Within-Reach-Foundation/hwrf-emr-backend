const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { patientService, clinicService, appointmentService, dentalService, campService } = require('../services');
const generateRegNo = require('../utils/generate-regNo');
const { uploadFile } = require('../utils/azure-service');
const fs = require('fs');
const ApiError = require('../utils/ApiError');
const db = require('../models');

/**
 * Create a new patient.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - The request body containing patient data.
 * @param {string} req.user.clinicId - The ID of the clinic to which the patient belongs.
 * @param {string} [req.user.currentCampId] - The ID of the current camp, if applicable.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A promise that resolves when the patient is created.
 * @throws {ApiError} - Throws an error if the clinic is not found, required fields are missing, or registration number generation fails.
 */
const createPatient = catchAsync(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const clinic = await clinicService.getClinicById(req.user.clinicId);
    if (!clinic) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Clinic not found');
    }

    const lastPatient = await patientService.getLastPatientRegistered(req.user.clinicId);
    const currentCampId = req.user.currentCampId;

    console.log(lastPatient);
    const registrationNumber = lastPatient?.regNo ? lastPatient?.regNo + 1 : 1;
    // const registrationNumber = generateRegNo("HWRF", lastPatient);

    if (!registrationNumber) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate registration number');
    }

    const patientData = {
      ...req.body,
      regNo: registrationNumber,
      clinicId: req.user.clinicId,
    };

    // Validate required fields
    if (!patientData.name || !patientData.age || !patientData.sex || !patientData.mobile || !patientData.clinicId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields for patient creation');
    }

    console.log('--------------------->', patientService, patientData);

    const patient = await patientService.createPatient(patientData, transaction);

    // Associate patient with the camp if applicable
    if (currentCampId) {
      const camp = await campService.getCampById(currentCampId);
      if (!camp) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Camp not found for the given ID');
      }
      await patient.addCamps([camp], { transaction });
    }
    await transaction.commit();
    res.status(httpStatus.CREATED).json({
      success: true,
      message: 'Patient added successfully',
      data: patient,
    });
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating patient');
  }
});

/**
 * Adds a dental patient record.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request containing the dental patient record data.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the dental patient record is added.
 */
const addDentalPatientRecord = catchAsync(async (req, res) => {
  // const { patientId } = req.params;
  const record = await dentalService.addDentalPatientRecord(req.body);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Dental patient record added successfully!',

    data: record,
  });
});

/**
 * Controller to handle the creation of a mammography record.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.file - Uploaded file object
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.currentCampId - Current camp ID of the user
 * @param {string} req.user.clinicId - Clinic ID of the user
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.patientId - ID of the patient
 * @param {Object} res - Express response object
 *
 * @returns {Promise<void>} - Returns a promise that resolves to void
 *
 * @throws {ApiError} - Throws an error if file upload or processing fails
 */
const createMammography = catchAsync(async (req, res) => {
  const { file, body } = req;
  const campId = req?.user?.currentCampId || null;
  const { patientId } = req.params;
  const screeningImageFilePath = {};

  if (file) {
    try {
      const fileKey = `clinics/${req?.user?.clinicId}/mammography/${patientId}/${file.originalname}`; // Generate unique key
      const uploadResult = await uploadFile(file, fileKey);

      if (!uploadResult.success) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${file.originalname}`);
      }

      // Save file metadata
      screeningImageFilePath.key = fileKey;
      screeningImageFilePath.fileName = file.originalname;
      screeningImageFilePath.uploadedAt = new Date().toISOString();

      // Delete the temporary file from local storage
      fs.unlink(file.path, (err) => {
        if (err) console.error(`Error deleting temporary file: ${err}`);
      });
    } catch (err) {
      console.error(`Error processing file ${file.originalname}:`, err);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error uploading file: ${err.message}`);
    }
  }

  // Append file paths to the request body
  const mammographyBody = {
    ...body,
    campId,
    screeningImage: screeningImageFilePath, // Attach uploaded file paths if available
  };
  const record = await patientService.createMammography(patientId, mammographyBody);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Mammography Details added successfully!',
    data: record,
  });
});

/**
 * Get mammography report for a specific patient.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.patientId - ID of the patient.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - Returns a promise that resolves to void.
 */
const getMammography = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  const record = await patientService.getMammographyById(patientId);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Mammography Reports!',
    data: record,
  });
});

/**
 * Updates mammography details for a patient.
 *
 * This function handles the update of mammography details for a patient, including the upload of a screening image file
 * to a specified storage location. If a file is provided, it generates a unique key for the file, uploads it, and saves
 * the file metadata. The temporary file is then deleted from local storage. The function then appends the file paths to
 * the request body and updates the patient's mammography details in the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.patientId - The ID of the patient.
 * @param {Object} req.file - The file object containing the screening image.
 * @param {Object} req.body - The request body containing mammography details.
 * @param {Object} req.user - The user object containing user details.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {ApiError} - Throws an error if the file upload fails or if there is an error processing the file.
 */
const updateMammography = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  const { file, body } = req;
  const screeningImageFilePath = {};

  if (file) {
    try {
      const fileKey = `clinics/${req?.user?.clinicId}/mammography/${body.patientId}/${file.originalname}`; // Generate unique key
      const uploadResult = await uploadFile(file, fileKey);

      if (!uploadResult.success) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${file.originalname}`);
      }

      // Save file metadata
      screeningImageFilePath.key = fileKey;
      screeningImageFilePath.fileName = file.originalname;
      screeningImageFilePath.uploadedAt = new Date().toISOString();

      // Delete the temporary file from local storage
      fs.unlink(file.path, (err) => {
        if (err) console.error(`Error deleting temporary file: ${err}`);
      });
    } catch (err) {
      console.error(`Error processing file ${file.originalname}:`, err);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error uploading file: ${err.message}`);
    }
  }

  // Append file paths to the request body
  let mammographyBody;
  if (Object.keys(screeningImageFilePath).length > 0) {
    mammographyBody = {
      ...body,
      screeningImage: screeningImageFilePath, // Attach uploaded file paths if available
    };
  } else {
    mammographyBody = {
      ...body,
    };
  }

  const record = await patientService.updateMammography(patientId, mammographyBody);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Mammography Details updated successfully!',
    data: record,
  });
});

/**
 * Get patients by clinic.
 *
 * This function retrieves a list of patients associated with the clinic
 * specified by the clinicId in the request user's data.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.user - The user object attached to the request.
 * @param {string} req.user.clinicId - The ID of the clinic to retrieve patients for.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 */
const getPatientsByClinic = catchAsync(async (req, res) => {
  // const currentCampId = req.user.currentCampId;
  const clinicId = req.user.clinicId;

  const patients = await patientService.getPatientsByClinic(clinicId);
  res.status(httpStatus.OK).json(patients);
});

/**
 * Get patient details by ID.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.patientId - ID of the patient.
 * @param {Object} req.query - Request query parameters.
 * @param {string} [req.query.specialtyId=null] - ID of the specialty (optional).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - Returns a promise that resolves to void.
 */
const getPatientDetailsById = catchAsync(async (req, res) => {
  // console.log('user speciality ->', req.user.specialties[0]);
  const patientId = req.params.patientId;
  const { specialtyId = null } = req.query;
  // const { specialtyId } = req.query;
  const patient = await patientService.getPatientDetailsById(patientId, specialtyId);
  res.status(httpStatus.OK).json({
    success: true,
    data: patient,
    message: 'Patient details fetched successfully',
  });
});

/**
 * Updates the details of a patient.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.patientId - The ID of the patient to update.
 * @param {Object} req.body - The request body containing patient data.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the patient details are updated.
 */
const updatePatientDetails = catchAsync(async (req, res) => {
  const patientId = req.params.patientId;
  const patientData = req.body;

  await patientService.updatePatientById(patientId, patientData);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Patient updated successfully',
    // data: updatedPatient,
  });
});

/**
 * Creates a new diagnosis for a patient.
 *
 * This function handles the creation of a new diagnosis, including the processing
 * and uploading of any attached x-ray files. It extracts file URLs from the uploaded
 * files, uploads them to a specified location, and appends the file paths to the
 * request body before passing the data to the patient service for diagnosis creation.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.files - The uploaded files.
 * @param {Object} req.body - The request body containing diagnosis data.
 * @param {Object} req.user - The user object.
 * @param {string} req.user.clinicId - The ID of the clinic.
 * @param {Object} res - The response object.
 *
 * @returns {Promise<void>} - A promise that resolves when the diagnosis is created.
 *
 * @throws {ApiError} - Throws an error if file upload fails.
 */
const createDiagnosis = catchAsync(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { files, body } = req;
    // const campId = req?.user?.currentCampId || null;
    // Extract file URLs from uploaded files, if any
    // const xrayFilePaths = files?.map((file) => file.path) || [];
    const xrayFilePaths = [];

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const fileKey = `clinics/${req?.user?.clinicId}/xray/${body.patientId}/${Date.now()}_${file.originalname}`; // Generate unique key
          const uploadResult = await uploadFile(file, fileKey);

          if (!uploadResult.success) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${file.originalname}`);
          }

          // Push object with required format into xrayFilePaths
          xrayFilePaths.push({
            key: fileKey,
            fileName: file.originalname,
            uploadedAt: new Date().toISOString(),
          });

          // Delete the temporary file from local storage
          fs.unlink(file.path, (err) => {
            if (err) console.error(`Error deleting temporary file: ${err}`);
          });
        } catch (err) {
          console.error(`Error processing file ${file.originalname}:`, err);
        }
      }
    }

    // Append file paths to the request body
    let diagnosisData = {};
    if (xrayFilePaths?.length > 0) {
      diagnosisData = {
        ...body,
        // campId,
        xray: xrayFilePaths,
      };
    } else {
      diagnosisData = {
        // campId,
        ...body,
      };
    }
    // Attach uploaded file paths if available

    await patientService.createDiagnosis(diagnosisData, transaction);
    await transaction.commit();
    res.status(httpStatus.CREATED).json({
      success: true,
      message: 'Diagnosis created successfully',
      // data: diagnosis,
    });
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating diagnosis');
  }
});

/**
 * Get diagnoses based on query parameters.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.query - Query parameters for fetching diagnoses.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - Returns a promise that resolves to void.
 */
const getDiagnoses = catchAsync(async (req, res) => {
  console.log('getting diagnoses ');
  const diagnoses = await patientService.getDiagnoses(req.query);
  res.status(httpStatus.OK).json({
    success: true,
    data: diagnoses.data,
    meta: diagnoses.meta,
    message: 'diagnoses found',
  });
});

/**
 * Get diagnosis by ID.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.diagnosisId - ID of the diagnosis to retrieve.
 * @param {Object} req.files - Uploaded files (if any).
 * @param {Object} req.body - Request body.
 * @param {Object} res - Express response object.
 *
 * @returns {Promise<void>} - Returns a promise that resolves to void.
 */
const getDiagnosis = catchAsync(async (req, res) => {
  const { files, body } = req;

  const diagnosis = await patientService.getDiagnosisById(req.params.diagnosisId);
  res.status(httpStatus.OK).json({
    success: true,
    data: diagnosis,
    message: 'diagnosis found',
  });
});

/**
 * Updates the diagnosis for a patient, including handling file uploads for x-ray images.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.files - The files uploaded in the request.
 * @param {Object} req.body - The body of the request.
 * @param {Object} req.user - The user making the request.
 * @param {string} req.user.clinicId - The clinic ID of the user.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.diagnosisId - The ID of the diagnosis to update.
 * @param {Object} res - The response object.
 *
 * @returns {Promise<void>} - A promise that resolves to void.
 *
 * @throws {ApiError} - Throws an error if file upload fails.
 */
const updateDiagnosis = catchAsync(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { files, body } = req;

    // Extract file URLs from uploaded files, if any
    // const xrayFilePaths = files?.map((file) => file.path) || [];

    const xrayFilePaths = [];

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const fileKey = `clinics/${req?.user?.clinicId}/xray/${body.patientId}/${Date.now()}_${file.originalname}`; // Generate unique key
          const uploadResult = await uploadFile(file, fileKey);

          if (!uploadResult.success) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${file.originalname}`);
          }

          // xrayFilePaths.push(fileKey); // Store only file key (Azure path)
          // Push object with required format into xrayFilePaths
          xrayFilePaths.push({
            key: fileKey,
            fileName: file.originalname,
            uploadedAt: new Date().toISOString(),
          });

          // Delete the temporary file from local storage
          fs.unlink(file.path, (err) => {
            if (err) console.error(`Error deleting temporary file: ${err}`);
          });
        } catch (err) {
          console.error(`Error processing file ${file.originalname}:`, err);
        }
      }
    }
    // Append file paths to the request body
    let diagnosisBody = {};
    if (xrayFilePaths?.length > 0) {
      diagnosisBody = {
        ...body,
        xray: xrayFilePaths,
      };
    } else {
      diagnosisBody = {
        ...body,
      };
    }

    const diagnosis = await patientService.updateDiagnosis(req.params.diagnosisId, diagnosisBody, transaction);
    await transaction.commit();
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Diagnosis updated successfully',
      data: diagnosis,
    });
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating diagnosis');
  }
});

/**
 * Deletes a diagnosis by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.diagnosisId - The ID of the diagnosis to delete.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the diagnosis is deleted.
 */
const deleteDiagnosis = catchAsync(async (req, res) => {
  await patientService.deleteDiagnosis(req.params.diagnosisId);
  res.status(httpStatus.OK).json({
    message: 'diagnosis deleted !',
    success: true,
  });
});

/**
 * Creates a new treatment for a patient.
 *
 * This function handles the creation of a new treatment record. It processes any uploaded files,
 * uploads them to a specified storage location, and includes their metadata in the treatment record.
 *
 * @function
 * @async
 * @param {Object} req - The request object.
 * @param {Object} req.files - The files uploaded in the request.
 * @param {Object} req.body - The body of the request containing treatment details.
 * @param {Object} req.user - The user object containing user details.
 * @param {string} req.user.clinicId - The ID of the clinic the user belongs to.
 * @param {string} req.user.currentCampId - The ID of the current camp the user is associated with.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the treatment is created.
 *
 * @throws {ApiError} - Throws an error if file upload fails.
 */
const createTreatment = catchAsync(async (req, res) => {
  const { files, body } = req;
  const campId = req?.user?.currentCampId || null;
  const xrayFilePaths = [];

  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const fileKey = `clinics/${req?.user?.clinicId}/xray/${body.patientId}/${Date.now()}_${file.originalname}`; // Generate unique key
        const uploadResult = await uploadFile(file, fileKey);

        if (!uploadResult.success) {
          throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${file.originalname}`);
        }

        // xrayFilePaths.push(fileKey); // Store only file key (Azure path)
        // Push object with required format into xrayFilePaths
        xrayFilePaths.push({
          key: fileKey,
          fileName: file.originalname,
          uploadedAt: new Date().toISOString(),
        });

        // Delete the temporary file from local storage
        fs.unlink(file.path, (err) => {
          if (err) console.error(`Error deleting temporary file: ${err}`);
        });
      } catch (err) {
        console.error(`Error processing file ${file.originalname}:`, err);
      }
    }
  }

  let treatmentBody = {};
  if (xrayFilePaths?.length > 0) {
    treatmentBody = {
      ...body,
      xray: xrayFilePaths,
      campId,
    };
  } else {
    treatmentBody = {
      ...body,
      campId,
    };
  }
  const treatmentSetting = await patientService.createTreatment(treatmentBody);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Treatment created successfully',
    data: treatmentSetting,
  });
});

/**
 * Get treatments based on query parameters.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.query - Query parameters for fetching treatments.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - Returns a promise that resolves to void.
 */
const getTreatments = catchAsync(async (req, res) => {
  const treatments = await patientService.getTreatments(req.query);
  res.status(httpStatus.OK).json({ success: true, data: treatments });
});

/**
 * Get treatment details by ID.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.treatmentId - ID of the treatment to retrieve
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
const getTreatmentById = catchAsync(async (req, res) => {
  const treatment = await patientService.getTreatmentById(req.params.treatmentId);
  res.status(httpStatus.OK).json({ success: true, data: treatment });
});

/**
 * Update treatment information for a patient, including uploading x-ray files.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.files - Array of files uploaded in the request.
 * @param {Object} req.body - Request body containing treatment details.
 * @param {Object} req.user - User object containing user details.
 * @param {string} req.user.clinicId - Clinic ID of the user.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.treatmentId - ID of the treatment to be updated.
 * @param {Object} res - Express response object.
 *
 * @returns {Promise<void>} - Returns a promise that resolves to void.
 *
 * @throws {ApiError} - Throws an error if file upload fails.
 */
const updateTreatment = catchAsync(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { files, body } = req;

    const xrayFilePaths = [];

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const fileKey = `clinics/${req?.user?.clinicId}/xray/${body.patientId}/${Date.now()}_${file.originalname}`; // Generate unique key
          const uploadResult = await uploadFile(file, fileKey);

          if (!uploadResult.success) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${file.originalname}`);
          }

          // xrayFilePaths.push(fileKey); // Store only file key (Azure path)// Push object with required format into xrayFilePaths
          xrayFilePaths.push({
            key: fileKey,
            fileName: file.originalname,
            uploadedAt: new Date().toISOString(),
          });

          // Delete the temporary file from local storage
          fs.unlink(file.path, (err) => {
            if (err) console.error(`Error deleting temporary file: ${err}`);
          });
        } catch (err) {
          console.error(`Error processing file ${file.originalname}:`, err);
        }
      }
    }

    let treatmentBody = {};
    if (xrayFilePaths?.length > 0) {
      treatmentBody = {
        ...body,
        xray: xrayFilePaths,
      };
    } else {
      treatmentBody = {
        ...body,
      };
    }

    const updatedTreatment = await patientService.updateTreatment(req.params.treatmentId, treatmentBody, transaction);
    await transaction.commit();
    res.status(httpStatus.OK).json({ success: true, data: updatedTreatment, message: 'Treatment saved successfully!' });
  } catch (error) {
    console.log('Error in updateTreatment -->', error);
    await transaction.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating treatment');
  }
});

/**
 * Delete a treatment by ID
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.treatmentId - ID of the treatment to delete
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteTreatment = catchAsync(async (req, res) => {
  await patientService.deleteTreatment(req.params.treatmentId);
  res.status(httpStatus.NO_CONTENT).send();
});

/* ********************* GP Patient controller ************************* */

/**
 * Creates a new GP record.
 *
 * This function is an asynchronous handler that creates a new GP record using the data provided in the request body.
 * It also includes the current camp ID from the authenticated user, if available.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request containing the GP record data.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} [req.user.currentCampId] - The current camp ID of the authenticated user.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the GP record is created and the response is sent.
 */
const createGPRecord = catchAsync(async (req, res) => {
  const campId = req?.user?.currentCampId || null;
  const gpRecordBody = { ...req?.body, campId };
  const record = await patientService.createGPRecord(gpRecordBody);
  res.status(httpStatus.CREATED).json({
    data: record,
    message: 'GP Record created successfully',
    success: true,
  });
});

/**
 * Get GP records by patient ID.
 *
 * This function fetches the GP records for a specific patient based on the patient ID provided in the query parameters.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.patientId - The ID of the patient whose GP records are to be fetched.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves to void.
 */
const getGPRecordsByPatient = catchAsync(async (req, res) => {
  const records = await patientService.getGPRecordsByPatient(req.query.patientId);
  res.status(httpStatus.OK).json({
    data: records,
    success: true,
    message: 'GP Records fetched successfully',
  });
});

/**
 * Get GP Record by ID
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.gpRecordId - ID of the GP record to fetch
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 *
 * @description This function fetches a GP record by its ID and sends it in the response.
 * It uses the patientService to retrieve the record and sends a success message along with the data.
 */
const getGPRecordById = catchAsync(async (req, res) => {
  const record = await patientService.getGPRecordById(req.params.gpRecordId);
  res.status(httpStatus.OK).send({
    data: record,
    success: true,
    message: 'GP Record fetched successfully',
  });
});

/**
 * Updates a GP record.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.gpRecordId - The ID of the GP record to update.
 * @param {Object} req.body - The request body containing the update data.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the record is updated.
 */
const updateGPRecord = catchAsync(async (req, res) => {
  const record = await patientService.updateGPRecord(req.params.gpRecordId, req.body);
  res.status(httpStatus.OK).json({
    data: record,
    message: 'Record updated',
    success: true,
  });
});

/**
 * Deletes a GP record by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.gpRecordId - The ID of the GP record to delete.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the GP record is deleted.
 */
const deleteGPRecord = catchAsync(async (req, res) => {
  await patientService.deleteGPRecord(req.params.gpRecordId);
  res.status(httpStatus.OK).json({
    message: 'Record deleted',
    success: true,
    data: null,
  });
});

/**
 * Get patient follow-ups.
 *
 * This function fetches the follow-up appointments for patients associated with the clinic of the logged-in user.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.user - User object attached to the request.
 * @param {string} req.user.clinicId - ID of the clinic associated with the user.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - Returns a promise that resolves to void.
 */
const getPatientFollowUps = catchAsync(async (req, res) => {
  const clinicId = req?.user?.clinicId || null;
  const followUps = await patientService.getPatientFollowUps(clinicId);
  res.status(httpStatus.OK).json({
    success: true,
    data: followUps,
    message: 'Patient follow-ups fetched successfully',
  });
});

module.exports = {
  createPatient,
  addDentalPatientRecord,
  getPatientsByClinic,
  getPatientDetailsById,
  updatePatientDetails,
  createDiagnosis,
  getDiagnosis,
  getDiagnoses,
  updateDiagnosis,
  deleteDiagnosis,
  createTreatment,
  getTreatments,
  getMammography,
  createMammography,
  getTreatmentById,
  updateTreatment,
  updateMammography,
  deleteTreatment,
  createGPRecord,
  getGPRecordsByPatient,
  getGPRecordById,
  updateGPRecord,
  deleteGPRecord,
  getPatientFollowUps,
};
