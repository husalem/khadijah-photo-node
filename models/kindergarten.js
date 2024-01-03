const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const kindergartenSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 3
    },
    district: {
      type: String,
      required: true,
      minLength: 3
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Kindergarten', kindergartenSchema);
