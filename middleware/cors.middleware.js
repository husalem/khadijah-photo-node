const origin = '*';
const methods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const headers = 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization';
const embedder = 'require-corp';
const opener = 'same-origin';

module.exports = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
  res.setHeader('Cross-origin-Embedder-Policy', embedder);
  res.setHeader('Cross-origin-Opener-Policy', opener);

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};
