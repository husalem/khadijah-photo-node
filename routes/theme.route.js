const express = require('express');
const { body, param } = require('express-validator');

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
  controller.upload.single('themeImage'),
  controller.createTheme
);

router.put(
  '/themes/:themeId',
  isAuth,
  isAdmin,
  controller.upload.single('themeImage'),
  controller.updateTheme
);

router.delete(
  '/themes/:themeId',
  isAuth,
  isAdmin,
  controller.deleteTheme
);

module.exports = router;