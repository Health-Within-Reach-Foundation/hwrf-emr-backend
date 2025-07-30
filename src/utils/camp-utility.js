/**
 * Calculate camp-wide analytics
 */

const calculateCampAnalytics = (patients) => {
  const totalPatients = patients.length; // Total unique patients registered
  const totalAttended = patients.filter(
    (p) =>
      p.hasAppointments && p.appointments.some((a) => a.status === 'in' || a.status === 'out' || a.status === 'in queue')
  ).length; // Only count if patient has an appointment and has checked in/out
  const missed = totalPatients - totalAttended;

  return {
    totalPatients,
    totalAttended,
    missed,
  };
};

/**
 * Calculate analytics for Dentistry module
 */
const calculateDentistryAnalytics = (patients) => {
  // Select patients who took Dentistry service
  const dentistryPatients = patients.filter((p) => p.servicesTaken.includes('Dentistry'));
  const totalDentistryPatients = dentistryPatients.length;

  // Count attended Dentistry patients (who had appointments and checked in/out)
  const totalAttended = dentistryPatients.filter(
    (p) => p.hasAppointments && p.appointments.some((a) => a.status === 'in' || a.status === 'out')
  ).length;

  const missed = totalDentistryPatients - totalAttended;

  // Count OPD patients (who had diagnosis but treatment hasn't started)
  //
  const opdPatients = dentistryPatients.filter(
    // (p) => !p.diagnoses.some((d) => d.treatment && (d.treatment.status === 'started' || d.treatment.status === 'completed'))
    (p) => p?.diagnoses?.length > 0 && !p.diagnoses.some((d) => d.treatment?.treatmentSettings.length > 0)
  ).length;

  // Count patients with treatments (started or completed)
  const totalTreatments = dentistryPatients.filter(
    (p) => p?.diagnoses?.length > 0 && p.diagnoses.some((d) => d.treatment?.treatmentSettings.length > 0)
  ).length;

  // Calculate total earnings from 
  // const totalEarnings = dentistryPatients.reduce(
  //   (sum, p) => sum + p.diagnoses.reduce((dSum, d) => dSum + (d.treatment ? Number(d.treatment.paidAmount) : 0), 0),
  //   0
  // );

  // Online & Offline earnings

  const onlineEarnings = dentistryPatients.reduce(
    (sum, p) =>
      sum +
      p.diagnoses.reduce(
        (dSum, d) =>
          dSum +
          (d.treatment ? d.treatment.treatmentSettings.reduce((tSum, ts) => tSum + Number(ts.onlineAmount || 0), 0) : 0),
        0
      ),
    0
  );

  const offlineEarnings = dentistryPatients.reduce(
    (sum, p) =>
      sum +
      p.diagnoses.reduce(
        (dSum, d) =>
          dSum +
          (d.treatment ? d.treatment.treatmentSettings.reduce((tSum, ts) => tSum + Number(ts.offlineAmount || 0), 0) : 0),
        0
      ),
    0
  );


  // calculate crownEarnings it can be calculated by checking the treatmentSettings.crownStatus is true or not if true then add the onlineAmount and offlineAmount of each treatmentSettings of which crownStatus is true
const crownEarnings = dentistryPatients.reduce((sum, p) => {
    return sum + p.diagnoses.reduce((dSum, d) => {
        if (d.treatment) {
            return dSum + d.treatment.treatmentSettings.reduce((tSum, ts) => {
                // console.log('crownStatus:', ts.crownStatus, ts);
                if (ts.crownStatus) {
                    // console.log('crownStatus true:', ts.crownStatus);
                    // console.log('onlineAmount:', ts.onlineAmount);
                    // console.log('offlineAmount:', ts.offlineAmount);
                    tSum += Number(ts.onlineAmount || 0) + Number(ts.offlineAmount || 0);
                }
                // console.log('tSum:', tSum);
                return tSum;
            }, 0);
        }
        return dSum;
    }, 0);
}, 0);

const totalEarnings = onlineEarnings + offlineEarnings;


  // console.log("crownEarnings", crownEarnings);

  // Doctor-wise data, calculate the doctor-wise earnings but if the crownStatus is false then don't include the offlineAmount and onlineAmount of that treatmentSettings in the earnings
  const doctorWiseData = {};
  dentistryPatients.forEach((p) => {
    p.diagnoses.forEach((d) => {
      if (d.treatment) {
        d.treatment.treatmentSettings.forEach((ts) => {
          if (!doctorWiseData[ts.treatingDoctor?.label]) {
            doctorWiseData[ts.treatingDoctor?.label] = {
              patientsTreated: 0,
              onlineEarnings: 0,
              offlineEarnings: 0,
              treatmentStatuses: {},
            };
          }
          doctorWiseData[ts.treatingDoctor?.label].patientsTreated += 1;
          if (!ts.crownStatus) {
            doctorWiseData[ts.treatingDoctor?.label].onlineEarnings += Number(ts.onlineAmount || 0);
            doctorWiseData[ts.treatingDoctor?.label].offlineEarnings += Number(ts.offlineAmount || 0);
          }
          doctorWiseData[ts.treatingDoctor?.label].treatmentStatuses[d.treatment.status] =
            (doctorWiseData[ts.treatingDoctor?.label].treatmentStatuses[d.treatment.status] || 0) + 1;
        });
      }
    });
  });

  return {
    totalDentistryPatients,
    totalAttended,
    missed,
    opdPatients,
    totalTreatments,
    totalEarnings,
    onlineEarnings,
    offlineEarnings,
    crownEarnings,
    doctorWiseData,
  };
};

const calculateGPAnalytics = (patients) => {
  const gpPatients = patients?.filter((p) => p?.servicesTaken?.includes('GP'));
  const totalGPPatients = gpPatients?.length;

  const totalAttended = gpPatients?.filter(
    (p) => p?.hasAppointments && p?.appointments?.some((a) => a?.status === 'in' || a?.status === 'out')
  )?.length;

  const missed = totalGPPatients - totalAttended;

  const onlineEarnings = gpPatients.reduce((sum, p) => {
    const patientOnlineEarnings = p?.gpRecords?.reduce((dSum, d) => {
      // console.log(`Patient ID: ${p.id}, GP Record ID: ${d.id}, Online Amount: ${d.onlineAmount}`);
      return dSum + Number(d?.onlineAmount || 0);
    }, 0);
    // console.log(`Patient ID: ${p.id}, Total Online Earnings: ${patientOnlineEarnings}`);
    return sum + patientOnlineEarnings;
  }, 0);

  const offlineEarnings = gpPatients.reduce((sum, p) => {
    const patientOfflineEarnings = p?.gpRecords?.reduce((dSum, d) => {
      // console.log(`Patient ID: ${p.id}, GP Record ID: ${d.id}, Offline Amount: ${d.offlineAmount}`);
      return dSum + Number(d?.offlineAmount || 0);
    }, 0);
    // console.log(`Patient ID: ${p.id}, Total Offline Earnings: ${patientOfflineEarnings}`);
    return sum + patientOfflineEarnings;
  }, 0);

  const totalEarnings = onlineEarnings + offlineEarnings;

  return {
    totalGPPatients,
    totalAttended,
    missed,
    totalEarnings,
    onlineEarnings,
    offlineEarnings,
  };
}

const calculateMammographyAnalytics = (patients) => {
  const mammographyPatients = patients?.filter((p) => p?.servicesTaken?.includes('Mammography'));
  const totalMammographyPatients = mammographyPatients?.length;

  const totalAttended = mammographyPatients.filter(
    (p) => p?.hasAppointments && p?.appointments?.some((a) => a?.status === 'in' || a?.status === 'out')
  )?.length;

  const missed = totalMammographyPatients - totalAttended;

  const onlineEarnings = mammographyPatients?.reduce(
    (sum, p) => sum + Number(p?.mammography?.onlineAmount || 0),
    0
  );

  const offlineEarnings = mammographyPatients?.reduce(
    (sum, p) => sum + Number(p?.mammography?.offlineAmount || 0),
    0
  );

  const totalEarnings = onlineEarnings + offlineEarnings;

  return {
    totalMammographyPatients,
    totalAttended,
    missed,
    totalEarnings,
    onlineEarnings,
    offlineEarnings,
  };
}
module.exports = {
  calculateCampAnalytics,
  calculateDentistryAnalytics,
  calculateGPAnalytics,
  calculateMammographyAnalytics,
};
