const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const classSchema = new Schema(
  {
    kindergarten: {
      type: Schema.Types.ObjectId,
      ref: 'Kindergarten',
      required: true
    },
    name: {
      type: String,
      required: true,
      minLength: 2
    },
    homeroomTeacher: String,
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

classSchema.index({ name: 1, homeroomTeacher: 2 }, { collation: { locale: 'ar', strength: 1 } });

module.exports = mongoose.model('KindergartenClass', classSchema);