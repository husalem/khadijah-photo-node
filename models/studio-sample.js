const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sampleSchema = new Schema(
  {
    imagePath: {
      type: String,
      required: true
    },
    description: String,
    tags: String,
  },
  { timestamps: true }
);

sampleSchema.index({ description: 1, tags: 2 }, { collation: { locale: 'ar', strength: 1 } });

module.exports = mongoose.model('StudioSample', sampleSchema);