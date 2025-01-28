// Helper function to generate regNo based on clinic initials (simple sequential numbers)
const generateRegNo = (clinicInitials, lastPatient) => {
  // // Find the highest regNo for the given clinic
  // const lastPatient = await Patient.findOne({
  //   where: {
  //     regNo: { [Op.like]: `${clinicInitials}%` }, // regNo starts with clinic initials
  //   },
  //   order: [['regNo', 'DESC']], // Order by regNo descending to get the latest
  // });

  // Extract the last number from the regNo (assuming format: "AP1", "AP2", etc.)
  const lastNumber = lastPatient ? parseInt(lastPatient.regNo.slice(clinicInitials.length), 10) : 0;

  // Increment the last number (no padding needed)
  const nextNumber = lastNumber + 1;
  return `${"HWRF-"}${nextNumber}`;
};

module.exports = generateRegNo;
