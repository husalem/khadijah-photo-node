const mongoose = require('mongoose');

const Costum = require('./costum');
const PaperSize = require('./paper-size');
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
        additions: [
          {
            type: Schema.Types.ObjectId,
            ref: 'ServiceAdds'
          }
        ]
      }
    ],
    friendName: String,
    firendBackup: String,
    remarks: String,
    additions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ServiceAdds'
      }
    ],
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

requestSchema.pre(['save', 'updateOne'], async function (next) {
  let request = this.op === 'updateOne' ? this._update : this;

  let sizesIdsSet = new Set();
  let costAddsIdsSet = new Set();
  let sizes = [];
  let costAdds = [];
  let additions = [];
  let costumsPrice = 0;

  // Extract all distinct sizes and additions of costums
  request.costums.map((item) => {
    const sizeId = item.size instanceof mongoose.Types.ObjectId ? 
      item.size._id.toString() : item.size;

    sizesIdsSet.add(sizeId);

    if (item.additions && Array.isArray(item.additions)) {
      for (let i = 0; i < item.additions.length; i++) {
        const addsId =
          item.additions[i] instanceof mongoose.Types.ObjectId
            ? item.additions[i]._id.toString()
            : item.additions[i];

        costAddsIdsSet.add(addsId);
      }
    }

    return item.costum;
  });

  const sizesIds = Array.from(sizesIdsSet);
  const costAddsIds = Array.from(costAddsIdsSet);

  // const costums = await Costum.find({ _id: { $in: costumsIds } }).populate('paperSize');
  sizes = await PaperSize.find({ _id: { $in: sizesIds } });
  costAdds = await Addition.find({ _id: { $in: costAddsIds } });

  if (request.additions?.length) {
    // const additionsIds = this.additions.map((objectId) => objectId._id);
    additions = await Addition.find({ _id: { $in: request.additions } });
  }

  // Calculate costums prices
  costumsPrice = request.costums.reduce((total, costum) => {
    const sizeId = costum.size instanceof mongoose.Types.ObjectId ? 
      costum.size._id.toString() : costum.size;
    
    sizePrice = sizes.find((size) => size === sizeId);

    return total + sizePrice;
  }, 0);

  // Calculate additional services prices
  const addsPrice = additions.reduce((total, service) => total + service.netPrice, 0);

  request.netPrice = costumsPrice + addsPrice;

  next();
});

module.exports = mongoose.model('KindergartenService', serviceSchema);
