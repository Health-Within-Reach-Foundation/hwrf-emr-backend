const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const { User } = require('../models/user.model');
const { userService } = require('../services');
const logger = require('./logger');

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
    // const user = await User.findByPk(payload.sub, {
    //   include: [
    //     {
    //       model: Role,
    //       as: 'roles',
    //       through: { attributes: [] }, // Exclude junction table fields
    //       include: [
    //         {
    //           model: Permission, // Include permissions for roles
    //           as: 'permissions',
    //           attributes: ['id', 'action'], // Fetch permission details
    //           through: { attributes: [] }, // Exclude intermediate fields
    //         },
    //       ],
    //       attributes: { exclude: ['createdAt', 'updatedAt', 'userId', 'clinicId'] },
    //       required: false,
    //       separate:true,
    //     },
    //     {
    //       model: Clinic,
    //       as: 'clinic', // Clinic relationship
    //       attributes: ['id', 'clinicName', 'status'],
    //       required: false,
    //     },
    //     {
    //       model: Specialty,
    //       as: 'specialties', // Specialty relationship
    //       through: { attributes: [] },
    //       attributes: ['id', 'name', 'departmentName'],
    //       required: false,
    //       separate:true
    //     },
    //     {
    //       model: Camp,
    //       as: 'camps', // Camp relationship
    //       through: { attributes: [] },
    //       where: { status: 'active' },
    //       required: false,
    //       attributes: { exclude: ['clinicId', 'updatedAt'] },
    //     },
    //   ],
    // });
    logger.info('JWT verification started');
    // start time to measure how much time is taken to verify the token
    const startTime = Date.now();
    const user = await userService.getUserById(payload.sub);
    // log the time taken to verify the token
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    logger.warn(`Time taken to verify the token: ${timeTaken}ms`);
    if (!user) {
      return done(null, false);
    }
    // Extract permissions and attach to user object
    const permissions = user.roles.flatMap((role) => role.permissions.map((perm) => perm.action));
    user.permissions = Array.from(new Set(permissions)); // Avoid duplicate permissions
    logger.info('JWT verification completed');
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
