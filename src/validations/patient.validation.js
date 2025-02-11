const Joi = require('joi');

/* ***************************** Patient CRUD Validation *************************** */

/**
 * Validation for adding a new patient
 */
const createPatient = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    age: Joi.number().integer().min(0).required(),
    sex: Joi.string().valid('male', 'female', 'other').required(),
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/) // Exactly 10 digits
      .required(),
    address: Joi.string().optional().allow(''), // Address is optional
  }),
};

/**
 * Validation for updating patient details
 */
const updatePatient = {
  params: Joi.object().keys({
    patientId: Joi.string().uuid().required(), // patientId must be a valid UUID and is required
  }),
  body: Joi.object().keys({
    name: Joi.string().optional().trim(),
    age: Joi.number().integer().min(0).optional(),
    sex: Joi.string().valid('male', 'female', 'other').optional(),
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .optional(),
    address: Joi.string().optional().allow(''),
    primaryDoctor: Joi.object()
      .keys({
        label: Joi.string().optional(),
        value: Joi.string().uuid().optional(),
        phoneNumber: Joi.string().optional(),
      })
      .optional(),
  }),
};

const getPatientsByClinic = {
  query: Joi.object().keys({
    clinicId: Joi.string().uuid().required(), // Clinic ID is required
    // page: Joi.number().integer().min(1).default(1),
    // limit: Joi.number().integer().min(1).default(10),
  }),
};

const getPatientById = {
  params: Joi.object().keys({
    patientId: Joi.string().uuid().required(), // patientId must be a valid UUID and is required
  }),
  query: Joi.object().keys({
    specialtyId: Joi.alternatives()
      .try(Joi.string().uuid(), Joi.allow(null)) // Allow either a UUID or null
      .optional(),
  }),
};

/* ***************************** Patient CRUD Validation *************************** */

/* ***************************** Patient Dental CRUD Validation *************************** */

const addDentalPatientRecord = {
  body: Joi.object().keys({
    appointmentId: Joi.string().uuid().required(),
    patientId: Joi.string().uuid().required(),
    complaints: Joi.array().items(Joi.string()).required(),
    treatment: Joi.array().items(Joi.string()).required(),
    dentalQuadrant: Joi.object()
      .pattern(
        /^[1-4]$/, // Keys must be 1, 2, 3, or 4 (valid quadrants)
        Joi.array().items(
          Joi.number().integer().min(1).max(8) // Teeth numbers must be 1-8
        )
      )
      .required(),
    xrayStatus: Joi.boolean().required(),
    xray: Joi.array().items(Joi.string().uri()).allow(null), // Image URLs
    notes: Joi.string().allow('', null), // Optional
    billing: Joi.object().keys({
      totalCost: Joi.number().min(0).required(),
      paidAmount: Joi.number().min(0).required(),
      remainingAmount: Joi.number().min(0).required(),
    }),
  }),
};

const createDiagnosis = {
  body: Joi.object().keys({
    complaints: Joi.array().items(Joi.string()).optional(),
    treatmentsSuggested: Joi.array().items(Joi.string()).optional(),
    currentStatus: Joi.array().items(Joi.string()).optional(),
    // dentalQuadrant: Joi.array().items(Joi.string()).optional(),
    selectedTeeth: Joi.array().items(Joi.number()).optional(),
    childSelectedTeeth: Joi.array().items(Joi.number()).optional(),
    adultSelectedTeeth: Joi.array().items(Joi.number()).optional(),
    dentalQuadrantType: Joi.string().valid('adult', 'child', 'all').optional(),
    xrayStatus: Joi.boolean().optional(),
    notes: Joi.string().allow('', null).optional(),
    additionalDetails: Joi.object().optional(),
    patientId: Joi.string().uuid().required(),
    estimatedCost: Joi.number().optional(),
  }),
  files: (files) => {
    if (!files.length) return null; // No files, validation passes

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)) {
        return `Invalid file type for file: ${file.originalname}. Only JPEG, PNG, or PDF files are allowed.`;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5 MB limit
        return `File ${file.originalname} exceeds the maximum size of 5MB.`;
      }
    }

    return null; // No errors
  },
};

const getDiagnoses = {
  query: Joi.object().keys({
    patientId: Joi.string().uuid().optional(),
    // page: Joi.number().integer().default(1),
    // limit: Joi.number().integer().default(10),
  }),
};

const getDiagnosis = {
  params: Joi.object().keys({
    diagnosisId: Joi.string().uuid().required(),
  }),
};

const updateDiagnosis = {
  params: Joi.object().keys({
    diagnosisId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    complaints: Joi.array().items(Joi.string()).optional(),
    treatmentsSuggested: Joi.array().items(Joi.string()).optional(),
    // currentStatus: Joi.array().items(Joi.string()).optional(),
    selectedTeeth: Joi.array().items(Joi.number()).optional(),
    dentalQuadrantType: Joi.string().valid('adult', 'child', 'all').optional(),
    childSelectedTeeth: Joi.array().items(Joi.number()).optional(),
    adultSelectedTeeth: Joi.array().items(Joi.number()).optional(),
    // dentalQuadrant: Joi.array().items(Joi.string()).optional(),
    xrayStatus: Joi.boolean().optional(),
    notes: Joi.string().allow('', null).optional(),
    additionalDetails: Joi.object().optional(),
    patientId: Joi.string().uuid().optional(),
    estimatedCost: Joi.number().optional(),
  }),
  files: (files) => {
    if (!files.length) return null; // No files, validation passes

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'application/pdf', 'image/avif'].includes(file.mimetype)) {
        return `Invalid file type for file: ${file.originalname}. Only JPEG, PNG, or PDF files are allowed.`;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5 MB limit
        return `File ${file.originalname} exceeds the maximum size of 5MB.`;
      }
    }

    return null; // No errors
  },
};

const deleteDiagnosis = {
  params: Joi.object().keys({
    diagnosisId: Joi.string().uuid().required(),
  }),
};

const createTreatment = {
  body: Joi.object().keys({
    diagnosisId: Joi.string().uuid().required().description('Diagnosis ID'),
    treatmentDate: Joi.date().required().description('Date of treatment'),
    treatmentStatus: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().allow('', null).optional(),
    additionalDetails: Joi.object().optional(),
    totalAmount: Joi.number().required(),
    paidAmount: Joi.number().default(0),
    remainingAmount: Joi.number().required(),
    // settingPaidAmount: Joi.number().optional(),
    xrayStatus: Joi.boolean().optional(),
    crownStatus: Joi.boolean().optional(),
    paymentStatus: Joi.string().valid('paid', 'pending').default('pending'),
    patientId: Joi.string().uuid().optional(),
    treatingDoctor: Joi.object()
      .keys({
        label: Joi.string().optional(),
        value: Joi.string().uuid().optional(),
        phoneNumber: Joi.string().optional(),
      })
      .optional(),
    onlineAmount: Joi.number().optional(),
    offlineAmount: Joi.number().optional(),
    // settingPaidAmount: Joi.number().optional(),
    nextDate: Joi.date().allow(null).optional().description('follow up date of treatment'),
  }),
  files: (files) => {
    if (!files.length) return null; // No files, validation passes

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'application/pdf', 'image/avif'].includes(file.mimetype)) {
        return `Invalid file type for file: ${file.originalname}. Only JPEG, PNG, or PDF files are allowed.`;
      }
      // if (file.size > 5 * 1024 * 1024) {
      //   // 5 MB limit
      //   return `File ${file.originalname} exceeds the maximum size of 5MB.`;
      // }
    }

    return null; // No errors
  },
};

const getTreatments = {
  query: Joi.object().keys({
    diagnosisId: Joi.string().uuid().required().description('Diagnosis ID'),
    page: Joi.number().integer().default(1),
    limit: Joi.number().integer().default(10),
  }),
};

const getTreatmentById = {
  params: Joi.object().keys({
    treatmentId: Joi.string().uuid().required().description('Treatment ID'),
  }),
};

const updateTreatment = {
  params: Joi.object().keys({
    treatmentId: Joi.string().uuid().required().description('Treatment ID'),
  }),
  body: Joi.object()
    .keys({
      // treatmentDate: Joi.date().optional(),
      patientId: Joi.string().uuid().optional(),
      notes: Joi.string().allow('', null).optional(),
      additionalDetails: Joi.object().optional(),
      totalAmount: Joi.number().optional(),
      paidAmount: Joi.number().optional(),
      status: Joi.string().optional(),
      remainingAmount: Joi.number().optional(),
      paymentStatus: Joi.string().valid('paid', 'pending').optional(),

      // Fields related to TreatmentSetting
      treatmentSettingId: Joi.string().uuid().optional().description('TreatmentSetting ID'),
      treatmentStatus: Joi.array().items(Joi.string()).optional(),
      settingTreatmentDate: Joi.date().optional(),
      xrayStatus: Joi.boolean().optional(),
      crownStatus: Joi.boolean().optional(),
      settingNotes: Joi.string().allow('', null).optional(),
      settingAdditionalDetails: Joi.object().optional(),
      treatingDoctor: Joi.object()
        .keys({
          label: Joi.string().optional(),
          value: Joi.string().uuid().optional(),
          phoneNumber: Joi.string().optional(),
        })
        .optional(),
      onlineAmount: Joi.number().optional(),
      offlineAmount: Joi.number().optional(),
      nextDate: Joi.date().allow(null).optional().description('follow up date of treatment'),
    })
    .min(1),
  files: (files) => {
    if (!files.length) return null; // No files, validation passes

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'application/pdf', 'image/avif'].includes(file.mimetype)) {
        return `Invalid file type for file: ${file.originalname}. Only JPEG, PNG, or PDF files are allowed.`;
      }
      // if (file.size > 5 * 1024 * 1024) {
      //   // 5 MB limit
      //   return `File ${file.originalname} exceeds the maximum size of 5MB.`;
      // }
    }

    return null; // No errors
  },
};

const deleteTreatment = {
  params: Joi.object().keys({
    treatmentId: Joi.string().uuid().required().description('Treatment ID'),
  }),
};

/* ***************************** Patient Dental CRUD Validation *************************** */

/* ***************************** Patient Mammography CRUD Validation *************************** */

const createMammography = {
  params: Joi.object().keys({
    patientId: Joi.string().uuid().required().description('Patient ID'),
  }),
  body: Joi.object().keys({
    menstrualAge: Joi.number().integer().min(0).allow('null', null).optional(),
    lastMenstrualDate: Joi.date().allow(null).optional(),
    cycleType: Joi.string().valid('Regular', 'Irregular').allow('', null).optional(),
    obstetricHistory: Joi.object()
      .keys({
        g: Joi.boolean().optional(),
        p: Joi.boolean().optional(),
        l: Joi.boolean().optional(),
      })
      .optional()
      .default({ g: false, p: false, l: false }),
    menopause: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    familyHistory: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    familyHistoryDetails: Joi.string().allow('', null).optional(),
    clinicalDiagnosis: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    diagnosisDetails: Joi.string().allow('', null).optional(),
    firstDegreeRelatives: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    previousCancer: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    previousDiagnosis: Joi.string().allow('', null).optional(),
    previousBiopsy: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    previousSurgery: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    implants: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    // screeningImage: Joi.string().optional(), // JSON object for the screening image
    // relevantDiagnosis: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    // relevantDiagnosisDetails: Joi.string().allow('', null).optional(), // JSON object for the screening image
    smoking: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    smokingDetails: Joi.object()
      .keys({
        packsPerDay: Joi.number().min(0).allow(null).optional(),
        yearsSmoked: Joi.number().min(0).allow(null).optional(),
      })
      .optional()
      .default({ packsPerDay: null, yearsSmoked: null }),
    imagingStudies: Joi.object()
      .keys({
        location: Joi.string().allow('', null).optional(),
        type: Joi.string().allow('', null).optional(),
        date: Joi.date().allow(null).optional(),
      })
      .optional()
      .default({ location: '', type: '', date: null }),
    lump: Joi.string().valid('No', 'Right', 'Left', 'Both').allow('', null).optional(),
    discharge: Joi.string().valid('No', 'Right', 'Left', 'Both').allow('', null).optional(),
    dischargeDetails: Joi.string().allow('', null).optional(),
    skinChanges: Joi.string().valid('No', 'Right', 'Left', 'Both').allow('', null).optional(),
    pain: Joi.string().valid('No', 'Right', 'Left', 'Both').allow('', null).optional(),
    skinChangesDetails: Joi.string().allow('', null).optional(),
    nippleRetraction: Joi.string().valid('No', 'Right', 'Left', 'Both').allow('', null).optional(),
    nippleRetractionDetails: Joi.string().allow('', null).optional(),
    additionalInfo: Joi.string().allow('', null).optional(),
    painDetails: Joi.string().allow('', null).optional(),
    // numberOfPregnancies: Joi.alternatives().try(Joi.number().integer().min(0), Joi.string().valid('null').allow(null)).optional(),
    numberOfPregnancies: Joi.number().integer().min(0).allow('null', null).optional(),
    numberOfDeliveries: Joi.number().integer().min(0).allow('null', null).optional(),
    numberOfLivingChildren: Joi.number().integer().min(0).allow('null', null).optional(),
    previousTreatment: Joi.string().valid('Yes', 'No').allow('', null).optional(),

    // here previousTreatmentDetails is array of strings add the code below
    previousTreatmentDetails: Joi.array().items(Joi.string()).optional(),
    // previousTreatmentDetails: Joi.string().allow('', null).optional(),
    alcohol: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    alcoholDetails: Joi.object()
      .keys({
        mlPerDay: Joi.number().min(0).allow(null).optional(),
        yearsConsumed: Joi.number().min(0).allow(null).optional(),
      })
      .optional()
      .default({ mlPerDay: null, yearsConsumed: null }),
    misheriTobacco: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    misheriTobaccoDetails: Joi.object()
      .keys({
        timesPerDay: Joi.number().min(0).allow(null).optional(),
        yearsUsed: Joi.number().min(0).allow(null).optional(),
      })
      .optional()
      .default({ timesPerDay: null, yearsUsed: null }),
    previousCancerDetails: Joi.string().allow('', null).optional(),
    lumpDetails: Joi.string().allow('', null).optional(),
  }),
  files: (files) => {
    if (!files.length) return null; // No files, validation passes

    for (const file of files) {
      // Check if the file is an image based on MIME type
      if (!file.mimetype.startsWith('image/')) {
        return `Invalid file type for file: ${file.originalname}. Only image files are allowed.`;
      }
      // Uncomment the below section to add a size limit if needed
      // if (file.size > 5 * 1024 * 1024) {
      //   return `File ${file.originalname} exceeds the maximum size of 5MB.`;
      // }
    }

    return null; // No errors
  },
};

const getMammography = {
  params: Joi.object().keys({
    patientId: Joi.string().uuid().required().description('Patient ID'),
  }),
};

const updateMammography = {
  body: Joi.object().keys({
    menstrualAge: Joi.number().integer().min(0).allow('null', null).optional(),
    lastMenstrualDate: Joi.date().allow(null).optional(),
    skinChanges: Joi.string().valid('No', 'Right', 'Left', 'Both').allow('', null).optional(),
    pain: Joi.string().valid('No', 'Right', 'Left', 'Both').allow('', null).optional(),
    cycleType: Joi.string().valid('Regular', 'Irregular').allow('', null).optional(),
    obstetricHistory: Joi.object()
      .keys({
        g: Joi.boolean().optional(),
        p: Joi.boolean().optional(),
        l: Joi.boolean().optional(),
      })
      .optional(),
    menopause: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    familyHistory: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    familyHistoryDetails: Joi.string().allow('', null).optional(),
    clinicalDiagnosis: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    diagnosisDetails: Joi.string().allow('', null).optional(),
    firstDegreeRelatives: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    previousCancer: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    previousDiagnosis: Joi.string().allow('', null).optional(),
    previousBiopsy: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    previousSurgery: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    implants: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    // screeningImage: Joi.string().optional(), // JSON object for the screening image
    smoking: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    smokingDetails: Joi.object()
      .keys({
        packsPerDay: Joi.number().min(0).allow(null).optional(),
        yearsSmoked: Joi.number().min(0).allow(null).optional(),
      })
      .optional(),
    imagingStudies: Joi.object()
      .keys({
        location: Joi.string().allow('', null).optional(),
        type: Joi.string().allow('', null).optional(),
        date: Joi.date().allow(null).optional(),
      })
      .optional(),
    lump: Joi.string().valid('No', 'Right', 'Left', 'Both').allow('', null).optional(),
    discharge: Joi.string().valid('No', 'Right', 'Left', 'Both').allow('', null).optional(),
    dischargeDetails: Joi.string().allow('', null).optional(),
    skinChangesDetails: Joi.string().allow('', null).optional(),
    nippleRetraction: Joi.string().valid('No', 'Right', 'Left', 'Both').allow('', null).optional(),
    nippleRetractionDetails: Joi.string().allow('', null).optional(),
    additionalInfo: Joi.string().allow('', null).optional(),
    patientId: Joi.string().uuid().optional(), // Foreign key, optional during updates
    mammoReport: Joi.string().optional(), // Foreign key, optional during updates
    painDetails: Joi.string().allow('', null).optional(),
    numberOfPregnancies: Joi.number().integer().min(0).allow('null', null).optional(),
    numberOfDeliveries: Joi.number().integer().min(0).allow('null', null).optional(),
    numberOfLivingChildren: Joi.number().integer().min(0).allow('null', null).optional(),
    previousTreatment: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    previousTreatmentDetails: Joi.array().items(Joi.string()).optional(),

    // previousTreatmentDetails: Joi.string().allow('', null).optional(),
    alcohol: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    alcoholDetails: Joi.object()
      .keys({
        mlPerDay: Joi.number().min(0).allow(null).optional(),
        yearsConsumed: Joi.number().min(0).allow(null).optional(),
      })
      .optional(),
    misheriTobacco: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    misheriTobaccoDetails: Joi.object()
      .keys({
        timesPerDay: Joi.number().min(0).allow(null).optional(),
        yearsUsed: Joi.number().min(0).allow(null).optional(),
      })
      .optional(),
    previousCancerDetails: Joi.string().allow('', null).optional(),
    lumpDetails: Joi.string().allow('', null).optional(),
  }),
  files: (files) => {
    if (!files.length) return null; // No files, validation passes

    for (const file of files) {
      // Check if the file is an image based on MIME type
      if (!file.mimetype.startsWith('image/')) {
        return `Invalid file type for file: ${file.originalname}. Only image files are allowed.`;
      }
      // Uncomment the below section to add a size limit if needed
      // if (file.size > 5 * 1024 * 1024) {
      //   return `File ${file.originalname} exceeds the maximum size of 5MB.`;
      // }
    }

    return null; // No errors
  },
};

/* ***************************** Patient Mammography CRUD Validation *************************** */

/* ***************************** Patient GP CRUD Validation *************************** */

const createGPRecord = {
  body: Joi.object().keys({
    patientId: Joi.string().uuid().allow('', null).optional(),
    weight: Joi.number().allow('', null).optional(),
    height: Joi.number().allow('', null).optional(),
    sugar: Joi.number().allow('', null).optional(),
    bp: Joi.string().allow('', null).optional(),
    hb: Joi.number().allow('', null).optional(),
    complaints: Joi.array().items(Joi.string().allow('', null)).allow('', null).optional(),
    kco: Joi.array().items(Joi.string().allow('', null)).allow('', null).optional(),
    findings: Joi.array().items(Joi.string().allow('', null)).allow('', null).optional(),
    systemicExamination: Joi.array().items(Joi.string().allow('', null)).allow('', null).optional(),
    treatment: Joi.string().allow('', null).optional(),
    advice: Joi.string().allow('', null).optional(),
    medicine: Joi.string().allow('', null).optional(),
    followUpDate: Joi.date().allow('', null).optional(),
    onlineAmount: Joi.number().allow('', null).optional(),
    offlineAmount: Joi.number().allow('', null).optional(),
    findingsOptionsDetails: Joi.object().keys({
      temperatureDetails: Joi.string().allow('', null).optional(),
      bpDetails: Joi.string().allow('', null).optional(),
      pulseRateDetails: Joi.string().allow('', null).optional(),
      respiratoryRateDetails: Joi.string().allow('', null).optional(),
      generalExaminationDetails: Joi.string().allow('', null).optional(),
      skinLesionDetails: Joi.string().allow('', null).optional(),
    }).allow('', null).optional(),
    systemicExaminationOptionsDetails: Joi.object().keys({
      respiratoryDetails: Joi.string().allow('', null).optional(),
      cardioVascularDetails: Joi.string().allow('', null).optional(),
      cnsDetails: Joi.string().allow('', null).optional(),
      perAbdominalExaminationDetails: Joi.string().allow('', null).optional(),
    }).allow('', null).optional(),
    otherComplaints: Joi.string().allow('', null).optional(),
  }),
};

const getGPRecordsByPatient = {
  query: Joi.object().keys({
    patientId: Joi.string().uuid().required(),
  }),
};

const getGPRecord = {
  params: Joi.object().keys({
    gpRecordId: Joi.string().uuid().required(),
  }),
};

const updateGPRecord = {
  params: Joi.object().keys({
    gpRecordId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    weight: Joi.number().allow('', null).optional(),
    height: Joi.number().allow('', null).optional(),
    sugar: Joi.number().allow('', null).optional(),
    bp: Joi.string().allow('', null).optional(),
    hb: Joi.number().allow('', null).optional(),
    complaints: Joi.array().items(Joi.string().allow('', null)).allow('', null).optional(),
    kco: Joi.array().items(Joi.string().allow('', null)).allow('', null).optional(),
    findings: Joi.array().items(Joi.string().allow('', null)).allow('', null).optional(),
    systemicExamination: Joi.array().items(Joi.string().allow('', null)).allow('', null).optional(),
    treatment: Joi.string().allow('', null).optional(),
    advice: Joi.string().allow('', null).optional(),
    medicine: Joi.string().allow('', null).optional(),
    followUpDate: Joi.date().allow('', null).optional(),
    onlineAmount: Joi.number().allow('', null).optional(),
    offlineAmount: Joi.number().allow('', null).optional(),
    findingsOptionsDetails: Joi.object().keys({
      temperatureDetails: Joi.string().allow('', null).optional(),
      bpDetails: Joi.string().allow('', null).optional(),
      pulseRateDetails: Joi.string().allow('', null).optional(),
      respiratoryRateDetails: Joi.string().allow('', null).optional(),
      generalExaminationDetails: Joi.string().allow('', null).optional(),
      skinLesionDetails: Joi.string().allow('', null).optional(),
    }).allow('', null).optional(),
    systemicExaminationOptionsDetails: Joi.object().keys({
      respiratoryDetails: Joi.string().allow('', null).optional(),
      cardioVascularDetails: Joi.string().allow('', null).optional(),
      cnsDetails: Joi.string().allow('', null).optional(),
      perAbdominalExaminationDetails: Joi.string().allow('', null).optional(),
    }).allow('', null).optional(),
    otherComplaints: Joi.string().allow('', null).optional(),
  }).min(1),
};

// const deleteGPRecord = {
//   params: Joi.object().keys({
//     gpRecordId: Joi.string().uuid().required(),
//   }),
// };

/* ***************************** Patient GP CRUD Validation *************************** */

module.exports = {
  createPatient,
  updateMammography,
  updatePatient,
  addDentalPatientRecord,
  getPatientsByClinic,
  getPatientById,
  createDiagnosis,
  getDiagnoses,
  getDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  createTreatment,
  getTreatments,
  getTreatmentById,
  updateTreatment,
  deleteTreatment,
  getMammography,
  createMammography,
  createGPRecord,
  getGPRecordsByPatient,
  getGPRecord,
  updateGPRecord,
  // deleteGPRecord,
};
