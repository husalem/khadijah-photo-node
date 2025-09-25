const express = require('express');
const { body } = require('express-validator');

const controller = require('../controllers/kindergarten-class.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

router.get(
  '/kindergarten-classes/count',
  isAuth,
  isAdmin,
  controller.getKindergartenClassesCount
);

router.get(
  '/kindergarten-classes/:classId',
  controller.getKindergartenClass
);

router.get(
  '/kindergarten-classes',
  isAuth,
  isAdmin,
  controller.getKindergartenClasses
);

router.get(
  '/kindergarten-classes/count/by-kindergarten/:kindergartenId',
  controller.getKindergartenClassesCountByKindergarten
);

router.get(
  '/kindergarten-classes/by-kindergarten/:kindergartenId',
  controller.getKindergartenClassesByKindergarten
);

router.post(
  '/kindergarten-classes',
  isAuth,
  isAdmin,
  body(['name', 'kindergarten'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('name')
    .isLength({ min: 2 }).withMessage('Parameter must be of length 2 at least'),
  controller.createKindergartenClass
);

router.put(
  '/kindergarten-classes/:classId',
  isAuth,
  isAdmin,
  body(['name', 'kindergarten'])
    .trim()
    .notEmpty().withMessage('Missing parameter'),
  body('name')
    .isLength({ min: 2 }).withMessage('Parameter must be of length 2 at least'),
  controller.updateKindergartenClass
);

router.delete(
  '/kindergarten-classes/:classId',
  isAuth,
  isAdmin,
  controller.deleteKindergartenClass
);

router.patch(
  '/kindergarten-classes/:classId/toggle-activation',
  isAuth,
  isAdmin,
  controller.toggleKindergartenClassActivation
);

module.exports = router;