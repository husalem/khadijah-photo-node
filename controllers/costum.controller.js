const fs = require('fs');

const { validationResult } = require('express-validator');

const Costum = require('../models/costum');
const utils = require('../utils');

exports.getCostumsCount = async (req, res, next) => {
  try {
    const count = await Costum.countDocuments();

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getCostum = async (req, res, next) => {
  const { costumId } = req.params;

  try {
    const costum = await Costum.findById(costumId).populate('sizes', ['size', 'netPrice']);

    if (!costum) {
      const error = new Error('Costum does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(200).json(costum);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getCostums = async (req, res, next) => {
  const { skip, limit } = req.query;

  try {
    const costums = await Costum.find().skip(skip).limit(limit).populate('sizes', ['size', 'netPrice']);

    res.status(200).json(costums);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
exports.createCostum = async (req, res, next) => {
  let input = req.body;
  const costumImage = req.file;
  const errors = validationResult(req);

  try {
    if (!costumImage) {
      const error = new Error('Missing costum image');
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

    let sizeArray = [];
    if (input.sizes) {
      const array = JSON.parse(input.sizes);
      if (array?.length) {
        input.sizes = array.map((obj) => obj.size);
      }
    }

    input.imagePath = costumImage.path;

    const costumObj = new Costum({ ...input });

    const costum = await costumObj.save();

    res.status(201).json(costum);
  } catch (error) {
    if (fs.existsSync(costumImage.path)) {
      fs.unlink(costumImage.path, (error) => {
        if (error) {
          console.log(`Costum ${costumImage.path} should have been deleted and it has not due to an error.`);
        }
      });
    }

    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updateCostum = async (req, res, next) => {
  const { costumId } = req.params;
  let input = req.body;
  const costumImage = req.file;
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

    const loadedCostum = await Costum.findById(costumId);

    // If file was uploaded, delete the old file
    if (costumImage) {
      if (fs.existsSync(loadedCostum.imagePath)) {
        fs.unlink(loadedCostum.imagePath, (error) => {
          if (error) {
            console.log(
              `Costum ${loadedCostum.imagePath} should have been deleted and it has not due to an error.`
            );
          }

          console.log(`Costum ${loadedCostum.title} was replaced`);
        });
      }

      // Update the path
      input.imagePath = costumImage.path;
    }

    const result = await Costum.updateOne({ _id: costumId }, { ...input });

    if (!result.matchedCount) {
      const error = new Error('Costum does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(201).json(result);
  } catch (error) {
    if (fs.existsSync(costumImage.path)) {
      fs.unlink(costumImage.path, (error) => {
        if (error) {
          console.log(`Costum ${costumImage.path} should have been deleted and it has not due to an error.`);
        }
      });
    }

    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.deleteCostum = async (req, res, next) => {
  const { costumId } = req.params;

  try {
    const costum = await Costum.findById(costumId);

    if (!costum) {
      const error = new Error('Costum does not exist');
      error.statusCode = 404;

      throw error;
    }

    if (fs.existsSync(costum.imagePath)) {
      fs.unlink(costum.imagePath, (error) => {
        if (error) {
          console.log(`Costum ${costum.imagePath} should have been deleted and it has not due to an error.`);
        }
      });
    }

    await costum.deleteOne();
    // await Costum.deleteOne({ _id: costumId });

    res.status(201).json({ message: 'Costum was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
exports.uploadImage = utils
  .getMulterConfig('assets/images/costums', ['image/png', 'image/jpg', 'image/jpeg'])
  .single('costumImage');
