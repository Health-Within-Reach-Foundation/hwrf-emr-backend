const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const { User } = require('../models/user.model');
const { Role } = require('../models/role.model');
const { Permission } = require('../models/permission.model'); // Import Permission model
const { Clinic } = require('../models/clinic.model');
const { Specialty } = require('../models/specialty.model');
const { Camp } = require('../models/camp.model');

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }

    // Fetch user with roles and permissions
    const user = await User.findByPk(payload.sub, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] }, // Exclude junction table fields
          include: [
            {
              model: Permission, // Include permissions for roles
              as: 'permissions',
              attributes: ['id', 'action'], // Fetch permission details
              through: { attributes: [] }, // Exclude intermediate fields
            },
          ],
          attributes: { exclude: ['createdAt', 'updatedAt', 'userId', 'clinicId'] },
          required: false,
        },
        {
          model: Clinic,
          as: 'clinic', // Clinic relationship
          attributes: ['id', 'clinicName', 'status'],
          required:false,
        },
        {
          model: Specialty,
          as: 'specialties', // Specialty relationship
          through: { attributes: [] },
          attributes: ['id', 'name', 'departmentName'],
          required: false,
        },
        {
          model: Camp,
          as: 'camps', // Camp relationship
          through: { attributes: [] },
          where: { status: 'active' },
          required: false,
          attributes: { exclude: ['clinicId', 'updatedAt'] },
        },
      ],
    });

    if (!user) {
      return done(null, false);
    }

    // Extract permissions and attach to user object
    const permissions = user.roles.flatMap((role) => role.permissions.map((perm) => perm.action));
    user.permissions = Array.from(new Set(permissions)); // Avoid duplicate permissions

    done(null, user);
  } catch (error) {
    console.error('Error in JWT verification:', error);
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
