const { validationResult } = require('express-validator');

const Preschool = require('../models/preschool');

exports.getPreschool = async (req, res, next) => {
  const { preschoolId } = req.params;

  try {
    const preschool = await Preschool.findById(preschoolId);

    if (!preschool) {
      const error = new Error('Preschool does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(200).json(preschool);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getPreschools = async (req, res, next) => {
  const { skip, limit } = req.query;

  try {
    const preschools = await Preschool.find().skip(skip).limit(limit);

    res.status(200).json({ preschools });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getPreschoolsCount = async (req, res, next) => {
  try {
    const count = await Preschool.countDocuments();

    res.status(200).json({ count });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.createPreschool = async (req, res, next) => {
  const { name, district } = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };
  
      throw error;
    }

    const preschoolObj = new Preschool({ name, district });

    const preschool = await preschoolObj.save();

    res.status(201).json(preschool);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updatePreschool = async (req, res, next) => {
  const { preschoolId } = req.params;
  const { name, district } = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };
  
      throw error;
    }

    let loadedPreschool = await Preschool.findById(preschoolId);

    if (!loadedPreschool) {
      const error = new Error('Preschool does not exist');
      error.statusCode = 404;

      throw error;
    }

    loadedPreschool.name = name;
    loadedPreschool.district = district;

    await loadedPreschool.save();

    res.status(201).json(loadedPreschool);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.deletePreschool = async (req, res, next) => {
  const { preschoolId } = req.params;

  try {
    await Preschool.findByIdAndUpdate(preschoolId, { active: false });

    res.status(201).json({ message: 'Preschool was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
