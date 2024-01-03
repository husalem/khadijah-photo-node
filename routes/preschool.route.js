const express = require('express');
const { body } = require('express-validator');

const controller = require('../controllers/preschool.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

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
  body(['name', 'district'])
    .trim()
    .notEmpty().withMessage('Missing parameter')
    .isLength({ min: 3 }).withMessage('Parameter must be of length 3 at least'),
  controller.createPreschool
);

router.put(
  '/preschools/:preschoolId',
  isAuth,
  isAdmin,
  body(['name', 'district'])
    .trim()
    .notEmpty().withMessage('Missing parameter')
    .isLength({ min: 3 }).withMessage('Parameter must be of length 3 at least'),
  controller.updatePreschool
);

router.delete(
  '/preschools/:preschoolId',
  isAuth,
  isAdmin,
  controller.deletePreschool
);

module.exports = router;
