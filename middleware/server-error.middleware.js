module.exports = (error, req, res, next) => {
  console.log(error);

  res.status(error.statusCode).json({
    message: error.message,
    data: error.data
  });
};