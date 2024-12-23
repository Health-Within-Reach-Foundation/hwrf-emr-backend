const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const superadminRoute = require('./superadmin.route');
const clinicRoute = require('./clinic.route');
const config = require('../../config/config');

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

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

superadminRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

clinicRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
