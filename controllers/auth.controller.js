const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const twilio = require('twilio');

const User = require('../models/user');
const io = require('../socket');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.createVerification = async (req, res, next) => {
  const errors = validationResult(req);
  const { countryCode, phone } = req.body;

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };

      throw error;
    }

    const client = twilio(process.env.TWILIO_ACCT_SID, process.env.TWILIO_AUTH_TOKEN);

    const phoneNumber = `+${countryCode || '966'}${phone}`;

    // Check if user exists, otherwise create one
    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({
        phone,
        verificationSent: true,
        verificationTime: Date.now()
      });
    } else {
      user.verificationSent = true;
      user.verificationTime = Date.now();
    }

    await user.save();

    // Reset verification after 5 minutes
    setTimeout(() => {
      user.verificationSent = false;
      user.verificationTime = 0;

      user.save();
    }, 300000);

    /************** IN DEVELOPMENT, NO NEED TO SEND SMS **************/
    // if (process.env.development) {
    //   return res.status(200)
    //     .json({
    //       message: 'Development',
    //       status: 'Sent',
    //       userId: user._id.toString(),
    //       phone: user.phone
    //     });
    // }
    /******************************************************************/

    const verification = await client.verify.v2.services(process.env.TWILIO_SRV_SID).verifications.create({
      to: phoneNumber,
      channel: 'sms'
    });

    io.websocket().emit('auth', {
      to: verification.to,
      status: verification.status
    });

    res.status(200).json({ status: verification.status });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.checkVerification = async (req, res, next) => {
  const errors = validationResult(req);
  const { countryCode, phone, code } = req.body;

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };

      throw error;
    }

    const client = twilio(process.env.TWILIO_ACCT_SID, process.env.TWILIO_AUTH_TOKEN);

    const phoneNumber = `+${countryCode || '966'}${phone}`;

    // Check if user exists and verification was sent already
    let user = await User.findOne({ phone });

    if (!user) {
      const error = new Error('User was not created');
      error.statusCode = 400;

      throw error;
    } else if (!user.verificationSent) {
      const error = new Error('Verification was not sent');
      error.statusCode = 400;

      throw error;
    }

    /************** IN DEVELOPMENT, NO NEED TO CHECK **************/
    // if (process.env.development) {
    //   const devToken = jwt.sign(
    //     {
    //       phone: user.phone,
    //       userId: user._id.toString(),
    //       userRole: user.role
    //     },
    //     process.env.JWT_SECRET,
    //     {
    //       expiresIn: '30d'
    //     }
    //   );

    //   // Update verification status
    //   user.verificationSent = false;
    //   user.verificationTime = 0;
    //   await user.save();

    //   return res.status(200)
    //     .json({
    //       message: 'Development',
    //       status: 'approved',
    //       userId: user._id,
    //       token: devToken,
    //       phone: user.phone
    //     });
    // }
    /**************************************************************/

    const verification = await client.verify.v2.services(process.env.TWILIO_SRV_SID).verificationChecks.create({
      to: phoneNumber,
      code: code
    });

    if (verification.status !== 'approved') {
      const error = new Error('Invalid verification code');
      error.statusCode = 400;

      throw error;
    }

    // Update verification status
    user.verificationSent = false;
    user.verificationTime = 0;
    await user.save();

    io.websocket().emit('auth', {
      to: verification.to,
      status: verification.status
    });

    const token = jwt.sign(
      {
        phone: user.phone,
        userId: user._id.toString(),
        userRole: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d'
      }
    );

    res.status(201).json({
      token: token,
      userId: user._id.toString(),
      userRole: user.role
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getUsersCount = async (req, res, next) => {
  try {
    const count = await User.countDocuments();

    res.status(200).json({ count });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  const { skip, limit } = req.query;

  try {
    const user = await User.findById(req.userId);

    if (!user || req.userRole !== '0') {
      const error = new Error('No authorization');
      error.statusCode = 403;

      throw error;
    }

    const users = await User.find().skip(skip).limit(limit);

    res.status(200).json({ users });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  const { userId } = req.params;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };

      throw error;
    }

    const currentUser = await User.findById(req.userId);

    if (!currentUser || req.userRole !== '0') {
      const error = new Error('No authorization');
      error.statusCode = 403;

      throw error;
    }

    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User is not registered');
      error.statusCode = 400;

      throw error;
    }

    const { role, ...resultUser } = user;

    res.status(200).json(resultUser);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.userExists = async (req, res, next) => {
  const { phone } = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };

      throw error;
    }

    const user = await User.findOne({ phone });

    res.status(200).json({ registered: !!user });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.register = async (req, res, next) => {
  const { phone, firstName, lastName } = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };

      throw error;
    }

    const userExists = await User.findOne({ phone });

    if (userExists) {
      const error = new Error('User already is registered');
      error.statusCode = 400;

      throw error;
    }

    const name = firstName.concat(' ', lastName);

    const userObj = new User({ phone, name, lastLogin: new Date() });

    const user = await userObj.save();

    const token = jwt.sign(
      {
        phone: user.phone,
        userId: user._id.toString(),
        userRole: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d'
      }
    );

    res.status(201).json({
      token: token,
      userId: user._id.toString(),
      userRole: user.role
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.signin = async (req, res, next) => {
  const { phone } = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };

      throw error;
    }

    const user = await User.findOne({ phone });

    if (!user) {
      const error = new Error('User is not registered');
      error.statusCode = 400;

      throw error;
    }

    // Log last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        phone: user.phone,
        userId: user._id.toString(),
        userRole: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d'
      }
    );

    res.status(201).json({
      token: token,
      userId: user._id.toString(),
      userRole: user.role
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.adminSignin = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };

      throw error;
    }

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error('User is not registered');
      error.statusCode = 400;

      throw error;
    } else if (user.role !== '0') {
      const error = new Error('User is not admin');
      error.statusCode = 403;

      throw error;
    } else if (!user.password || user.password !== password) {
      const error = new Error('Invalid password');
      error.statusCode = 400;

      throw error;
    }

    // Log last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
        userRole: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d'
      }
    );

    res.status(201).json({
      token: token,
      userId: user._id.toString(),
      userRole: user.role
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.adminRegister = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };

      throw error;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      const error = new Error('User already is registered');
      error.statusCode = 400;

      throw error;
    }

    const userObj = new User({ email, password, role: '0', lastLogin: new Date() });

    const user = await userObj.save();

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
        userRole: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '30d'
      }
    );

    res.status(201).json({
      token: token,
      userId: user._id.toString(),
      userRole: user.role
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.adminForgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };

      throw error;
    }

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error('User is not registered');
      error.statusCode = 400;

      throw error;
    } else if (user.role !== '0') {
      const error = new Error('User is not admin');
      error.statusCode = 403;

      throw error;
    }

    // Create reset token and expiration (3 hour)
    const resetToken = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
        userRole: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    transporter.sendMail(
      {
        from: `"Khadijah Photo" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'إعادة تعيين كلمة المرور',
        html: `
        <div style="direction: rtl; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: right; min-width: 640px; width: 100%; height: 100%; font-size: 18px; font-family: 'Readex Pro', 'Tajawal', 'Arabic Transparent', 'Roboto', Arial, Helvetica, sans-serif; background-color: #fafafa;">
          <div style="display: block; height: 4px; width: 100%; line-height: 4px; background: #6b4fbb; flex-grow: 1;"></div>
          <div style="width: 640px; padding: 25px 0">
            <div style="position: relative; background-color: #ffffff; border: 1px solid #ededed; border-radius: 5px; overflow: hidden; padding: 18px 25px;">
              <div style="padding: 15px 5px; color: #333333;">
                <h2>مرحباً</h2>
                <p>طلبت إعادة تعيين كلمة المرور لحسابك</p>
                <>لإتمام العملية، يرجى نسخ الرابط أدناه، علماً بأن هذا الرابط صالح لمدة 3 ساعات فقط:
                  <br/>
                  <a href="https://admin.khadijahphoto.com/reset-password?token=${resetToken}">Reset Password</a>
                </p>
                <p style="margin-top: 15px; color: #a25413;">إذا لم تقم بطلب إعادة تعيين كلمة المرور وتعتقد أن الرسالة وصلتك بالخطأ، فقط تجاهلها.</p>
              </div>
            </div>
          </div>
        </div>
      `
      },
      async (error, info) => {
        if (error) {
          error.statusCode = 500;
          return next(error);
        }

        user.passwordResetToken = resetToken;
        user.passwordResetExpiration = Date.now() + 3 * 60 * 60 * 1000; // 3 hours

        await user.save();

        res.status(200).json({ message: 'Password reset email sent' });
      }
    );
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.checkAdminResetToken = async (req, res, next) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiration: { $gt: Date.now() }
    });

    if (!user) {
      const error = new Error('Invalid or expired token');
      error.statusCode = 400;

      throw error;
    } else if (user.role !== '0') {
      const error = new Error('User is not admin');
      error.statusCode = 403;

      throw error;
    }

    res.status(200).json({ message: 'Token is valid' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.adminPasswordReset = async (req, res, next) => {
  const { token, newPassword } = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const validationErr = errors.array().shift();
      const { msg, path, value } = validationErr;
      const error = new Error(msg);

      error.statusCode = 400;
      error.data = { path, value };

      throw error;
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiration: { $gt: Date.now() }
    });

    if (!user) {
      const error = new Error('Invalid or expired token');
      error.statusCode = 400;

      throw error;
    } else if (user.role !== '0') {
      const error = new Error('User is not admin');
      error.statusCode = 403;

      throw error;
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiration = undefined;

    await user.save();

    res.status(200).json({ message: 'Password updated' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
