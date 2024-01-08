const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const paperSizeSchema = new Schema(
  {
    size: {
      type: String,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: true
    },
    netPrice: Number
  },
  { timestamps: true }
);

paperSizeSchema.pre(['save', 'updateOne'], function (next) {
  let size = this.op === 'updateOne' ? this._update : this;

  size.netPrice = size.price;

  if (size.discount) {
    size.netPrice = size.price - (size.price * size.discount) / 100;
  }

  next();
});

module.exports = mongoose.model('PaperSize', paperSizeSchema);