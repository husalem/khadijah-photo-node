const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth.controller');
const isAuth = require('../middleware/is-auth.middleware');

const router = express.Router();

router.post(
  '/auth/verification',
  body('phone')
    .trim()
    .notEmpty().withMessage('Missing param {phone}')
    .isNumeric().withMessage('{phone} param must be numeric')
    .isLength({ min: 9 }).withMessage('{phone} must be of minimum 9 digits'),
  authController.createVerification
);

module.exports = router;
