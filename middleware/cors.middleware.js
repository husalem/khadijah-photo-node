const config = require('../config');

module.exports = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', config.CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', config.CORS_METHOD);
  res.setHeader('Access-Control-Allow-Headers', config.CORS_HEADERS);
  res.setHeader('Cross-origin-Embedder-Policy', config.CORS_EMBEDDER);
  res.setHeader('Cross-origin-Opener-Policy', config.CORS_OPENER);

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};
