const express = require('express');
const { body } = require('express-validator');

const serviceAddController = require('../controllers/service-adds.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

router.get(
  '/service-adds/count',
  serviceAddController.getServiceAddsCount
);

router.get(
  '/service-adds',
  serviceAddController.getServiceAdds
);

router.get(
  '/service-adds/:serviceAddId',
  serviceAddController.getServiceAdd
);

router.post(
  '/service-adds',
  isAuth,
  isAdmin,
  body(['name', 'service', 'price'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('price').isNumeric().withMessage('Parameter must be a number'),
  serviceAddController.createServiceAdd
);

router.put(
  '/service-adds/:serviceAddId',
  isAuth,
  isAdmin,
  body(['name', 'service', 'price'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('price').isNumeric().withMessage('Parameter must be a number'),
  serviceAddController.updateServiceAdd
);

router.delete(
  '/service-adds/:serviceAddId',
  isAuth,
  isAdmin,
  serviceAddController.deleteServiceAdd
);

module.exports = router;
