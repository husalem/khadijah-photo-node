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
  body(['kindergarten', 'kindergartenClass', 'childName'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('costums')
    .isArray({ min: 1 }).withMessage('Request must have one costum at least'),
  requestController.updateRequest
);

router.delete(
  '/kindergarten-requests/:requestId',
  isAuth,
  isAdmin,
  requestController.deleteRequest
);

module.exports = router;
