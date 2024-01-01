const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const themeSchema = new Schema(
  {
    samplePath: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    discount: {
      type: Number,
      default: 0
    },
    tags: [String],
    showInStudio: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Theme', themeSchema);
