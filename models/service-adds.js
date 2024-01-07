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

serviceAddsSchema.pre('save', (next) => {
  if (this.discount) {
    this.netPrice = this.price - (this.price * this.discount) / 100;
  }

  next();
});

module.exports = mongoose.model('ServiceAdds', serviceAddsSchema);
