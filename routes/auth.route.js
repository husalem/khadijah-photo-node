const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth.controller');
const isAuth = require('../middleware/is-auth.middleware');

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

module.exports = router;
