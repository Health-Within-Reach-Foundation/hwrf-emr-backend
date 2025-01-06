const allRoles = {
  user: [],
  admin: ['getUsers', 'manageUsers'],
};
const ermAllRoles = {
  superadmin: [],
  admin: [],
  doctor: [],
  receptionist: [],
  assistant: [],
};

const ermRoles = Object.keys(ermAllRoles);
const ermRoleRights = new Map(Object.entries(ermAllRoles));

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
  ermRoles,
  ermRoleRights,
};
