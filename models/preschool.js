const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const preschoolSchema = new Schema(
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Preshool', preschoolSchema);
