const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const twilio = require('twilio');

const User = require('../models/user');
const io = require('../socket');

exports.createVerification = async (req, res, next) => {
  const errors = validationResult(req);
  const { countryCode, phone } = req.body;

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };
  
      throw error;
    }

    const client = twilio(
      process.env.TWILIO_ACCT_SID, 
      process.env.TWILIO_AUTH_TOKEN
    );

    const phoneNumber = `+${countryCode || '966'}${phone}`;

    /************** IN DEVELOPMENT, NO NEED TO SEND SMS **************/
    if (process.env.development) {
      return res.status(200)
        .json({ message: 'Development', status: 'Sent' });
    }

    const verification = await client.verify.v2
      .services(process.env.TWILIO_SRV_SID)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms'
      });

    io.websocket().emit('auth', {
      to: verification.to, 
      status: verification.status
    });

    res.status(200)
      .json({ status: verification.status });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.checkVerification = async (req, res, next) => {
  const errors = validationResult(req);
  const { countryCode, phone, code } = req.body;

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };
  
      throw error;
    }

    const client = twilio(
      process.env.TWILIO_ACCT_SID, 
      process.env.TWILIO_AUTH_TOKEN
    );

    const phoneNumber = `+${countryCode || '966'}${phone}`;

    /************** IN DEVELOPMENT, NO NEED TO CHECK **************/
    if (process.env.development) {
      return res.status(200)
        .json({ message: 'Development', status: 'approved' });
    }

    const verification = await client.verify.v2
      .services(process.env.TWILIO_SRV_SID)
      .verificationChecks
      .create({
        to: phoneNumber,
        code: code
      });

    io.websocket().emit('auth', {
      to: verification.to, 
      status: verification.status
    });

    res.status(200)
      .json({ status: verification.status });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getUsersCount = async (req, res, next) => {
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

exports.getUser = async (req, res, next) => {
  const { userId } = req.params;
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

    const currentUser = await User.findById(req.userId);

    if (!currentUser || req.userRole !== '0') {
      const error = new Error('No authorization');
      error.statusCode = 403;

      throw error;
    }

    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User is not registered');
      error.statusCode = 400;

      throw error;
    }

    const { role, ...resultUser } = user;

    res.status(200).json(resultUser);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.userExists = async (req, res, next) => {
  const { phone } = req.body;
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

    const user = await User.findOne({ phone });

    res.status(200).json({ registered: !!user });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.register = async (req, res, next) => {
  const { phone, firstName, lastName } = req.body;
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

    const userExists = await User.findOne({ phone });

    if (userExists) {
      const error = new Error('User already is registered');
      error.statusCode = 400;

      throw error;
    }

    const name = firstName.concat(' ', lastName);

    const userObj = new User({ phone, name, lastLogin: new Date() });

    const user = await userObj.save();

    const token = jwt.sign(
      {
        phone: user.phone,
        userId: user._id.toString(),
        userRole: user.role
      },
      process.env.JWT_SECRET,
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

exports.signin = async (req, res, next) => {
  const { phone } = req.body;
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

    const user = await User.findOne({ phone });

    if (!user) {
      const error = new Error('User is not registered');
      error.statusCode = 400;

      throw error;
    }

    // Log last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        phone: user.phone,
        userId: user._id.toString(),
        userRole: user.role
      },
      process.env.JWT_SECRET,
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
