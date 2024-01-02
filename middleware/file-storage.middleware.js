const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'assets');
  },
  filename: (req, file, callback) => {
    const original = file.originalname;
    /* let name = (new Date().toISOString()).concat(
      original.substring(0, original.lastIndexOf('.'))
    ).replace(/\W/g, '-');
    const ext = original.substring(original.lastIndexOf('.'), original.length);

    const newName = name + ext; */

    const fileName = Date.now() + '-' + original;

    callback(null, fileName);
  }
});

const fileFilter = (req, file, callback) => {
  if (file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg') {
    callback(null, true);
  } else {
    callback(null, false);
  }
}

module.exports = multer({ storage, fileFilter }).single('image');
