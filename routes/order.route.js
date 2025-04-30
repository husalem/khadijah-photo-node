const express = require('express');

const orderController = require('../controllers/order.controller');
const isAuth = require('../middleware/is-auth.middleware');

const router = express.Router();

router.get(
  '/orders/count',
  isAuth,
  orderController.getOrdersCount
);

router.get(
  '/orders',
  isAuth,
  orderController.getOrders
);

module.exports = router;
