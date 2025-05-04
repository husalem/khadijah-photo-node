const express = require('express');

const configController = require('../controllers/app-config.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

router.get(
  '/app/status',
  configController.getAppStatus
);

router.patch(
  '/app/status',
  isAuth,
  isAdmin,
  configController.updateAppStatus
);

module.exports = router;