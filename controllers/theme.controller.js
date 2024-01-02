const fs = require('fs');

const { validationResult } = require('express-validator');
const multer = require('multer');

const Theme = require('../models/theme');

exports.getThemesCount = async (req, res, next) => {};
exports.getTheme = async (req, res, next) => {};
exports.getThemes = async (req, res, next) => {};
exports.createTheme = async (req, res, next) => {};
exports.updateTheme = async (req, res, next) => {};
exports.deleteTheme = async (req, res, next) => {};

// Setup storage location for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'assets/themes/';

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const original = file.originalname;
    const fileName = Date.now() + '-' + original;

    cb(null, fileName);
  }
});

// Setup uploaded file filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg') {
    cb(null, true)
  } else {
    cb(null, false);
  }
};

exports.upload = multer({ storage, fileFilter });