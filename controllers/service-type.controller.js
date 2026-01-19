const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const ServiceType = require('../models/service-type');
const utils = require('../utils');

const allowedFilters = ['name', 'description', 'themeBased', 'createdAt', 'updatedAt'];
const allowedSorters = ['name', 'themeBased', 'createdAt', 'updatedAt'];

const ObjectId = mongoose.Types.ObjectId;
const populate = [
  {
    path: 'themes',
    select: ['title', 'description', 'additionalCharge', 'imagesPaths']
  },
  {
    path: 'packages',
    select: ['name', 'quantity', 'netPrice']
  }
];

exports.getServiceTypesCount = async (req, res, next) => {
  const { filter } = req.query;
  const { query } = utils.prepareFilterAndSort(filter, '', allowedFilters, []);

  try {
    const count = await ServiceType.countDocuments(query);

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
    const serviceType = await ServiceType.findById(serviceTypeId).populate(populate);

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
  const { skip, limit, filter, sort } = req.query;
  const { query, sorter } = utils.prepareFilterAndSort(filter, sort, allowedFilters, allowedSorters);

  try {
    const serviceTypes = await ServiceType.find(query).sort(sorter).skip(skip).limit(limit);

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

    if (input.themeBased === 'true') {
      const themesIds = input.themes ? JSON.parse(input.themes) : [];
      if (themesIds.length) {
        input.themes = themesIds.map((obj) => new ObjectId(obj.theme));
      }
    }

    const packagesIds = input.packages ? JSON.parse(input.packages) : [];
    if (packagesIds.length) {
      input.packages = packagesIds.map((obj) => new ObjectId(obj.pkg));
    }

    const serviceTypeObj = new ServiceType({ ...input });

    const serviceType = await serviceTypeObj.save();
    const flatST = serviceType.toObject(utils.resOpts);

    res.status(201).json(flatST);
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

    if (input.themeBased === 'true') {
      const themesIds = input.themes ? JSON.parse(input.themes) : [];
      if (themesIds.length) {
        input.themes = themesIds.map((obj) => new ObjectId(obj.theme));
      } else {
        const error = new Error('At least one theme must be selected for a theme based service type');

        error.statusCode = 400;
        error.data = { path, value };

        throw error;
      }
    } else {
      input.themes = [];
    }

    const packagesIds = input.packages ? JSON.parse(input.packages) : [];
    if (packagesIds.length) {
      input.packages = packagesIds.map((obj) => new ObjectId(obj.pkg));
    }

    const result = await ServiceType.findOneAndUpdate({ _id: serviceTypeId }, { ...input }, { new: true });

    if (!result) {
      const error = new Error('Service type does not exist');
      error.statusCode = 404;

      throw error;
    }

    const flatST = result.toObject(utils.resOpts);

    res.status(201).json(flatST);
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
    const serviceType = await ServiceType.findById(serviceTypeId);

    if (!serviceType) {
      const error = new Error('Service type does not exist');
      error.statusCode = 404;

      throw error;
    }

    if (fs.existsSync(serviceType.thumbnail)) {
      fs.unlink(serviceType.thumbnail, (error) => {
        if (error) {
          console.log(`Service type ${serviceType.thumbnail} should have been deleted and it has not due to an error.`);
        }
      });
    }

    await serviceType.deleteOne();
    // await ServiceType.deleteOne({ _id: serviceTypeId });

    res.status(201).json({ message: 'Service type was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.uploadThumbnail = utils
  .getMulterConfig('assets/images/service_types', ['image/png', 'image/jpg', 'image/jpeg'])
  .single('thumbnail');
