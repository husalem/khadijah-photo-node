const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const Request = require('../models/kindergarten-request');
const Costum = require('../models/costum');
const Addition = require('../models/service-adds');

exports.getRequestsCount = async (req, res, next) => {
  const { status } = req.query;
  let query = {};

  if (status) {
    query.status = status;
  }

  try {
    const count = await Request.find(query).countDocuments();

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getRequest = async (req, res, next) => {
  const { requestId } = req.params;
  const { userId, userRole } = req;

  try {
    const request = await Request.findById(requestId).populate([
      {
        path: 'kindergarten',
        select: ['name', 'district']
      },
      {
        path: 'costums.costum',
        select: ['title', 'imagePath']
      },
      {
        path: 'costums.size',
        select: ['size', 'netPrice']
      },
      {
        path: 'costums.additions',
        select: ['name', 'netPrice']
      },
      {
        path: 'additions',
        select: ['name', 'netPrice']
      }
    ]);

    if (!request) {
      const error = new Error('Request does not exist');
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

exports.getRequests = async (req, res, next) => {
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
    const requests = await Request.find(query).skip(skip).limit(limit);

    res.status(200).json(requests);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
exports.createRequest = async (req, res, next) => {
  const input = req.body;
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

    // Get costums IDs from input
    const costumsIds = input.costums.map((item) => {
      const costumId = item.costum instanceof mongoose.Types.ObjectId ? item.costum._id.toString() : item.costum;

      return costumId;
    });

    // Validate costums
    const costums = await Costum.find({ _id: { $in: costumsIds } });

    if (costums.length !== costumsIds.length) {
      const error = new Error('One costum at least does not exist');
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

    const requestObj = new Request({ ...input });

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

exports.updateRequest = async (req, res, next) => {
  const { requestId } = req.params;
  const input = req.body;
  const { userId, userRole } = req;
  const errors = validationResult(req);

  try {
    const request = await Request.findById(requestId);

    if (!request) {
      const error = new Error('Request does not exist');
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

    // Get costums IDs from input
    const costumsIds = input.costums.map((item) => {
      const costumId = item.costum instanceof mongoose.Types.ObjectId ? item.costum._id.toString() : item.costum;

      return costumId;
    });

    // Validate costums
    const costums = await Costum.find({ _id: { $in: costumsIds } });

    if (costums.length !== costumsIds.length) {
      const error = new Error('One costum at least does not exist');
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

    console.log('Before controller save:', { ...request });
    

    const result = await Request.updateOne({ _id: requestId }, { ...input });

    if (!result.matchedCount) {
      const error = new Error('Request does not exist');
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

exports.deleteRequest = async (req, res, next) => {
  const { requestId } = req.params;

  try {
    await Request.deleteOne({ _id: requestId });

    res.status(201).json({ message: 'Request was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
