const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const packageSchema = new Schema(
  {
    name: String,
    quantity: {
      type: Number,
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

packageSchema.pre(['save', 'updateOne'], function (next) {
  let package = this.op === 'updateOne' ? this._update : this;

  package.netPrice = package.price;

  if (package.discount) {
    package.netPrice = package.price - (package.price * package.discount) / 100;
  }

  next();
});

module.exports = mongoose.model('Package', packageSchema);
