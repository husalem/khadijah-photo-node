const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const paperSizeSchema = new Schema(
  {
    size: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaperSize', paperSizeSchema);