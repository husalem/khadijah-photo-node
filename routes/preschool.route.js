const express = require('express');
const { body } = require('express-validator');

const controller = require('../controllers/preschool.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router;

router.get(
  '/preschools/count',
  controller.getPreschoolsCount
);

router.get(
  '/preschools/:preschoolId',
  controller.getPreschool
);

router.get(
  '/preschools',
  controller.getPreschools
);

router.post(
  '/preschools',
  isAuth,
  isAdmin,
  body(['name', 'district']).trim(),
  body('name')
    .notEmpty().withMessage('Missing param {name}')
    .isLength({ min: 3 }).withMessage('{name} param must be of 3 characters length at least'),
  body('district')
    .notEmpty().withMessage('Missing param {district}')
    .isLength({ min: 3 }).withMessage('{district} param must be of 3 characters length at least'),
  controller.createPreschool
);

router.put(
  '/preschools/:preschoolId',
  isAuth,
  isAdmin,
  body(['name', 'district']).trim(),
  body('name')
    .notEmpty().withMessage('Missing param {name}')
    .isLength({ min: 3 }).withMessage('{name} param must be of 3 characters length at least'),
  body('district')
    .notEmpty().withMessage('Missing param {district}')
    .isLength({ min: 3 }).withMessage('{district} param must be of 3 characters length at least'),
  controller.updatePreschool
);

router.delete(
  '/preschools/:preschoolId',
  isAuth,
  isAdmin,
  controller.deletePreschool
);
