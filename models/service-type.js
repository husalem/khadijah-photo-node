const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const serviceTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 3
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceType', serviceTypeSchema);
