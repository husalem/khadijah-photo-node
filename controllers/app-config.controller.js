const mongoose = require('mongoose');

const io = require('../socket');
const Config = require('../models/app-config');

exports.getAppStatus = async (req, res, next) => {
  try {
    const { status } = await Config.findOne();

    res.status(200).json({ status });
  } catch (error) {
    res.status(200).json({ status: 'MAINT' });
  }
};

exports.updateAppStatus = async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    status = 'MAINT';
  }

  try {
    const result = await Config.find();
    let config;

    if (!result?.length) {
      config = new Config({ status });
    } else {
      config = result[0];
      config.status = status;
    }

    await config.save();

    io.websocket().emit('AppStatus', { status });

    res.status(200).json({ status });
  } catch (error) {
    res.status(200).json({ status: 'MAINT' });
  }
};