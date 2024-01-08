const mongoose = require('mongoose');

const Comstum = require('./costum');
const Addition = require('./service-adds');

const Schema = mongoose.Schema;

const serviceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    kindergarten: {
      type: Schema.Types.ObjectId,
      ref: 'Kindergarten'
    },
    costums: [
      {
        title: String,
        imagePath: String,
        sizeName: String,
        sizePrice: {
          type: Number,
          required: true
        },
        wooden: Boolean
      }
    ],
    friendName: String,
    firendBackup: String,
    remarks: String,
    additions: [{
      type: Schema.Types.ObjectId,
      ref: 'ServiceAdds'
    }],
    netPrice: Number,
    status: {
      type: String,
      enum: ['INIT', 'PROC', 'CANC', 'REJC', 'COMP'],
      default: 'INIT',
      set: (value) => value.toUpperCase()
    }
  },
  { timestamps: true }
);

requestSchema.pre(
  'save',
  async function (next) {
    let additions = [];

    if (this.additions?.length) {
      const additionsIds = this.additions.map((objectId) => objectId._id);
      additions = await Addition.find({ _id: { $in: additionsIds } });
    }

    // Calculate costums prices
    const costumsPrice = this.costums.reduce((total, costum) => costum.sizePrice, 0);

    // Calculate additional services prices
    const addsPrice = additions.reduce((total, service) => total + service.netPrice, 0);

    this.netPrice = costumsPrice + addsPrice;

    next();
  }
);

module.exports = mongoose.model('KindergartenService', serviceSchema);
