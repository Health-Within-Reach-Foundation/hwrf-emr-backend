const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const superadminRoute = require('./superadmin.route');
const clinicRoute = require('./clinic.route');
const appointmentRoute = require('./appointment.route');
const patientRoute = require('./patient.route');
const config = require('../../config/config');
const { path } = require('../../app');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

const superadminRoutes = [
  {
    path: '/superadmin',
    route: superadminRoute,
  },
];

const clinicRoutes = [
  {
    path: '/clinics',
    route: clinicRoute,
  },
];

const patientRoutes = [
  {
    path: '/patients',
    route: patientRoute,
  },
];

const appointmentRoutes = [
  {
    path: '/clinics/appointments',
    route: appointmentRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

superadminRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/** 
 * It is sub routes of @clinicRoutes 
 */
appointmentRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

clinicRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

patientRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
