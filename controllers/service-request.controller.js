const { validationResult } = require('express-validator');

const User = require('../models/user');
const ServiceRequest = require('../models/service-request');
const Theme = require('../models/theme');
const Package = require('../models/package');
const Addition = require('../models/service-adds');

exports.getServiceRequestsCount = async (req, res, next) => {
  const { status } = req.query;
  let query = {};

  if (status) {
    query.status = status;
  }

  try {
    const count = await ServiceRequest.find(query).countDocuments();

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getServiceRequest = async (req, res, next) => {
  const { requestId } = req.params;
  const { userId, userRole } = req;

  try {
    const request = await ServiceRequest.findById(requestId).populate([
      {
        path: 'theme',
        select: ['title', 'description', 'imagesPaths', 'additionalCharge']
      },
      {
        path: 'package',
        select: ['name', 'quantity', 'netPrice']
      },
      {
        path: 'additions',
        select: ['name', 'netPrice']
      }
    ]);

    if (!request) {
      const error = new Error('Service request does not exist');
      error.statusCode = 404;

      throw error;
    } else if (userRole !== '0' && userId !== request.user._id.toString()) {
      const error = new Error('No authorization');
      error.statusCode = 403;

      throw error;
    }

    res.status(200).json(request);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getServiceRequests = async (req, res, next) => {
  const { skip, limit, status } = req.query;
  const { userId, userRole } = req;
  let query = {};

  if (userRole !== '0') {
    query.user = userId;
  }

  if (status) {
    query.status = status;
  }

  try {
    const requests = await ServiceRequest.find(query).skip(skip).limit(limit);

    res.status(200).json(requests);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
exports.createServiceRequest = async (req, res, next) => {
  let input = req.body;
  const { userId } = req;
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

    // Validate theme
    if (input.theme) {
      const theme = await Theme.findById(input.theme);

      if (!theme) {
        const error = new Error('Theme does not exist');
        error.statusCode = 404;

        throw error;
      }
    }

    // Validate package
    const package = await Package.findById(input.package);

    if (!package) {
      const error = new Error('Package does not exist');
      error.statusCode = 404;

      throw error;
    }

    // Validate service adds
    if (input.additions && Array.isArray(input.additions)) {
      const additions = await Addition.find({ _id: { $in: input.additions } });

      if (additions.length !== input.additions.length) {
        const error = new Error('One service addition at least does not exist');
        error.statusCode = 404;

        throw error;
      }
    }

    // Set the reqestor
    input.user = userId;

    const requestObj = new ServiceRequest({ ...input });

    const request = await requestObj.save();

    // Update the user orders
    const user = await User.findOne({ _id: userId });

    if (user) {
      user.orders.push(request._id.toString());
      await user.save();
    }

    res.status(201).json(request);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updateServiceRequest = async (req, res, next) => {
  const { requestId } = req.params;
  let input = req.body;
  const { userId, userRole } = req;
  const errors = validationResult(req);

  try {
    const request = await ServiceRequest.findById(requestId);

    if (!request) {
      const error = new Error('Service request does not exist');
      error.statusCode = 404;

      throw error;
    } else if (userRole !== '0' && userId !== request.user._id.toString()) {
      const error = new Error('No authorization');
      error.statusCode = 403;

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

    // Validate theme
    if (input.theme) {
      const theme = await Theme.findById(input.theme);

      if (!theme) {
        const error = new Error('Theme does not exist');
        error.statusCode = 404;

        throw error;
      }
    }

    // Validate package
    const package = await Package.findById(input.package);

    if (!package) {
      const error = new Error('Package does not exist');
      error.statusCode = 404;

      throw error;
    }

    // Validate service adds
    if (input.additions && Array.isArray(input.additions)) {
      const additions = await Addition.find({ _id: { $in: input.additions } });

      if (additions.length !== input.additions.length) {
        const error = new Error('One service addition at least does not exist');
        error.statusCode = 404;

        throw error;
      }
    }

    const result = await ServiceRequest.updateOne({ _id: requestId }, { ...input });

    if (!result.matchedCount) {
      const error = new Error('Service request does not exist');
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

exports.deleteServiceRequest = async (req, res, next) => {
  const { requestId } = req.params;

  try {
    await ServiceRequest.deleteOne({ _id: requestId });

    res.status(201).json({ message: 'Service request was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
