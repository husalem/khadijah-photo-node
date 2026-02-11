const express = require('express');

const controller = require('../controllers/studio-sample.controller');
const isAuth = require('../middleware/is-auth.middleware');
const isAdmin = require('../middleware/is-admin.middleware');

const router = express.Router();

router.get(
  '/samples/count',
  controller.getSamplesCount
);

router.get(
  '/samples/:themeId',
  controller.getSample
);

router.get(
  '/samples',
  controller.getSamples
);

router.post(
  '/samples',
  isAuth,
  isAdmin,
  controller.uploadSampleImage,
  controller.createSample
);

router.put(
  '/samples/:sampleId',
  isAuth,
  isAdmin,
  controller.uploadSampleImage,
  controller.updateSample
);

router.delete(
  '/samples/:sampleId',
  isAuth,
  isAdmin,
  controller.deleteSample
);

module.exports = router;