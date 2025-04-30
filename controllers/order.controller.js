const mongoose = require('mongoose');

const User = require('../models/user');
const KindergartenRequest = require('../models/kindergarten-request');
const ServiceRequest = require('../models/service-request');

exports.getOrdersCount = async (req, res, next) => {
  const { status } = req.query;
  const { userId } = req;
  let query = {};

  if (status) {
    query.status = status;
  }

  try {
    if (!userId) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;

      throw error;
    }

    query.user = userId;

    const kReqCount = await KindergartenRequest.find(query).countDocuments();
    const sReqCount = await ServiceRequest.find(query).countDocuments();

    res.status(200).json(kReqCount + sReqCount);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  const { skip, limit, status } = req.query;
  const { userId } = req;
  let query = {};
  let start, end = undefined;

  if (skip) {
    start = skip;
  }

  if (skip && limit) {
    end = skip + limit;
  }

  if (status) {
    query.status = status;
  }

  try {
    if (!userId) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;

      throw error;
    }

    query.user = userId;

    const user = await User.findOne({ _id: userId });
    const orders = user.orders.reverse().slice(start, end);

    if (orders.length) {
      const kRequests = await KindergartenRequest.find({ _id: { $in: orders } });
      const sRequests = await ServiceRequest.find({ _id: { $in: orders } }).populate('type', 'name');

      const requests = kRequests
        .map((kItem) => ({
          _id: kItem._id,
          reqType: 'K',
          title: 'تصوير روضات',
          netPrice: kItem.netPrice,
          status: kItem.status,
          createdAt: kItem.createdAt
        }))
        .concat(sRequests.map((sItem) => ({
          _id: sItem._id,
          reqType: 'O',
          title: 'تصوير ' + sItem.type,
          netPrice: sItem.netPrice,
          status: sItem.status,
          createdAt: sItem.createdAt
        })));

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
