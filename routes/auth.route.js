const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

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

router.post(
  '/auth/verification',
  body('phone')
    .trim()
    .notEmpty().withMessage('Missing parameter')
    .isNumeric().withMessage('Parameter must be numeric')
    .isLength({ min: 9 }).withMessage('Parameter must be of length 9 at least'),
  authController.createVerification
);

router.post(
  '/auth/checkVerification',
  body(['phone', 'code'])
    .trim()
    .notEmpty().withMessage('Missing parameter')
    .isNumeric().withMessage('Parameter must be numeric'),
  body('phone')
    .isLength({ min: 9 }).withMessage('Parameter must be of length 9 at least'),
  body('code')
    .isLength({ min: 4, max: 6 }).withMessage('{code} must be of length 6'),
  authController.checkVerification
);

router.post(
  '/checkUserExists',
  body('phone')
    .trim()
    .notEmpty().withMessage('Missing parameter')
    .isNumeric().withMessage('Parameter must be numeric')
    .isLength({ min: 9 }).withMessage('Parameter must be of length 9 at least'),
  authController.userExists
);

router.post(
  '/register',
  body(['phone', 'firstName', 'lastName'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('phone')
    .isNumeric().withMessage('Parameter must be numeric')
    .isLength({ min: 9 }).withMessage('Parameter must be of length 9'),
  authController.register
);

router.post(
  '/signin',
  body('phone')
    .trim()
    .notEmpty().withMessage('Missing parameter')
    .isNumeric().withMessage('Parameter must be numeric')
    .isLength({ min: 9 }).withMessage('Parameter must be of length 9 at least'),
  authController.signin
);

router.post(
  '/auth/admin/signin',
  body(['email', 'password'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail({ gmail_remove_dots: false }),
  authController.adminSignin
);

router.post(
  '/auth/admin/register',
  isAuth,
  isAdmin,
  body(['email', 'password'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  authController.adminRegister
);

router.post(
  '/auth/admin/forgot-password',
  body('email')
    .trim()
    .notEmpty().withMessage('Missing parameter')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail({ gmail_remove_dots: false }),
  authController.adminForgotPassword
);

router.get(
  '/auth/admin/reset-password/:token',
  authController.checkAdminResetToken
);

router.post(
  '/auth/admin/reset-password',
  body(['token', 'newPassword'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  authController.adminPasswordReset
);


module.exports = router;
