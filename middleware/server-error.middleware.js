module.exports = (error, req, res, next) => {
  const code = error.statusCode || 500;

  if (code === 500) {
    console.log(new Date().toISOString(), error);
  }

  res.status(error.statusCode).json({
    message: error.message,
    data: error.data
  });
};
