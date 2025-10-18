const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const kindergartenSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 3
    },
    district: {
      type: String,
      required: true,
      minLength: 3
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

kindergartenSchema.index({ name: 1, district: 2 }, { collation: { locale: 'ar', strength: 1 } });

module.exports = mongoose.model('Kindergarten', kindergartenSchema);
