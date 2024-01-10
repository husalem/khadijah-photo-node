const mongoose = require('mongoose');

const Costum = require('./costum');
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
        costum: {
          type: Schema.Types.ObjectId,
          ref: 'Costum',
          required: true
        },
        size: {
          type: Schema.Types.ObjectId,
          ref: 'PaperSize',
          required: true
        },
        additions: [{
          type: Schema.Types.ObjectId,
          ref: 'ServiceAdds'
        }]
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
  ['save', 'updateOne'],
  async function (next) {
    let additions = [];

    let request = this.op === 'updateOne' ? this._update : this;

    let sizesIds = [];
    let costAddsIdsSet = new Set();
    const costumsIds = request.costums.map((item) => {
      sizesIds.push(item.size);
      
      if (item.additions && Array.isArray(item.additions)) {
        for (let i = 0; i < item.additions.length; i++) {
          costAddsIdsSet.add(item.additions[i]);
        }
      }

      return item.costum;
    });

    const costAddsIds = Array.from(costAddsIdsSet);

    const costums = await Costum.find({ _id: { $in: costumsIds } }).populate('paperSize');

    if (request.additions?.length) {
      // const additionsIds = this.additions.map((objectId) => objectId._id);
      additions = await Addition.find({ _id: { $in: request.additions } });
    }

    // Calculate costums prices
    const costumsPrice = request.costums.reduce((total, costum) => costum.sizePrice, 0);

    // Calculate additional services prices
    const addsPrice = additions.reduce((total, service) => total + service.netPrice, 0);

    request.netPrice = costumsPrice + addsPrice;

    next();
  }
);

module.exports = mongoose.model('KindergartenService', serviceSchema);
