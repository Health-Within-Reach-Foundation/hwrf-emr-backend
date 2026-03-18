const httpStatus = require('http-status');
const fs = require('fs');
const XLSX = require('xlsx');
const catchAsync = require('../utils/catchAsync');
const { patientService, clinicService, campService, emailService } = require('../services');
const { uploadFile } = require('../utils/azure-service');
const ApiError = require('../utils/ApiError');
const db = require('../models');
const logger = require('../config/logger');

/**
 * Create a new patient.
 */
const createPatient = catchAsync(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const clinic = await clinicService.getClinicById(req.user.clinicId);
    if (!clinic) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Clinic not found');
    }

    const lastPatient = await patientService.getLastPatientRegistered(req.user.clinicId);
    const { currentCampId } = req.user;

    console.log(lastPatient);
    const registrationNumber = lastPatient?.regNo ? lastPatient?.regNo + 1 : 1;

    if (!registrationNumber) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate registration number');
    }

    const patientData = {
      ...req.body,
      regNo: registrationNumber,
      clinicId: req.user.clinicId,
    };

    if (!patientData.name || !patientData.age || !patientData.sex || !patientData.mobile || !patientData.clinicId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields for patient creation');
    }

    console.log('--------------------->', patientService, patientData);

    const patient = await patientService.createPatient(patientData, transaction);

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

const createMammography = catchAsync(async (req, res) => {
  const { file, body, files } = req;
  console.log('req.files', req.files);
  console.log('req.body', req.body);
  console.log('req.file', file);
  const campId = req?.user?.currentCampId || null;
  const { patientId } = req.params;
  const screeningImageFilePath = {};
  const aiReportFilePath = {};

  if (files && Object.keys(files).length > 0) {
    if (files.screeningFile && files.screeningFile.length > 0) {
      const screeningFile = files.screeningFile[0];
      try {
        const fileKey = `clinics/${req?.user?.clinicId}/mammography/${patientId}/${screeningFile.originalname}`;
        const uploadResult = await uploadFile(screeningFile, fileKey);

        if (!uploadResult.success) {
          throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${screeningFile.originalname}`);
        }

        screeningImageFilePath.key = fileKey;
        screeningImageFilePath.fileName = screeningFile.originalname;
        screeningImageFilePath.uploadedAt = new Date().toISOString();

        fs.unlink(screeningFile.path, (err) => {
          if (err) console.error(`Error deleting temporary file: ${err}`);
        });
      } catch (err) {
        console.error(`Error processing file ${screeningFile.originalname}:`, err);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error uploading file: ${err.message}`);
      }
    }

    if (files.aiReport && files.aiReport.length > 0) {
      const aiReportFile = files.aiReport[0];
      try {
        const fileKey = `clinics/${req?.user?.clinicId}/mammography/${patientId}/reports/${aiReportFile.originalname}`;
        const uploadResult = await uploadFile(aiReportFile, fileKey);
        if (!uploadResult.success) {
          throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${aiReportFile.originalname}`);
        }

        aiReportFilePath.key = fileKey;
        aiReportFilePath.fileName = aiReportFile.originalname;
        aiReportFilePath.uploadedAt = new Date().toISOString();

        fs.unlink(aiReportFile.path, (err) => {
          if (err) console.error(`Error deleting temporary file: ${err}`);
        });
      } catch (err) {
        console.error(`Error processing file ${aiReportFile.originalname}:`, err);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error uploading file: ${err.message}`);
      }
    }
  }

  const mammographyBody = {
    ...body,
    campId,
    screeningImage: screeningImageFilePath,
    aiReport: aiReportFilePath,
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

const deleteMammography = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  await patientService.deleteMammography(patientId);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Mammography Reports deleted successfully!',
  });
});

const updateMammography = catchAsync(async (req, res) => {
  const { patientId } = req.params;
  const { files, body } = req;
  const screeningImageFilePath = {};
  const aiReportFilePath = {};

  if (files && Object.keys(files).length > 0) {
    if (files.screeningFile && files.screeningFile.length > 0) {
      const screeningFile = files.screeningFile[0];
      try {
        const fileKey = `clinics/${req?.user?.clinicId}/mammography/${patientId}/${screeningFile.originalname}`;
        const uploadResult = await uploadFile(screeningFile, fileKey);

        if (!uploadResult.success) {
          throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${screeningFile.originalname}`);
        }

        screeningImageFilePath.key = fileKey;
        screeningImageFilePath.fileName = screeningFile.originalname;
        screeningImageFilePath.uploadedAt = new Date().toISOString();

        fs.unlink(screeningFile.path, (err) => {
          if (err) console.error(`Error deleting temporary file: ${err}`);
        });
      } catch (err) {
        console.error(`Error processing file ${screeningFile.originalname}:`, err);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error uploading file: ${err.message}`);
      }
    }

    if (files.aiReport && files.aiReport.length > 0) {
      const aiReportFile = files.aiReport[0];
      try {
        const fileKey = `clinics/${req?.user?.clinicId}/mammography/${patientId}/reports/${aiReportFile.originalname}`;
        const uploadResult = await uploadFile(aiReportFile, fileKey);
        if (!uploadResult.success) {
          throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${aiReportFile.originalname}`);
        }

        aiReportFilePath.key = fileKey;
        aiReportFilePath.fileName = aiReportFile.originalname;
        aiReportFilePath.uploadedAt = new Date().toISOString();

        fs.unlink(aiReportFile.path, (err) => {
          if (err) console.error(`Error deleting temporary file: ${err}`);
        });
      } catch (err) {
        console.error(`Error processing file ${aiReportFile.originalname}:`, err);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error uploading file: ${err.message}`);
      }
    }
  }

  const mammographyBody = { ...body };

  if (Object.keys(screeningImageFilePath).length > 0) {
    mammographyBody.screeningImage = screeningImageFilePath;
  }

  if (Object.keys(aiReportFilePath).length > 0) {
    mammographyBody.aiReport = aiReportFilePath;
  }

  const record = await patientService.updateMammography(patientId, mammographyBody);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Mammography Details updated successfully!',
    data: record,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG FIX 1: getPatientsByClinic
//   BEFORE: called patientService.getPatientsByClinic(clinicId, { ...filters })
//           but the service expects a SINGLE query object { clinicId, limit, ... }
//   AFTER:  pass ONE object that contains clinicId + all filters
// ─────────────────────────────────────────────────────────────────────────────
const getPatientsByClinic = catchAsync(async (req, res) => {
  const { clinicId } = req.user;

  const { limit = 50, offset = 0, name = '', address = '', service = '' } = req.query;

  // ✅ FIX: pass a single merged object – service signature is getPatientsByClinic(query)
  const patients = await patientService.getPatientsByClinic({
    clinicId,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    name,
    address,
    service,
  });

  res.status(httpStatus.OK).json(patients);
});

const getSimplePatientsByClinic = catchAsync(async (req, res) => {
  const { clinicId } = req.user;
  const { limit = 50, offset = 0 } = req.query;
  const patients = await patientService.getSimplePatientsByClinic(clinicId, parseInt(limit, 10), parseInt(offset, 10));
  res.status(httpStatus.OK).json(patients);
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG FIX 2 & 3: getPatientsByClinicForExport (email export)
//   BEFORE: had a duplicate `const { clinicId } = req.user` inside setImmediate
//           which caused a "Cannot redeclare block-scoped variable" syntax error.
//           Also did NOT pass filters, so it always exported ALL patients.
//   AFTER:  removed duplicate declaration, reads filters from req.query
//           and passes them to the service so only filtered patients are emailed.
// ─────────────────────────────────────────────────────────────────────────────
const getPatientsByClinicForExport = catchAsync(async (req, res) => {
  const { clinicId, email } = req.user;

  // ✅ FIX: read filters here (outside setImmediate) so they are in scope
  const { name = '', address = '', service = '' } = req.query;

  // Respond immediately so the client is not left waiting
  res.status(httpStatus.ACCEPTED).json({
    success: true,
    message: `Your export is being prepared. You will receive an email at ${email} with the Excel attachment shortly.`,
  });

  // All heavy work runs in the background after the response is flushed
  setImmediate(async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `patients_export_${timestamp}.xlsx`;

    try {
      logger.info(`[Export] Starting background export for clinicId=${clinicId}, recipient=${email}`);

      // ✅ FIX: pass filters so only filtered patients are exported/emailed
      const patients = await patientService.getPatientsByClinicForExport(clinicId, { name, address, service });

      // Helper: format registration number
      const getFormattedRegNo = (patient) => {
        if (!patient?.createdAt) return `HWRF/--/${patient.regNo}`;
        const createdAt = new Date(patient.createdAt);
        const year = createdAt.getFullYear() % 100;
        const month = createdAt.getMonth() + 1;
        let financialYear;
        if (month > 3) {
          financialYear = `${String(year).padStart(2, '0')}-${String(year + 1).padStart(2, '0')}`;
        } else {
          financialYear = `${String(year - 1).padStart(2, '0')}-${String(year).padStart(2, '0')}`;
        }
        return `HWRF/${financialYear}/${patient.regNo}`;
      };

      // Build Excel rows
      const headers = [
        'Register No',
        'Name',
        'Age',
        'Gender',
        'Mobile',
        'Address',
        'Service Taken',
        'Cash Paid (In ₹)',
        'Online Paid Amount (In ₹)',
        'Total Paid Amount (In ₹)',
        'Referral Source',
      ];

      const rows = patients.data.map((p) => [
        getFormattedRegNo(p),
        p.name || '',
        p.age || '',
        p.sex || '',
        p.mobile || '',
        p.address || '',
        Array.isArray(p.serviceTaken) ? p.serviceTaken.join(', ') : '-',
        p.onlinePaid || 0,
        p.offlinePaid || 0,
        p.total || 0,
        p.referral_source || '',
      ]);

      // Generate Excel workbook
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      logger.info(`[Export] Excel generated: ${rows.length} rows, ${excelBuffer.length} bytes — sending to ${email}`);

      // Email the file
      const sent = await emailService.sendExcelExportEmail(email, excelBuffer, filename);

      if (sent) {
        logger.info(`[Export] ✅ Excel emailed successfully to ${email}`);
      } else {
        logger.warn(`[Export] ⚠️  Email delivery failed for ${email}. The file was generated but not delivered.`);
      }
    } catch (err) {
      logger.error(`[Export] ❌ Background export failed for clinicId=${clinicId}, recipient=${email}: ${err.message}`, {
        stack: err.stack,
      });
    }
  });
});

const searchPatientsByClinic = catchAsync(async (req, res) => {
  const { clinicId } = req.user;
  const { searchTerm = '', limit = 10, offset = 0 } = req.query;
  const result = await patientService.searchPatientsByClinic(
    clinicId,
    searchTerm,
    parseInt(limit, 10),
    parseInt(offset, 10)
  );
  res.status(httpStatus.OK).json(result);
});

const getPatientDetailsById = catchAsync(async (req, res) => {
  const patient = await patientService.getPatientDetailsById(req.params.patientId, req.query.specialtyId);
  res.status(httpStatus.OK).json({
    success: true,
    data: patient,
  });
});

const updatePatientDetails = catchAsync(async (req, res) => {
  const patient = await patientService.updatePatientById(req.params.patientId, req.body);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Patient updated successfully',
    data: patient,
  });
});

const createDiagnosis = catchAsync(async (req, res) => {
  const campId = req?.user?.currentCampId || null;
  const diagnosisBody = { ...req.body, campId };
  const diagnosis = await patientService.createDiagnosis(diagnosisBody, req.files);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Diagnosis created successfully',
    data: diagnosis,
  });
});

const getDiagnoses = catchAsync(async (req, res) => {
  const diagnoses = await patientService.getDiagnoses(req.query.patientId);
  res.status(httpStatus.OK).json({
    success: true,
    data: diagnoses,
  });
});

const getDiagnosis = catchAsync(async (req, res) => {
  const diagnosis = await patientService.getDiagnosisById(req.params.diagnosisId);
  res.status(httpStatus.OK).json({
    success: true,
    data: diagnosis,
  });
});

const updateDiagnosis = catchAsync(async (req, res) => {
  const diagnosis = await patientService.updateDiagnosis(req.params.diagnosisId, req.body, req.files);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Diagnosis updated successfully',
    data: diagnosis,
  });
});

const deleteDiagnosis = catchAsync(async (req, res) => {
  await patientService.deleteDiagnosis(req.params.diagnosisId);
  res.status(httpStatus.NO_CONTENT).send();
});

const createTreatment = catchAsync(async (req, res) => {
  const campId = req?.user?.currentCampId || null;
  const treatmentBody = { ...req.body, campId };
  const treatment = await patientService.createTreatment(treatmentBody, req.files);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Treatment created successfully',
    data: treatment,
  });
});

const getTreatments = catchAsync(async (req, res) => {
  const treatments = await patientService.getTreatments(req.query);
  res.status(httpStatus.OK).json({
    success: true,
    data: treatments,
  });
});

const getTreatmentById = catchAsync(async (req, res) => {
  const treatment = await patientService.getTreatmentById(req.params.treatmentId);
  res.status(httpStatus.OK).json({
    success: true,
    data: treatment,
  });
});

const updateTreatment = catchAsync(async (req, res) => {
  const treatment = await patientService.updateTreatment(req.params.treatmentId, req.body, req.files);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Treatment updated successfully',
    data: treatment,
  });
});

const deleteTreatment = catchAsync(async (req, res) => {
  await patientService.deleteTreatment(req.params.treatmentId);
  res.status(httpStatus.NO_CONTENT).send();
});

/* ********************* GP Patient controller ************************* */

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

const getGPRecordsByPatient = catchAsync(async (req, res) => {
  const records = await patientService.getGPRecordsByPatient(req.query.patientId);
  res.status(httpStatus.OK).json({
    data: records,
    success: true,
    message: 'GP Records fetched successfully',
  });
});

const getGPRecordById = catchAsync(async (req, res) => {
  const record = await patientService.getGPRecordById(req.params.gpRecordId);
  res.status(httpStatus.OK).send({
    data: record,
    success: true,
    message: 'GP Record fetched successfully',
  });
});

const updateGPRecord = catchAsync(async (req, res) => {
  const record = await patientService.updateGPRecord(req.params.gpRecordId, req.body);
  res.status(httpStatus.OK).json({
    data: record,
    message: 'Record updated',
    success: true,
  });
});

const deleteGPRecord = catchAsync(async (req, res) => {
  await patientService.deleteGPRecord(req.params.gpRecordId);
  res.status(httpStatus.OK).json({
    message: 'Record deleted',
    success: true,
    data: null,
  });
});

const getPatientFollowUps = catchAsync(async (req, res) => {
  const clinicId = req?.user?.clinicId || null;
  const followUps = await patientService.getPatientFollowUps(clinicId);
  res.status(httpStatus.OK).json({
    success: true,
    data: followUps,
    message: 'Patient follow-ups fetched successfully',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG FIX 2 (frontend "Export Visible" → now "Export All Filtered"):
//   exportPatientsDownload now reads filters from query and passes them
//   to getPatientsByClinicForExport so the downloaded file respects filters.
// ─────────────────────────────────────────────────────────────────────────────
const exportPatientsDownload = async (req, res) => {
  const { clinicId } = req.user;

  // ✅ FIX: pass filters so only filtered patients are downloaded
  const { name = '', address = '', service = '' } = req.query;

  const result = await patientService.getPatientsByClinicForExport(clinicId, { name, address, service });

  const patients = result.data;

  const headers = [
    'Register No',
    'Name',
    'Age',
    'Gender',
    'Mobile',
    'Address',
    'Service Taken',
    'Cash Paid',
    'Online Paid',
    'Total',
    'Referral Source',
  ];

  const getFormattedRegNo = (patient) => {
    if (!patient?.createdAt) return `HWRF/--/${patient.regNo}`;
    const createdAt = new Date(patient.createdAt);
    const year = createdAt.getFullYear() % 100;
    const month = createdAt.getMonth() + 1;
    const financialYear = month > 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    return `HWRF/${financialYear}/${patient.regNo}`;
  };

  const rows = patients.map((p) => [
    getFormattedRegNo(p),
    p.name,
    p.age,
    p.sex,
    p.mobile,
    p.address,
    (p.serviceTaken || []).join(', '),
    p.offlinePaid || 0,
    p.onlinePaid || 0,
    p.total || 0,
    p.referral_source || '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');

  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });

  res.setHeader('Content-Disposition', 'attachment; filename=patients.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

module.exports = {
  createPatient,
  getPatientsByClinic,
  getSimplePatientsByClinic,
  getPatientsByClinicForExport,
  searchPatientsByClinic,
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
  deleteMammography,
  exportPatientsDownload,
};
