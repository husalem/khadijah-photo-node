const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { nanoid } = require('nanoid');

const User = require('../models/user');
const Request = require('../models/kindergarten-request');
const Costum = require('../models/costum');
const Addition = require('../models/service-adds');
const utils = require('../utils');

const allowedFilters = [
  'requestId',
  'kindergarten',
  'kindergartenClass',
  'childName',
  'netPrice',
  'status',
  'updatedAt'
];
const allowedSorters = ['kindergarten', 'childName', 'netPrice', 'createdAt', 'updatedAt'];

const populate = [
  {
    path: 'user',
    select: ['phone', 'email']
  },
  {
    path: 'kindergarten',
    select: ['name', 'district', 'active']
  },
  {
    path: 'kindergartenClass',
    select: ['name', 'homeroomTeacher', 'active']
  },
  {
    path: 'costums.costum',
    select: ['title', 'imagePath', 'withFriend']
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
];

exports.getRequestsCount = async (req, res, next) => {
  const { filter } = req.query;
  const { query } = utils.prepareFilterAndSort(filter, '', allowedFilters, []);

  try {
    const count = await Request.countDocuments(query);

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
    const request = await Request.findById(requestId).populate(populate);

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
  const { skip, limit, filter, sort } = req.query;
  const { userId, userRole } = req;
  const { query, sorter } = utils.prepareFilterAndSort(filter, sort, allowedFilters, allowedSorters);

  if (userRole !== '0') {
    query.user = userId;
  }

  // Only populate kindergartens and classes
  const aPopulate = populate.filter((item) => ['kindergarten', 'kindergartenClass'].includes(item.path));

  try {
    const requests = await Request.find(query).sort(sorter).skip(skip).limit(limit).populate(aPopulate);

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

    // Set the request ID
    input.requestId = 'K-' + nanoid(6).toUpperCase();

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

    // Check mandatory fields
    const mandatoryFields = new Set(['kindergarten', 'kindergartenClass', 'childName']);

    Object.keys(input).forEach((key) => {
      if (mandatoryFields.has(key) && input[key].trim() === '') {
        const error = new Error('Missing parameter: ' + key);
        error.statusCode = 400;
        throw error;
      }
    });

    // Format the costums structure to comply the model
    // Build an update document with only provided properties
    const updateDoc = {};

    // Handle costums only if provided
    if (Object.prototype.hasOwnProperty.call(input, 'costums')) {
      if (!Array.isArray(input.costums)) {
        const error = new Error('Costums must be an array');
        error.statusCode = 400;

        throw error;
      } else if (input.costums.length === 0) {
        const error = new Error('Request must have one costum at least');
        error.statusCode = 400;

        throw error;
      }

      const formattedCostums = input.costums.map((item) => {
        const costum = item.costum._id ? item.costum._id : item.costum;
        const size = item.size._id ? item.size._id : item.size;
        const additions = Array.isArray(item.additions)
          ? item.additions.map((addition) => (addition._id ? addition._id : addition))
          : [];

        return { costum, size, additions };
      });

      // Get costums IDs from input
      const costumsIds = formattedCostums.map((item) => {
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

      updateDoc.costums = formattedCostums;
    }

    // Handle additions only if provided
    if (Object.prototype.hasOwnProperty.call(input, 'additions')) {
      if (!Array.isArray(input.additions)) {
        const error = new Error('Additions must be an array');
        error.statusCode = 400;

        throw error;
      }

      const additions = await Addition.find({ _id: { $in: input.additions } });

      if (additions.length !== input.additions.length) {
        const error = new Error('One service addition at least does not exist');
        error.statusCode = 404;

        throw error;
      }

      updateDoc.additions = input.additions;
    }

    // Copy other provided fields except protected ones
    const protectedFields = new Set(['_id', 'user', 'requestId', 'netPrice', 'createdAt', 'updatedAt']);

    Object.keys(input).forEach((key) => {
      if (key === 'costums' || key === 'additions') return;
      if (protectedFields.has(key)) return;

      // Normalize status to uppercase to match schema setter (updateOne bypasses setters)
      if (key === 'status' && typeof input.status === 'string') {
        updateDoc.status = input.status.toUpperCase();
        return;
      }

      updateDoc[key] = input[key];
    });

    if (Object.keys(updateDoc).length === 0) {
      const error = new Error('No updatable fields provided');
      error.statusCode = 400;

      throw error;
    }

    const result = await Request.updateOne({ _id: requestId }, { ...request._doc, ...updateDoc });

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

exports.updateRequestStatus = async (req, res, next) => {
  const { requestId } = req.params;
  const { status } = req.body;
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

    const result = await Request.updateOne({ _id: requestId }, { status });

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

exports.updateRequestStatus = async (req, res, next) => {
  const { requestId } = req.params;
  const { status } = req.body;
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

    const request = await Request.findById(requestId);

    if (!request) {
      const error = new Error('Request does not exist');
      error.statusCode = 404;

      throw error;
    } else if (!['INIT', 'PROC'].includes(request.status)) {
      const error = new Error('لا يمكن التعديل على هذا الطلب');
      error.statusCode = 400;

      throw error;
    }

    request.status = status;

    await request.save();

    res.status(201).json(request);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updateRequestStatusBulk = async (req, res, next) => {
  const { status, requests } = req.body;
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

    // Avoid updating non INIT, PROC requests
    const updatableReqs = await Request.find(
      {
        _id: { $in: requests },
        status: { $in: ['INIT', 'PROC'] }
      },
      { _id: 1 }
    );

    if (!updatableReqs.length) {
      const error = new Error('No requets found to be updated');
      error.statusCode = 404;

      throw error;
    }

    const updatableIds = updatableReqs.map((record) => record._id.toString())

    const result = await Request.updateMany( { _id: { $in: updatableIds } }, { status });

    if (!result.modifiedCount) {
      const error = new Error('No records were modified');
      error.statusCode = 500;

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

exports.updateRequestAdditionalFees = async (req, res, next) => {
  const { requestId } = req.params;
  const { fees } = req.body;
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

    const request = await Request.findById(requestId);

    if (!request) {
      const error = new Error('Request does not exist');
      error.statusCode = 404;

      throw error;
    } else if (!['INIT', 'PROC'].includes(request.status)) {
      const error = new Error('لا يمكن التعديل على هذا الطلب');
      error.statusCode = 400;

      throw error;
    }

    request.additionalFees = fees;

    await request.save();

    res.status(201).json(request);
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
