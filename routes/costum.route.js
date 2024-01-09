const express = require('express');
const { body } = require('express-validator');

const costumController = require('../controllers/costum.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

router.get(
  '/costums/count',
  costumController.getCostumsCount
);

router.get(
  '/costums',
  costumController.getCostums
);

router.get(
  '/costums/:costumId',
  costumController.getCostum
);

router.post(
  '/costums',
  isAuth,
  isAdmin,
  costumController.uploadImage,
  body('title').trim().notEmpty().withMessage('Missing parameter'),
  costumController.createCostum
);

router.put(
  '/costums/:costumId',
  isAuth,
  isAdmin,
  costumController.uploadImage,
  body('title').trim().notEmpty().withMessage('Missing parameter'),
  costumController.updateCostum
);

router.delete(
  '/costums/:costumId',
  isAuth,
  isAdmin,
  costumController.deleteCostum
);

module.exports = router;
