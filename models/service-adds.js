const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const serviceAddsSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    service: {
      type: String,
      enum: ['K', 'O'], // K: Kindergarten, O: Others
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

serviceAddsSchema.pre(['save', 'updateOne'], function (next) {
  let addition = this.op === 'updateOne' ? this._update : this;

  addition.netPrice = addition.price;

  if (addition.discount) {
    addition.netPrice = addition.price - (addition.price * addition.discount) / 100;
  }

  next();
});

module.exports = mongoose.model('ServiceAdds', serviceAddsSchema);
