const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const classSchema = new Schema(
  {
    kindergarten: {
      type: Schema.Types.ObjectId,
      ref: 'Kindergarten',
      required: true
    },
    name: {
      type: String,
      required: true,
      minLength: 2
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('KindergartenClass', classSchema);