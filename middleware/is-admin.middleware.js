module.exports = (req, res, next) => {
  const role = req.userRole;

  if (role === '0') {
    next();
  } else {
    const error = new Error('No authorization');
    error.statusCode = 403;

    next(error);
  }
};
