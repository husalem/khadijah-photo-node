const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const twilio = require('twilio');

const config = require('../config');
const User = require('../models/user');
const io = require('../socket');

exports.createVerification = async (req, res, next) => {
  const { phone } = req.body || '+966597911330';

  try {
    const client = twilio(process.env.TWILIO_ACCT_SID, process.env.TWILIO_AUTH_TOKEN);

    const verification = await client.verify.v2.services(process.env.TWILIO_SRV_SID).verifications.create({
      to: phone,
      channel: 'sms'
    });

    console.log(`Twilio: Verification to ${verification.to}`, `Status: ${verification.status}`);
    res.status(200).json(verification);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getUserCount = async (req, res, next) => {
  try {
    const count = await User.countDocuments();

    res.status(200).json({ count });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  const { skip, limit } = req.query;

  try {
    const user = await User.findById(req.userId);

    if (!user || req.userRole !== '0') {
      const error = new Error('No authorization');
      error.statusCode = 403;

      throw error;
    }

    const users = await User.find().skip(skip).limit(limit);

    res.status(200).json({ users });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.signup = async (req, res, next) => {
  const { phone, firstName, lastName } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 400;
    error.data = errors.array();

    throw error;
  }

  try {
    const userExists = await User.findOne({ email: email });

    if (userExists) {
      const error = new Error('User already is registered');
      error.statusCode = 400;

      throw error;
    }

    const name = firstName.concat(' ', lastName).trim();

    const userObj = new User({ phone, name });

    const user = await userObj.save();

    const token = jwt.sign(
      {
        photo: user.photo,
        userId: user._id.toString(),
        userRole: user.role
      },
      'Kh@dijahPh0t0',
      {
        expiresIn: '30d'
      }
    );

    res.status(201).json({
      token: token,
      userId: user._id.toString(),
      userRole: user.role
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.signin = async (req, res, next) => {};
