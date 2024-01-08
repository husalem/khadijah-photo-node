const express = require('express');
const { body } = require('express-validator');

const paperSizeController = require('../controllers/paper-size.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

router.get(
  '/paper-sizes/count',
  paperSizeController.getPaperSizesCount
);

router.get(
  '/paper-sizes',
  paperSizeController.getPaperSizes
);

router.get(
  '/paper-sizes/:paperSizeId',
  paperSizeController.getPaperSize
);

router.post(
  '/paper-sizes',
  isAuth,
  isAdmin,
  body(['size', 'price'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('price').isNumeric().withMessage('Parameter must be numeric'),
  paperSizeController.createPaperSize
);

router.put(
  '/paper-sizes/:paperSizeId',
  isAuth,
  isAdmin,
  body(['size', 'price'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('price').isNumeric().withMessage('Parameter must be numeric'),
  paperSizeController.updatePaperSize
);

router.delete(
  '/paper-sizes/:paperSizeId',
  isAuth,
  isAdmin,
  paperSizeController.deletePaperSize
);

module.exports = router;
