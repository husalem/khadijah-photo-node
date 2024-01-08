const express = require('express');
const { body } = require('express-validator');

const packageController = require('../controllers/package.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

router.get(
  '/packages/count',
  packageController.getPackagesCount
);

router.get(
  '/packages',
  packageController.getPackages
);

router.get(
  '/packages/:packageId',
  packageController.getPackage
);

router.post(
  '/packages',
  isAuth,
  isAdmin,
  body(['quantity', 'price'])
    .notEmpty().withMessage('Missing parameter')
    .isNumeric().withMessage('Parameter must be numeric')
    .isLength({ min: 1 }).withMessage('Parameter must be greater than 0'),
  packageController.createPackage
);

router.put(
  '/packages/:packageId',
  isAuth,
  isAdmin,
  body(['quantity', 'price'])
    .notEmpty().withMessage('Missing parameter')
    .isNumeric().withMessage('Parameter must be numeric')
    .isLength({ min: 1 }).withMessage('Parameter must be greater than 0'),
  packageController.updatePackage
);

router.delete(
  '/packages/:packageId',
  isAuth,
  isAdmin,
  packageController.deletePackage
);

module.exports = router;
