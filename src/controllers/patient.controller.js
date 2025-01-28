const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { patientService, clinicService, appointmentService, dentalService, campService } = require('../services');
const generateRegNo = require('../utils/generate-regNo');
const { uploadFile } = require('../utils/azure-service');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const createPatient = catchAsync(async (req, res) => {
  const clinic = await clinicService.getClinicById(req.user.clinicId);
  if (!clinic) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Clinic not found');
  }

  const clinicInitials = clinic.clinicName.substring(0, 2).toUpperCase();
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

  const patient = await patientService.createPatient(patientData);

  // Associate patient with the camp if applicable
  if (currentCampId) {
    const camp = await campService.getCampById(currentCampId);
    if (!camp) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Camp not found for the given ID');
    }
    await patient.addCamps([camp]);
  }

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Patient added successfully',
    data: patient,
  });
});

// Controller to add dentist patient record
const addDentalPatientRecord = catchAsync(async (req, res) => {
  // const { patientId } = req.params;
  const record = await dentalService.addDentalPatientRecord(req.body);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Dental patient record added successfully!',

    data: record,
  });
});
// Controller to add dentist patient mammography
const createMammography = catchAsync(async (req, res) => {
  const { file, body } = req;

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
    screeningImage: screeningImageFilePath, // Attach uploaded file paths if available
  };
  const record = await patientService.createMammography(patientId, mammographyBody);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Mammography Details added successfully!',
    data: record,
  });
});
const getMammography = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  const record = await patientService.getMammographyById(patientId);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Mammography Reports!',
    data: record,
  });
});
// Controller to add dentist patient mammography
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
 * Fetch all patients by clinic ID.
 */
const getPatientsByClinic = catchAsync(async (req, res) => {
  // const currentCampId = req.user.currentCampId;
  const clinicId = req.user.clinicId;

  const patients = await patientService.getPatientsByClinic(clinicId);
  res.status(httpStatus.OK).json(patients);
});

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

const createDiagnosis = catchAsync(async (req, res) => {
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
      xray: xrayFilePaths,
    };
  } else {
    diagnosisData = {
      ...body,
    };
  }
  // Attach uploaded file paths if available

  await patientService.createDiagnosis(diagnosisData);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Diagnosis created successfully',
    // data: diagnosis,
  });
});

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

const getDiagnosis = catchAsync(async (req, res) => {
  const { files, body } = req;

  const diagnosis = await patientService.getDiagnosisById(req.params.diagnosisId);
  res.status(httpStatus.OK).json({
    success: true,
    data: diagnosis,
    message: 'diagnosis found',
  });
});

const updateDiagnosis = catchAsync(async (req, res) => {
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

  const diagnosis = await patientService.updateDiagnosis(req.params.diagnosisId, diagnosisBody);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Diagnosis updated successfully',
    data: diagnosis,
  });
});

const deleteDiagnosis = catchAsync(async (req, res) => {
  await patientService.deleteDiagnosis(req.params.diagnosisId);
  res.status(httpStatus.OK).json({
    message: 'diagnosis deleted !',
    success: true,
  });
});

// const createTreatment = catchAsync(async (req, res) => {
//   const treatment = await patientService.createTreatment(req.body);
//   res.status(httpStatus.CREATED).json({ success: true, data: treatment });
// });
const createTreatment = catchAsync(async (req, res) => {
  const { files, body } = req;

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
  const treatmentSetting = await patientService.createTreatment(treatmentBody);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Treatment created successfully',
    data: treatmentSetting,
  });
});

const getTreatments = catchAsync(async (req, res) => {
  const treatments = await patientService.getTreatments(req.query);
  res.status(httpStatus.OK).json({ success: true, data: treatments });
});

const getTreatmentById = catchAsync(async (req, res) => {
  const treatment = await patientService.getTreatmentById(req.params.treatmentId);
  res.status(httpStatus.OK).json({ success: true, data: treatment });
});

// const updateTreatment = catchAsync(async (req, res) => {
//   const updatedTreatment = await patientService.updateTreatment(req.params.treatmentId, req.body);
//   res.status(httpStatus.OK).json({ success: true, data: updatedTreatment });
// });

const updateTreatment = catchAsync(async (req, res) => {
  const { files, body } = req;

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

  const treatmentBody = {};
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

  const updatedTreatment = await patientService.updateTreatment(req.params.treatmentId, treatmentBody);
  res.status(httpStatus.OK).json({ success: true, data: updatedTreatment });
});

const deleteTreatment = catchAsync(async (req, res) => {
  await patientService.deleteTreatment(req.params.treatmentId);
  res.status(httpStatus.NO_CONTENT).send();
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
};
