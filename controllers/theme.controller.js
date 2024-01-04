const fs = require('fs');

const { validationResult } = require('express-validator');
const multer = require('multer');

const Theme = require('../models/theme');

exports.getThemesCount = async (req, res, next) => {
  try {
    const count = await Theme.countDocuments();

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getTheme = async (req, res, next) => {
  const { themeId } = req.params;

  try {
    const theme = await Theme.findById(themeId);

    if (!theme) {
      const error = new Error('Theme does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(200).json(theme);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getThemes = async (req, res, next) => {
  const { skip, limit } = req.query;

  try {
    const themes = await Theme.find().skip(skip).limit(limit);

    res.status(200).json(themes);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.createTheme = async (req, res, next) => {
  const themeImage = req.file;
  const input = req.body;
  const errors = validationResult(req);

  try {
    if (!themeImage) {
      const error = new Error('Missing image file');
      error.statusCode = 400;

      throw error;
    }

    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };

      throw error;
    }

    const tags = input.tags ? input.tags.split(',').map((tag) => tag.trim()) : [];

    const themeObj = new Theme({ imagePath: themeImage.path, ...input, tags });

    const theme = await themeObj.save();

    res.status(201).json(theme);
  } catch (error) {
    // Delete file if uploaded in case of error
    if (themeImage && fs.existsSync(themeImage.path)) {
      fs.unlink(themeImage.path);
    }

    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updateTheme = async (req, res, next) => {
  const { themeId } = req.params;
  const themeImage = req.file;
  const input = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };

      throw error;
    }

    let loadedTheme = await Theme.findById(themeId);

    // If file was uploaded, delete the old file
    if (themeImage) {
      if (fs.existsSync(loadedTheme.imagePath)) {
        fs.unlink(loadedTheme.imagePath);
      }

      // Update the path
      loadedTheme.imagePath = themeImage.path;
    }

    const tags = input.tags ? input.tags.split(',').map((tag) => tag.trim()) : [];

    const themeObj = new Theme({ ...loadedTheme, ...input, tags });

    const theme = await themeObj.save();

    res.status(201).json(theme);
  } catch (error) {
    // Delete file if uploaded in case of error
    if (themeImage && fs.existsSync(themeImage.path)) {
      fs.unlinkSync(themeImage.path);
    }

    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

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
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

exports.uploadImage = multer({ storage, fileFilter });
