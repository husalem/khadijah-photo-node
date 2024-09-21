const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');

  try {
    if (!authHeader) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(' ')[1];

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedToken) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    }

    req.userId = decodedToken.userId;
    req.userRole = decodedToken.userRole;
    
    next();
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};
