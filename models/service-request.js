const mongoose = require('mongoose');

const Theme = require('./theme');
const Package = require('./package');
const Addition = require('./service-adds');

const Schema = mongoose.Schema;

const requestSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
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
    let theme;
    let additions = [];

    let request = this.op === 'updateOne' ? this._update : this;

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

    request.netPrice = themePrice + addsPrice + package.netPrice;

    next();
  }
);

module.exports = mongoose.model('ServiceRequest', requestSchema);
