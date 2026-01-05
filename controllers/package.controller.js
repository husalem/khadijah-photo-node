const { validationResult } = require('express-validator');

const Package = require('../models/package');
const utils = require('../utils');

exports.getPackagesCount = async (req, res, next) => {
  const { filter } = req.query;
  const { query } = utils.prepareFilterAndSort(filter, '', [], []);

  try {
    const count = await Package.countDocuments(query);

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getPackage = async (req, res, next) => {
  const { packageId } = req.params;

  try {
    const package = await Package.findById(packageId);

    if (!package) {
      const error = new Error('Package does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(200).json(package);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getPackages = async (req, res, next) => {
  const { skip, limit, filter, sort } = req.query;
  const { query, sorter } = utils.prepareFilterAndSort(filter, sort, [], []);

  try {
    const packages = await Package.find(query).sort(sorter).skip(skip).limit(limit);

    res.status(200).json(packages);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
exports.createPackage = async (req, res, next) => {
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

    const packageObj = new Package({ ...input });

    const package = await packageObj.save();
    const flatPackage = package.toObject(utils.resOpts);

    res.status(201).json(flatPackage);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updatePackage = async (req, res, next) => {
  const { packageId } = req.params;
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

    const result = await Package.findOneAndUpdate({ _id: packageId }, { ...input }, { new: true });

    if (!result) {
      const error = new Error('Package does not exist');
      error.statusCode = 404;

      throw error;
    }

    const flatPackage = result.toObject(utils.resOpts);

    res.status(201).json(flatPackage);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.deletePackage = async (req, res, next) => {
  const { packageId } = req.params;

  try {
    await Package.deleteOne({ _id: packageId });

    res.status(201).json({ message: 'Package was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
