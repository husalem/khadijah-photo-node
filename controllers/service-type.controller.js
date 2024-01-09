const fs = require('fs');

const { validationResult } = require('express-validator');

const ServiceType = require('../models/service-type');
const utils = require('../utils');

exports.getServiceTypesCount = async (req, res, next) => {
  try {
    const count = await ServiceType.countDocuments();

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getServiceType = async (req, res, next) => {
  const { serviceTypeId } = req.params;

  try {
    const serviceType = await ServiceType.findById(serviceTypeId);

    if (!serviceType) {
      const error = new Error('Service type does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(200).json(serviceType);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getServiceTypes = async (req, res, next) => {
  const { skip, limit } = req.query;

  try {
    const serviceTypes = await ServiceType.find().skip(skip).limit(limit);

    res.status(200).json(serviceTypes);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
exports.createServiceType = async (req, res, next) => {
  let input = req.body;
  const thumbnail = req.file;
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

    if (thumbnail) {
      input.thumbnail = thumbnail.path;
    }

    const serviceTypeObj = new ServiceType({ ...input });

    const serviceType = await serviceTypeObj.save();

    res.status(201).json(serviceType);
  } catch (error) {
    if (fs.existsSync(thumbnail.path)) {
      fs.unlink(thumbnail.path, (error) => {
        if (error) {
          console.log(`Thumbnail ${thumbnail.path} should have been deleted and it has not due to an error.`);
        }
      });
    }

    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updateServiceType = async (req, res, next) => {
  const { serviceTypeId } = req.params;
  let input = req.body;
  const thumbnail = req.file;
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

    const loadedService = await ServiceType.findById(serviceTypeId);

    // If file was uploaded, delete the old file
    if (thumbnail) {
      if (fs.existsSync(loadedService.thumbnail)) {
        fs.unlink(loadedService.thumbnail, (error) => {
          if (error) {
            console.log(
              `Thumbnail ${loadedService.thumbnail} should have been deleted and it has not due to an error.`
            );
          }

          console.log(`Thumbnail of ${loadedService.name} was replaced`);
        });
      }

      // Update the path
      input.thumbnail = thumbnail.path;
    }

    const result = await ServiceType.updateOne({ _id: serviceTypeId }, { ...input });

    if (!result.matchedCount) {
      const error = new Error('Service type does not exist');
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

exports.deleteServiceType = async (req, res, next) => {
  const { serviceTypeId } = req.params;

  try {
    await ServiceType.deleteOne({ _id: serviceTypeId });

    res.status(201).json({ message: 'Service type was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.uploadThumbnail = utils
  .getMulterConfig('assets/service_types', ['image/png', 'image/jpg', 'image/jpeg'])
  .single('thumbnail');
