const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const costumSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    imagePath: {
      type: String,
      required: true
    },
    sizes: [{
      type: Schema.Types.ObjectId,
      ref: 'PaperSize'
    }],
    tags: [String],
    withFriend: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Costum', costumSchema);