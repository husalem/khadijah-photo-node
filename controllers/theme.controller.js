const fs = require('fs');

const { validationResult } = require('express-validator');

const Theme = require('../models/theme');
const utils = require('../utils');

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
  const themeImages = req.files || [];
  let input = req.body;
  const errors = validationResult(req);

  try {
    if (!themeImages.length) {
      const error = new Error('Missing theme images');
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

    input.imagesPaths = themeImages.map((image) => image.path);

    const themeObj = new Theme({ ...input });

    const theme = await themeObj.save();

    res.status(201).json(theme);
  } catch (error) {
    // Delete file if uploaded in case of error
    themeImages.map((themeImage) => {
      if (themeImage && fs.existsSync(themeImage.path)) {
        fs.unlink(themeImage.path, (error) => {
          if (error) {
            console.log(
              `Theme image ${themeImage.path} should have been deleted and it has not due to an error.`
            );
          }
        });
      }
    });

    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updateTheme = async (req, res, next) => {
  const { themeId } = req.params;
  const themeImages = req.files || [];
  let input = req.body;
  const errors = validationResult(req);

  try {
    if (!themeImages.length) {
      const error = new Error('Missing theme images');
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

    let loadedTheme = await Theme.findById(themeId);
    
    // If file was uploaded, delete the old files
    if (themeImages.length) {
      loadedTheme.imagesPaths.map((imagePath) => {
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (error) => {
            if (error) {
              console.log(
                `Theme image ${imagePath} should have been deleted and it has not due to an error.`
              );
            }
  
            console.log(`Theme image ${imagePath} was replaced`);
          });
        }
      });
      
      // Update the paths
      input.imagesPaths = themeImages.map((image) => image.path);
    }

    const result = await Theme.updateOne({ _id: themeId }, { ...input });

    if (!result.matchedCount) {
      const error = new Error('Theme does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(201).json(result);
  } catch (error) {
    // Delete file if uploaded in case of error
    themeImages.map((themeImage) => {
      if (themeImage && fs.existsSync(themeImage.path)) {
        fs.unlink(themeImage.path, (error) => {
          if (error) {
            console.log(
              `Theme image ${themeImage.path} should have been deleted and it has not due to an error.`
            );
          }
        });
      }
    });

    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.deleteTheme = async (req, res, next) => {
  const { themeId } = req.params;

  try {
    await Theme.deleteOne({ _id: themeId });

    res.status(201).json({ message: 'Theme was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.uploadImages = utils
  .getMulterConfig('assets/themes', ['image/png', 'image/jpg', 'image/jpeg'])
  .array('themeImage');
