const mongoose = require('mongoose');

const Theme = require('./theme');
const Package = require('./package');
const Addition = require('./service-adds');

const Schema = mongoose.Schema;

const requestSchema = new Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    clientName: String,
    type: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceType',
      required: true
    },
    theme: {
      type: Schema.Types.ObjectId,
      ref: 'Theme'
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: true
    },
    appointment: String,
    remarks: String,
    additions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ServiceAdds'
      }
    ],
    additionalFees: Number,
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

requestSchema.index({ clientName: 1 }, { collation: { locale: 'ar', strength: 1 } });

requestSchema.pre(['save', 'updateOne'], async function (next) {
  let request = this.op === 'updateOne' ? this._update : this;

  let theme;
  let additions = [];
  const fees = request.additionalFees ? request.additionalFees : 0;

  if (request.theme) {
    theme = await Theme.findById(request.theme);
  }

  if (request.additions?.length) {
    // const additionsIds = request.additions.map((objectId) => objectId._id);
    additions = await Addition.find({ _id: { $in: request.additions } });
  }

  const package = await Package.findById(request.package);

  // Calculate additional services prices
  const addsPrice = additions.reduce((total, service) => total + service.netPrice, 0);

  // If theme is supplied, get its charge
  const themePrice = theme ? theme.additionalCharge : 0;

  request.netPrice = themePrice + addsPrice + package.netPrice + fees;

  // next();
});

module.exports = mongoose.model('ServiceRequest', requestSchema);
