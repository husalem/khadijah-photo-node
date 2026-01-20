const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const twilio = require('twilio');

const User = require('../models/user');
const utils = require('../utils');
const io = require('../socket');

const allowedFilters = ['phone', 'email', 'name', 'role', 'createdAt', 'updatedAt'];
const allowedSorters = ['phone', 'email', 'name', 'role', 'createdAt', 'updatedAt'];

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  logger: true
});

const mailBody = `
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
  </head>
  <body style="margin:0; padding:0; background-color:#fafafa; -webkit-text-size-adjust:none;">
    <!-- Outer full-width table -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fafafa;">
      <tr>
        <td align="center">
          <!-- Gradient row (100% width) -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:640px max-width:640px; margin: 0 auto;">
            <tr>
              <td style="padding:0; margin:0; height:10px; line-height:4px;
                         background: linear-gradient(135deg,#0f2027,#203a43,#2c5364);">
                <!-- Fallback image for clients that ignore CSS gradients -->
                <img src="cid:grad" alt="" width="100%" style="display:block; max-width:640px; max-height:90px; width:100%;">
              </td>
            </tr>
          </table>

          <!-- Centered card (fixed width, responsive) -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                 width="640" style="width:640px; max-width:640px; margin:0 auto;">
            <tr>
              <td style="padding:25px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                       style="background:#ffffff; border:1px solid #ededed; border-radius:5px; overflow:hidden;">
                  <tr>
                    <td style="padding:18px 25px; color:#333333; font-family: Arial, Helvetica, sans-serif; font-size:16px; text-align:right; direction:rtl;">
                      <h2 style="margin:0 0 10px 0; font-size:28px; line-height:1;">مرحبا</h2>

                      <p style="margin:0 0 12px;">لقد طلبت إعادة تعيين كلمة المرور لحسابك.</p>

                      <p style="margin:0 0 18px;">لإتمام العملية يرجى الضغط على الرابط أدناه. علماً بأن هذا الرابط صالح لمدة 3 ساعات فقط.</p>

                      <p style="margin:0 0 12px;">
                        <a href="https://admin.khadijahphoto.com/auth/reset-password?token=REPLACEME"
                           style="display:inline-block; padding:10px 16px; background:#080723; color:#ffffff; text-decoration:none; border-radius:4px;">
                          Reset Password
                        </a>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 18px 18px 18px; color:#D45309; font-size:14px; text-align:right; direction:rtl;">
                      إذا لم تقم بطلب إعادة تعيين كلمة المرور وتعتقد أن الرسالة وصلك بالخطأ فقط تجاهلها.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
`;

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
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        message: 'Development',
        status: 'Sent',
        userId: user._id.toString(),
        phone: user.phone
      });
    }
    /******************************************************************/

    const verification = await client.verify.v2.services(process.env.TWILIO_SRV_SID).verifications.create({
      to: phoneNumber,
      channel: 'sms',
      locale: 'ar'
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
    if (process.env.NODE_ENV === 'development') {
      const devToken = jwt.sign(
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

      // Update verification status
      user.verificationSent = false;
      user.verificationTime = 0;
      await user.save();

      return res.status(200).json({
        message: 'Development',
        status: 'approved',
        userId: user._id,
        token: devToken,
        phone: user.phone
      });
    }
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
  const { filter } = req.query;
  const { query } = utils.prepareFilterAndSort(filter, '', allowedFilters, []);

  try {
    const count = await User.countDocuments(query);

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  const { skip, limit, filter, sort } = req.query;
  const { query, sorter } = utils.prepareFilterAndSort(filter, sort, allowedFilters, allowedSorters);

  try {
    const user = await User.findById(req.userId);

    if (!user || req.userRole !== '0') {
      const error = new Error('No authorization');
      error.statusCode = 403;

      throw error;
    }

    const users = await User.find(query, { _id: 1, phone: 1, email: 1, name: 1, role: 1, createdAt: 1 })
      .sort(sorter)
      .skip(skip)
      .limit(limit);

    res.status(200).json(users);
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

    // const { role, ...resultUser } = user;
    const { _id, phone, email, name, role, createdAt } = user;

    res.status(200).json({ _id, phone, email, name, role, createdAt });
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
    }

    const matches = await bcrypt.compare(password, user.password);

    if (!matches) {
      const error = new Error('Wrong password');
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
      userRole: user.role,
      name: user.name
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.adminRegister = async (req, res, next) => {
  const { phone, email, name } = req.body;
  const errors = validationResult(req);
  let user = null;

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

    if (userExists && userExists.role === '0') {
      const error = new Error('User already is registered');
      error.statusCode = 400;

      throw error;
    } else if (userExists && userExists.role !== '0') {
      userExists.phone = phone || userExists.phone;
      userExists.name = name || userExists.name;
      userExists.role = '0';

      user = await userExists.save();
    } else {
      user = new User({ phone, email, name, role: '0' });

      user = await user.save();
    }

    const { _id, phone, email, name, role, createdAt } = user;

    res.status(201).json({ _id, phone, email, name, role, createdAt });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.adminUpdate = async (req, res, next) => {
  const { userId } = req.params;
  const { phone, email, name } = req.body;
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

    const result = await User.findByIdAndUpdate(
      userId,
      { phone, email, name },
      { new: true }
    );

    if (!result) {
      const error = new Error('User does not exist');
      error.statusCode = 404;

      throw error;
    }

    const { _id, phone: updatedPhone, email: updatedEmail, name: updatedName, role, createdAt } = result;

    res.status(200).json({ _id, phone: updatedPhone, email: updatedEmail, name: updatedName, role, createdAt });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.adminRemove = async (req, res, next) => {
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

    const result = await User.findByIdAndUpdate(userId, { role: '1' });

    if (!result) {
      const error = new Error('User does not exist');
      error.statusCode = 404;

      throw error;
    }

    res.status(200).json({ message: 'User removed from admin successfully' });
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
        html: mailBody.replace('REPLACEME', resetToken),
        attachments: [
          {
            filename: 'grad.png',
            path: 'assets/images/mail_header.png',
            cid: 'grad' // same cid value as in the html img src
          }
        ]
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
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
