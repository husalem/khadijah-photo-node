const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const packageSchema = new Schema(
  {
    quanitty: {
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

packageSchema.pre('save', (next) => {
  if (this.discount) {
    this.netPrice = this.price - (this.price * this.discount) / 100;
  }

  next();
});

module.exports = mongoose.model('Package', packageSchema);
