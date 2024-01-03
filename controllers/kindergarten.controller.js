const { validationResult } = require('express-validator');

const Kindergarten = require('../models/kindergarten');

exports.getKindergarten = async (req, res, next) => {
  const { kindergartenId } = req.params;

  console.log(kindergartenId);

  try {
    const kindergarten = await Kindergarten.findById(kindergartenId);

    if (!kindergarten) {
      const error = new Error('Kindergarten does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(200).json(kindergarten);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getKindergartens = async (req, res, next) => {
  const { skip, limit } = req.query;

  try {
    const kindergartens = await Kindergarten.find().skip(skip).limit(limit);

    res.status(200).json(kindergartens);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getKindergartensCount = async (req, res, next) => {
  try {
    const count = await Kindergarten.countDocuments();

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.createKindergarten = async (req, res, next) => {
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

    const kindergartenObj = new Kindergarten({ name, district });

    const kindergarten = await kindergartenObj.save();

    res.status(201).json(kindergarten);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updateKindergarten = async (req, res, next) => {
  const { kindergartenId } = req.params;
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

    let loadedKindergarten = await Kindergarten.findById(kindergartenId);

    if (!loadedKindergarten) {
      const error = new Error('Kindergarten does not exist');
      error.statusCode = 404;

      throw error;
    }

    loadedKindergarten.name = name;
    loadedKindergarten.district = district;

    await loadedKindergarten.save();

    res.status(201).json(loadedKindergarten);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.deleteKindergarten = async (req, res, next) => {
  const { kindergartenId } = req.params;

  try {
    await Kindergarten.findByIdAndUpdate(kindergartenId, { active: false });

    res.status(201).json({ message: 'Kindergarten was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
