const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const Costum = require('../models/costum');
const PaperSize = require('../models/paper-size');
const utils = require('../utils');

const allowedFilters = ['title', 'tags', 'withFriend'];
const allowedSorters = ['title', 'createdAt'];
const populate = [{ path: 'sizes', select: ['size', 'netPrice'] }];

const resOpts = {
  flattenObjectIds: true,
  schemaFieldsOnly: true,
  versionKey: false
};

exports.getCostumsCount = async (req, res, next) => {
  const { filter } = req.query;
  const { query } = utils.prepareFilterAndSort(filter, '', allowedFilters, []);

  try {
    const count = await Costum.countDocuments(query);

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
    const costum = await Costum.findById(costumId).populate(populate);

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
  const { skip, limit, filter, sort } = req.query;
  const { query, sorter } = utils.prepareFilterAndSort(filter, sort, allowedFilters, allowedSorters);

  try {
    const costums = await Costum.find(query).sort(sorter).skip(skip).limit(limit).populate(populate);

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

    const array = JSON.parse(input.sizes);
    if (array?.length) {
      input.sizes = array.map((obj) => new ObjectId(obj.size));
    }

    input.imagePath = costumImage.path;

    const costumObj = new Costum({ ...input });

    const costum = await costumObj.save();
    const flatCostum = costum.toObject(resOpts);

    res.status(201).json(flatCostum);
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
            console.log(`Costum ${loadedCostum.imagePath} should have been deleted and it has not due to an error.`);
          }

          console.log(`Costum image of "${loadedCostum.title}" was replaced`);
        });
      }

      // Update the path
      input.imagePath = costumImage.path;
    }

    const array = JSON.parse(input.sizes);
    if (array?.length) {
      input.sizes = array.map((obj) => new ObjectId(obj.size));
    } else {
      input.sizes = [];
    }

    const result = await Costum.findByIdAndUpdate({ _id: costumId }, { ...input }, { new: true });

    if (!result) {
      const error = new Error('Costum does not exist');
      error.statusCode = 404;

      throw error;
    }

    const flatCostum = result.toObject(resOpts);

    res.status(201).json(flatCostum);
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
