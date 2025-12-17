const express = require('express');
const { body } = require('express-validator');

const requestController = require('../controllers/kindergarten-request.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

router.get(
  '/kindergarten-requests/count',
  isAuth,
  isAdmin,
  requestController.getRequestsCount
);

router.get(
  '/kindergarten-requests',
  isAuth,
  requestController.getRequests

);

router.get(
  '/kindergarten-requests/:requestId',
  isAuth,
  requestController.getRequest
);

router.post(
  '/kindergarten-requests',
  isAuth,
  body(['kindergarten', 'kindergartenClass', 'childName'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('costums')
    .isArray({ min: 1 }).withMessage('Request must have one costum at least'),
  requestController.createRequest
);

router.put(
  '/kindergarten-requests/:requestId',
  isAuth,
  requestController.updateRequest
);

router.patch(
  '/kindergarten-requests/:requestId/status',
  isAuth,
  isAdmin,
  body(['status'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  requestController.updateRequestStatus
);

router.patch(
  '/kindergarten-requests/status/bulk',
  isAuth,
  isAdmin,
  body(['status', 'requests'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('requests')
    .isArray({ min: 1 }).withMessage('requests must be an array with one item at least'),
  requestController.updateRequestStatusBulk  
);

router.patch(
  '/kindergarten-requests/:requestId/status',
  isAuth,
  isAdmin,
  body(['status'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  requestController.updateRequestStatus
);

router.patch(
  '/kindergarten-requests/:requestId/fees',
  isAuth,
  isAdmin,
  body(['fees'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  requestController.updateRequestAdditionalFees
);

router.delete(
  '/kindergarten-requests/:requestId',
  isAuth,
  isAdmin,
  requestController.deleteRequest
);

module.exports = router;
