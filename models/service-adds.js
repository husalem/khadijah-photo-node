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
    description: String,
    perItem: Boolean,
    conditional: Boolean,
    numOfImgCondition: Number,
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

serviceAddsSchema.index({ name: 1 }, { collation: { locale: 'ar', strength: 1 } });

serviceAddsSchema.pre(['save', 'updateOne', 'findOneAndUpdate'], async function (next) {
  let addition = this.op === 'updateOne' || this.op === 'findOneAndUpdate' ? this._update : this;

  addition.netPrice = addition.price;

  if (addition.discount) {
    addition.netPrice = addition.price - (addition.price * addition.discount) / 100;
  }

  // next();
});

module.exports = mongoose.model('ServiceAdds', serviceAddsSchema);
