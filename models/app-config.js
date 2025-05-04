const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const configSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['LIVE', 'MAINT', 'COMING', 'DOWN'],
      default: 'LIVE',
      set: (value) => value.toUpperCase()
    }
  }
);

module.exports = mongoose.model('AppConfig', configSchema);
