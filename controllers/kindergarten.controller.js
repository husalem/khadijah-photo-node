const { validationResult } = require('express-validator');

const Kindergarten = require('../models/kindergarten');
const KindergartenClass = require('../models/kindergarten-class');
const utils = require('../utils');

const resOpts = {
  flattenObjectIds: true,
  schemaFieldsOnly: true,
  versionKey: false
};

exports.getKindergarten = async (req, res, next) => {
  const { kindergartenId } = req.params;

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
  const { skip, limit, filter, sort } = req.query;
  const { query, sorter } = utils.prepareFilterAndSort(filter, sort, [], []);

  try {
    const kindergartens = await Kindergarten.find(query).sort(sorter).skip(skip).limit(limit);

    res.status(200).json(kindergartens);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getKindergartensCount = async (req, res, next) => {
  const { filter } = req.query;
  const { query } = utils.prepareFilterAndSort(filter, '', [], []);

  try {
    const count = await Kindergarten.countDocuments(query);

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.createKindergarten = async (req, res, next) => {
  const { name, district, active } = req.body;
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

    const kindergartenObj = new Kindergarten({
      name,
      district,
      active
    });

    const kindergarten = await kindergartenObj.save();

    res.status(201).json(kindergarten);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.createKindergartenWithClasses = async (req, res, next) => {
  const { name, district, active, classes } = req.body;
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

    // Validate classes
    for (let i = 0; i < classes.length; i++) {
      const klass = classes[i];
      if (!klass.name) {
        const error = new Error('Missing parameter');

        error.statusCode = 400;
        error.data = { path: 'KindergartenClass.name', value: klass.name };

        throw error;
      }
    }

    const kinderObject = new Kindergarten({
      name,
      district,
      active
    });

    const kindergarten = await kinderObject.save();
    const flatKinder = kindergarten.toObject(resOpts);

    // Create classes
    const classesObjs = classes.map((klass) => {
      return new KindergartenClass({
        kindergarten: kindergarten._id,
        name: klass.name,
        homeroomTeacher: klass.homeroomTeacher,
        active: klass.active === undefined ? true : klass.active,
      });
    });

    const kindergartenClasses = await KindergartenClass.insertMany(classesObjs);
    const flatClasses = kindergartenClasses.map((doc) =>
      doc.toObject(resOpts)
    );

    res.status(201).json({ 
      ...flatKinder,
      classes: [...flatClasses]
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updateKindergarten = async (req, res, next) => {
  const { kindergartenId } = req.params;
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

    let result = await Kindergarten.updateOne({ _id: kindergartenId }, { ...input });

    if (!result.matchedCount) {
      const error = new Error('Kindergarten does not exist');
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

exports.updateKindergartenWithClasses = async (req, res, next) => {
  const { kindergartenId } = req.params;
  const { name, district, active, classes } = req.body;
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

    // Validate classes
    for (let i = 0; i < classes.length; i++) {
      const klass = classes[i];
      if (!klass.name) {
        const error = new Error('Missing parameter');

        error.statusCode = 400;
        error.data = { path: 'KindergartenClass.name', value: klass.name };

        throw error;
      }
    }

    let kindergarten = await Kindergarten.findByIdAndUpdate(kindergartenId, { name, district, active }, { new: true });

    if (!kindergarten) {
      const error = new Error('Kindergarten does not exist');
      error.statusCode = 404;

      throw error;
    }

    if (!classes.length) {
      await KindergartenClass.deleteMany({ kindergarten: kindergartenId });
    }

    let inClasses = [];
    let upClasses = [];

    classes.map((klass) => {
      if (!klass._id) {
        klass.kindergarten = kindergartenId;

        inClasses.push(new KindergartenClass({ ...klass }));
      } else {
        upClasses.push(new KindergartenClass({ ...klass }));
      }
    });

    const writes = inClasses.map((klass) => {
      return {
        insertOne: { document: klass }
      };
    }).concat(upClasses.map((klass) => {
      return {
        updateOne: {
          filter: { _id: klass._id },
          update: { $set: { name: klass.name, homeroomTeacher: klass.homeroomTeacher, active: klass.active } },
        }
      };
    }));

    await KindergartenClass.bulkWrite(writes);
    const savedClasses = await KindergartenClass.find({ kindergarten: kindergartenId });

    const flatKinder = kindergarten.toObject(resOpts);
    const flatClasses = savedClasses.map((doc) =>
      doc.toObject(resOpts)
    );

    res.status(201).json({ ...flatKinder, classes: [...flatClasses] });
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
    await Kindergarten.deleteOne({ _id: kindergartenId });

    res.status(201).json({ message: 'Kindergarten was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
