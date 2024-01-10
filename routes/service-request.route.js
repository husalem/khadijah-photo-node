const express = require('express');
const { body } = require('express-validator');

const requestController = require('../controllers/service-request.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

router.get(
  '/service-requests/count',
  isAuth,
  isAdmin,
  requestController.getServiceRequestsCount
);

router.get(
  '/service-requests',
  isAuth,
  requestController.getServiceRequests
);

router.get(
  '/service-requests/:requestId',
  isAuth,
  requestController.getServiceRequest
);

router.post(
  '/service-requests',
  isAuth,
  body(['type', 'package'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  requestController.createServiceRequest
);

router.put(
  '/service-requests/:requestId',
  isAuth,
  body(['type', 'package'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  requestController.updateServiceRequest
);

router.delete(
  '/service-requests/:requestId',
  isAuth,
  isAdmin,
  requestController.deleteServiceRequest
);

module.exports = router;
