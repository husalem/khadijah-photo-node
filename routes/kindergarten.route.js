const express = require('express');
const { body } = require('express-validator');

const controller = require('../controllers/kindergarten.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

router.get(
  '/kindergartens/count',
  controller.getKindergartensCount
);

router.get(
  '/kindergartens/:kindergartenId',
  controller.getKindergarten
);

router.get(
  '/kindergartens',
  controller.getKindergartens
);

router.post(
  '/kindergartens',
  isAuth,
  isAdmin,
  body(['name', 'district'])
    .trim()
    .notEmpty().withMessage('Missing parameter')
    .isLength({ min: 3 }).withMessage('Parameter must be of length 3 at least'),
  controller.createKindergarten
);

router.put(
  '/kindergartens/:kindergartenId',
  isAuth,
  isAdmin,
  body(['name', 'district'])
    .trim()
    .notEmpty().withMessage('Missing parameter')
    .isLength({ min: 3 }).withMessage('Parameter must be of length 3 at least'),
  controller.updateKindergarten
);

router.delete(
  '/kindergartens/:kindergartenId',
  isAuth,
  isAdmin,
  controller.deleteKindergarten
);

module.exports = router;
