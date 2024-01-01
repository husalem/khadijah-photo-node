const express = require('express');
const { body } = require('express-validator');

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

router.post(
  '/auth/checkVerification',
  body(['phone', 'code']).trim(),
  body('phone')
    .notEmpty().withMessage('Missing param {phone}')
    .isNumeric().withMessage('{phone} param must be numeric')
    .isLength({ min: 9 }).withMessage('{phone} must be of minimum 9 digits'),
  body('code')
    .notEmpty().withMessage('Missing param {code}')
    .isNumeric().withMessage('{code} param must be numeric')
    .isLength({ min: 4, max: 6 }).withMessage('{code} must be of 6 digits'),
  authController.checkVerification
);

router.post(
  '/checkUserExists',
  body('phone')
    .notEmpty().withMessage('Missing param {phone}')
    .isNumeric().withMessage('{phone} param must be numeric')
    .isLength({ min: 9 }).withMessage('{phone} must be of minimum 9 digits'),
  authController.userExists
);

router.post(
  '/register',
  body(['phone', 'firstName', 'lastName']).trim(),
  body(['firstName', 'lastName'])
    .notEmpty().withMessage('Missing param {firstName} or {lastName}'),
  body('phone')
    .notEmpty().withMessage('Missing param {phone}')
    .isNumeric().withMessage('{phone} param must be numeric')
    .isLength({ min: 9 }).withMessage('{phone} must be of minimum 9 digits'),
  authController.register
);

router.post(
  '/signin',
  body('phone')
    .notEmpty().withMessage('Missing param {phone}')
    .isNumeric().withMessage('{phone} param must be numeric')
    .isLength({ min: 9 }).withMessage('{phone} must be of minimum 9 digits'),
  authController.signin
);

router.get(
  '/users/count',
  isAuth,
  authController.getUsersCount
);

router.get(
  '/users',
  isAuth,
  authController.getUsers
);

router.get(
  '/users/:userId',
  isAuth,
  authController.getUser
);

module.exports = router;
