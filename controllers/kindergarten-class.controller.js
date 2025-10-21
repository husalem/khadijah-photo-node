const { validationResult } = require('express-validator');

const KindergartenClass = require('../models/kindergarten-class');
const Kindergarten = require('../models/kindergarten');
const utils = require('../utils');

const allowedFilters = ['kindergarten', 'name', 'active', 'createdAt', 'updatedAt'];
const allowedSorters = ['name', 'createdAt', 'updatedAt'];

exports.getKindergartenClass = async (req, res, next) => {
  const { classId } = req.params;

  try {
    const kindergartenClass = await KindergartenClass.findById(classId).populate('kindergarten');

    if (!kindergartenClass) {
      const error = new Error('Kindergarten class does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(200).json(kindergartenClass);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getKindergartenClasses = async (req, res, next) => {
  const { skip, limit, filter, sort } = req.query;
  const { query, sorter } = utils.prepareFilterAndSort(filter, sort, allowedFilters, allowedSorters);

  try {
    const kindergartenClasses = await KindergartenClass.find(query).sort(sorter).skip(skip).limit(limit).populate('kindergarten');

    res.status(200).json(kindergartenClasses);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getKindergartenClassesCount = async (req, res, next) => {
  const { filter } = req.query;
  const { query } = utils.prepareFilterAndSort(filter, '', allowedFilters, []);

  try {
    const count = await KindergartenClass.countDocuments(query);

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getKindergartenClassesByKindergarten = async (req, res, next) => {
  const { skip, limit, filter, sort } = req.query;
  const { query, sorter } = utils.prepareFilterAndSort(filter, sort, allowedFilters, allowedSorters);
  const { kindergartenId } = req.params;

  query.kindergarten = kindergartenId;

  try {
    const kindergartenClasses = await KindergartenClass.find(query).sort(sorter).skip(skip).limit(limit).populate('kindergarten');

    res.status(200).json(kindergartenClasses);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getKindergartenClassesCountByKindergarten = async (req, res, next) => {
  const { filter } = req.query;
  const { query } = utils.prepareFilterAndSort(filter, '', allowedFilters, []);
  const { kindergartenId } = req.params;

  query.kindergarten = kindergartenId;

  try {
    const count = await KindergartenClass.countDocuments(query);

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.createKindergartenClass = async (req, res, next) => {
  const { name, kindergarten } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }

  try {
    const kindergartenExists = await Kindergarten.findById(kindergarten);

    if (!kindergartenExists) {
      const error = new Error('Kindergarten does not exist');
      error.statusCode = 404;

      throw error;
    }

    const newKindergartenClass = new KindergartenClass({
      kindergarten,
      name
    });

    const savedKindergartenClass = await newKindergartenClass.save();

    res.status(201).json(savedKindergartenClass);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updateKindergartenClass = async (req, res, next) => {
  const { classId } = req.params;
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

    let result = await KindergartenClass.updateOne({ _id: classId }, { ...input });

    if (!result.matchedCount) {
      const error = new Error('Kindergarten class does not exist');
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

exports.deleteKindergartenClass = async (req, res, next) => {
  const { classId } = req.params;

  try {
    const result = await KindergartenClass.deleteOne({ _id: classId });

    if (!result.deletedCount) {
      const error = new Error('Kindergarten class does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(201).json({ message: 'Kindergarten class was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.toggleKindergartenClassActivation = async (req, res, next) => {
  const { classId } = req.params;

  try {
    const kindergartenClass = await KindergartenClass.findById(classId);

    if (!kindergartenClass) {
      const error = new Error('Kindergarten class does not exist');
      error.statusCode = 404;

      throw error;
    }

    kindergartenClass.active = !kindergartenClass.active;
    const result = await kindergartenClass.save();

    res.status(201).json(result);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
