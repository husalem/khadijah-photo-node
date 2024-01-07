const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const themeSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: String,
    additionalCharge: {
      type: Number,
      default: 0
    },
    tags: [String],
    imagesPaths: [String],
    showInStudio: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Theme', themeSchema);
