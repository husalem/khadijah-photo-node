const express = require('express');

const User = require('../models/user');
const authController = require('../controllers/auth.controller');
const isAuth = require('../middleware/is-auth.middleware');

const router = express.Router();

router.post(
  '/auth/verification',
  authController.createVerification
);

module.exports = router;
