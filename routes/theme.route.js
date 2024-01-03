const express = require('express');
const { body, check } = require('express-validator');

const controller = require('../controllers/theme.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

router.get(
  '/themes/count',
  controller.getThemesCount
);

router.get(
  '/themes/:themeId',
  controller.getTheme
);

router.get(
  '/themes',
  controller.getThemes
);

router.post(
  '/themes',
  isAuth,
  isAdmin,
  body('title')
    .trim()
    .notEmpty().withMessage('Missing parameter')
    .isLength({ min: 3 }).withMessage('Parameter must be of length 3 at least'),
  controller.uploadImage.single('themeImage'),
  controller.createTheme
);

router.put(
  '/themes/:themeId',
  isAuth,
  isAdmin,
  controller.uploadImage.single('themeImage'),
  controller.updateTheme
);

router.delete(
  '/themes/:themeId',
  isAuth,
  isAdmin,
  controller.deleteTheme
);

module.exports = router;