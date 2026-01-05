const { validationResult } = require('express-validator');

const PaperSize = require('../models/paper-size');
const utils = require('../utils');

exports.getPaperSizesCount = async (req, res, next) => {
  const { filter } = req.query;
  const { query } = utils.prepareFilterAndSort(filter, '', [], []);

  try {
    const count = await PaperSize.countDocuments(query);

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getPaperSize = async (req, res, next) => {
  const { paperSizeId } = req.params;

  try {
    const paperSize = await PaperSize.findById(paperSizeId);

    if (!paperSize) {
      const error = new Error('Paper size does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(200).json(paperSize);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getPaperSizes = async (req, res, next) => {
  const { skip, limit, filter, sort } = req.query;
  const { query, sorter } = utils.prepareFilterAndSort(filter, sort, [], []);

  try {
    const paperSizes = await PaperSize.find(query).sort(sorter).skip(skip).limit(limit);

    res.status(200).json(paperSizes);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
exports.createPaperSize = async (req, res, next) => {
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

    const paperSizeObj = new PaperSize({ ...input });

    const paperSize = await paperSizeObj.save();
    const flatPs = paperSize.toObject(utils.resOpts);

    res.status(201).json(flatPs);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updatePaperSize = async (req, res, next) => {
  const { paperSizeId } = req.params;
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

    const result = await PaperSize.findOneAndUpdate({ _id: paperSizeId }, { ...input }, { new: true });

    if (!result) {
      const error = new Error('Paper size does not exist');
      error.statusCode = 404;

      throw error;
    }

    const flatPs = result.toObject(utils.resOpts);

    res.status(201).json(flatPs);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.deletePaperSize = async (req, res, next) => {
  const { paperSizeId } = req.params;

  try {
    await PaperSize.deleteOne({ _id: paperSizeId });

    res.status(201).json({ message: 'Paper size was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
