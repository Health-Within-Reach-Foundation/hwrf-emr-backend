const getAllCampsAnalytics = async (clinicId, startDate, endDate) => {
  // const startDate = new Date();
  startDate.setDate(1); // First day of the current month
  startDate.setHours(0, 0, 0, 0);

  // const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0); // Last day of the current month
  endDate.setHours(23, 59, 59, 999);

  console.log('Fetching camp analytics for current month:', startDate, 'to', endDate);

  const camps = await Camp.findAll({
    // where: { startDate: { [Op.between]: [startDate, endDate] }, clinicId }, // Filter camps for current month
    where: { clinicId }, // Filter camps for current month
    include: [
      {
        model: Patient,
        as: 'patients',
        attributes: ['id', 'name', 'regNo', 'age', 'sex', 'mobile'],
        through: { attributes: [] },
        include: [
          {
            model: Appointment,
            as: 'appointments',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            required: false,
            include: [
              {
                model: Specialty,
                as: 'specialty',
                attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
              },
            ],
          },
          {
            model: Queue,
            as: 'queues',
            attributes: ['tokenNumber', 'queueDate', 'queueType', 'specialtyId'],
            required: false,
          },
          {
            model: Diagnosis,
            as: 'diagnoses',
            attributes: ['id', 'createdAt'],
            required: false,
            include: [
              {
                model: Treatment,
                as: 'treatment',
                attributes: ['id', 'paidAmount', 'status'],
                required: false,
                include: [
                  {
                    model: TreatmentSetting,
                    as: 'treatmentSettings',
                    attributes: ['id', 'treatingDoctor', 'onlineAmount', 'offlineAmount', 'crownStatus', 'nextDate'],
                    required: false,
                  },
                ],
              },
            ],
          },
          {
            model: Mammography,
            as: 'mammography',
            attributes: ['id', 'createdAt', 'onlineAmount', 'offlineAmount'],
            required: false,
          },
          {
            model: GeneralPhysicianRecord,
            as: 'gpRecords',
            attributes: ['id', 'createdAt', 'onlineAmount', 'offlineAmount'],
            required: false,
          },
        ],
      },
    ],
  });

  if (!camps || camps.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No camps found for this month');
  }

  let totalRegisteredPatients = 0;
  let totalAttended = 0;
  let totalMissed = 0;
  let totalEarnings = 0;

  let dentistryAnalytics = {
    totalPatients: 0,
    totalAttended: 0,
    totalMissed: 0,
    totalEarnings: 0,
  };

  let gpAnalytics = {
    totalPatients: 0,
    totalAttended: 0,
    totalMissed: 0,
    totalEarnings: 0,
  };

  let mammoAnalytics = {
    totalPatients: 0,
    totalAttended: 0,
    totalMissed: 0,
    totalEarnings: 0,
  };

  camps.forEach((camp) => {
    const uniquePatients = camp.patients.map((p) => ({
      ...p.toJSON(),
      hasAppointments: p.appointments.length > 0,
      hasQueues: p.queues.length > 0,
      servicesTaken: Array.from(new Set(p.queues.map((q) => q.queueType))),
    }));

    totalRegisteredPatients += uniquePatients.length;
    totalAttended += uniquePatients.filter((p) => p.hasAppointments).length;
    totalMissed += uniquePatients.length - totalAttended;

    const campDentistry = calculateDentistryAnalytics(uniquePatients);
    const campGP = calculateGPAnalytics(uniquePatients);
    const campMammo = calculateMammographyAnalytics(uniquePatients);

    dentistryAnalytics.totalPatients += campDentistry.totalDentistryPatients;
    dentistryAnalytics.totalAttended += campDentistry.totalAttended;
    dentistryAnalytics.totalMissed += campDentistry.missed;
    dentistryAnalytics.totalEarnings += campDentistry.totalEarnings;

    gpAnalytics.totalPatients += campGP.totalGPPatients;
    gpAnalytics.totalAttended += campGP.totalAttended;
    gpAnalytics.totalMissed += campGP.missed;
    gpAnalytics.totalEarnings += campGP.onlineEarnings + campGP.offlineEarnings;

    mammoAnalytics.totalPatients += campMammo.totalMammographyPatients;
    mammoAnalytics.totalAttended += campMammo.totalAttended;
    mammoAnalytics.totalMissed += campMammo.missed;
    mammoAnalytics.totalEarnings += campMammo.onlineEarnings + campMammo.offlineEarnings;

    totalEarnings +=
      campDentistry.totalEarnings +
      campGP.onlineEarnings +
      campGP.offlineEarnings +
      campMammo.onlineEarnings +
      campMammo.offlineEarnings;
  });

  return {
    totalCamps: camps.length,
    totalRegisteredPatients,
    totalAttended,
    totalMissed,
    totalEarnings,
    dentistryAnalytics,
    gpAnalytics,
    mammoAnalytics,
  };
};

module.exports = {
  getAllCampsAnalytics,
};
