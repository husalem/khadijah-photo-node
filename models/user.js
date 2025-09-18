const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is missiing'],
      validate: [(value) => /^\d{9,}$/, 'Phone must contain only numbers']
    },
    email: {
      type: String,
      validate: [
        (value) => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value),
        'Please enter a valid email'
      ],
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters long']
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
    lastLogin: Date,
    verificationSent: {
      type: Boolean,
      default: false
    },
    verificationTime: {
      type: Number,
      default: 0
    },
    passwordResetToken: String,
    passwordResetExpiration: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
