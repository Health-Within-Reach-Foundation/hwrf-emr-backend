const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const { User } = require('../models/user.model');
const { Role } = require('../models/role.model');
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
    const user = await User.findByPk(payload.sub, {
      // include: {
      //   model: Role,
      //   as: 'roles',
      //   through: { attributes: [] }, // Exclude intermediate table fields
      //   attributes: { exclude: ['createdAt', 'updatedAt', 'userId', 'clinicId'] },
      // },
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] }, // Exclude junction table
          attributes: { exclude: ['createdAt', 'updatedAt', 'userId', 'clinicId'] }, // Clean unnecessary fields
        },
        {
          model: Clinic,
          as: 'clinic', // Assuming Clinic has alias 'clinic' in User model
          attributes: ['id', 'clinicName', 'status'], // Only required fields
        },
        {
          model: Specialty,
          as: 'specialties', // Assuming User has a many-to-many relationship with Specialty
          through: { attributes: [] }, // Exclude intermediate fields
          attributes: ['id', 'name', 'departmentName'], // Minimal required fields
        },
        {
          model: Camp,
          as: 'camps',
          through: { attributes: [] },
          attributes: { exclude: ['clinicId', 'updatedAt'] },
        },
      ],
    });
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    console.log('error in passport verifcation ****** -->', error);
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
