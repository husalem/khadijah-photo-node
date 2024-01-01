const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is missiing'],
      validate: [(value) => /^\d{9,}$/, 'Phone must contain only numbers']
    },
    name: String,
    role: {
      type: String,
      enum: ['0', '1'],
      required: [true, 'Role is missing'],
      default: '1' // '0': Admin, '1': User
    },
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Order'
      }
    ],
    lastLogin: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
