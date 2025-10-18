const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const serviceTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: String,
    thumbnail: String,
    themeBased: {
      type: Boolean,
      default: true
    },
    themes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Theme'
      }
    ],
    packages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Package'
      }
    ]
  },
  { timestamps: true }
);

serviceTypeSchema.index({ name: 1 }, { collation: { locale: 'ar', strength: 1 } });

module.exports = mongoose.model('ServiceType', serviceTypeSchema);
