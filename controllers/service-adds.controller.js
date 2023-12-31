const { validationResult } = require('express-validator');

const ServiceAdd = require('../models/service-adds');

exports.getServiceAddsCount = async (req, res, next) => {
  try {
    const count = await ServiceAdd.countDocuments();

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getServiceAdd = async (req, res, next) => {
  const { serviceAddId } = req.params;

  try {
    const addition = await ServiceAdd.findById(serviceAddId);

    if (!addition) {
      const error = new Error('Service-add does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(200).json(addition);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getServiceAdds = async (req, res, next) => {
  const { addType, skip, limit } = req.query;

  let query = {};

  if (addType && (addType === 'K' || addType === 'O')) {
    query.service = addType;
  }

  try {
    const additions = await ServiceAdd.find(query).skip(skip).limit(limit);

    res.status(200).json(additions);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
exports.createServiceAdd = async (req, res, next) => {
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

    const additionObj = new ServiceAdd({ ...input });

    const addition = await additionObj.save();


    res.status(201).json(addition);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updateServiceAdd = async (req, res, next) => {
  const { serviceAddId } = req.params;
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

    const result = await ServiceAdd.updateOne({ _id: serviceAddId }, { ...input });

    if (!result.matchedCount) {
      const error = new Error('Service-add does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(201).json(result);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.deleteServiceAdd = async (req, res, next) => {
  const { serviceAddId } = req.params;

  try {
    await ServiceAdd.deleteOne({ _id: serviceAddId });

    res.status(201).json({ message: 'Service-add was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
