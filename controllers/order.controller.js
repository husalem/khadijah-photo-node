const mongoose = require('mongoose');

const User = require('../models/user');
const KindergartenRequest = require('../models/kindergarten-request');
const ServiceRequest = require('../models/service-request');
const utils = require('../utils');

exports.getOrdersCount = async (req, res, next) => {
  const { filter } = req.query;
  const { userId } = req;
  const { query } = utils.prepareFilterAndSort(filter, '', ['status'], []);

  try {
    if (!userId) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;

      throw error;
    }

    query.user = userId;

    const kReqCount = await KindergartenRequest.find().countDocuments(query);
    const sReqCount = await ServiceRequest.find().countDocuments(query);

    res.status(200).json(kReqCount + sReqCount);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  const { skip, limit, filter } = req.query;
  const { userId } = req;
  const { query } = utils.prepareFilterAndSort(filter, '', ['status'], []);
  let start,
    end = undefined;

  if (skip) {
    start = skip;
  }

  if (skip && limit) {
    end = skip + limit;
  }

  try {
    if (!userId) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;

      throw error;
    }

    const user = await User.findOne({ _id: userId });
    const orders = user.orders;

    query._id = { $in: orders };

    if (orders.length) {
      const kRequests = await KindergartenRequest.find(query);
      const sRequests = await ServiceRequest.find(query).populate('type', ['_id', 'name']);

      const requests = kRequests
        .map((kItem) => ({
          _id: kItem._id,
          reqType: 'K',
          typeId: '',
          title: 'تصوير روضات',
          netPrice: kItem.netPrice,
          status: kItem.status,
          createdAt: kItem.createdAt
        }))
        .concat(
          sRequests.map((sItem) => ({
            _id: sItem._id,
            reqType: 'O',
            typeId: sItem.type._id.toString(),
            title: 'تصوير ' + sItem.type.name,
            netPrice: sItem.netPrice,
            status: sItem.status,
            createdAt: sItem.createdAt
          }))
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(start, end);

      res.status(200).json(requests);
    } else {
      res.status(200).json([]);
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
