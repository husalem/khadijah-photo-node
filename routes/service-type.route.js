const express = require('express');
const { body } = require('express-validator');

const serviceTypeController = require('../controllers/service-type.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

router.get(
  '/service-types/count',
  serviceTypeController.getServiceTypesCount
);

router.get(
  '/service-types',
  serviceTypeController.getServiceTypes
);

router.get(
  '/service-types/:serviceTypeId',
  serviceTypeController.getServiceType
);

router.post(
  '/service-types',
  isAuth,
  isAdmin,
  serviceTypeController.uploadThumbnail,
  body('name').trim().notEmpty().withMessage('Missing parameter'),
  serviceTypeController.createServiceType
);

router.put(
  '/service-types/:serviceTypeId',
  isAuth,
  isAdmin,
  serviceTypeController.uploadThumbnail,
  body('name').trim().notEmpty().withMessage('Missing parameter'),
  serviceTypeController.updateServiceType
);

router.delete(
  '/service-types/:serviceTypeId',
  isAuth,
  isAdmin,
  serviceTypeController.deleteServiceType
);

module.exports = router;
