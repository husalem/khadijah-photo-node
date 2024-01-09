const fs = require('fs');

const multer = require('multer');

exports.getMulterConfig = (dir, filters) => {
  // Setup storage location for uploaded files
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const original = file.originalname;
      const fileName = Date.now() + '-' + (Math.random() * 10).toFixed(0) + original;

      cb(null, fileName);
    }
  });

  // Setup uploaded file filter
  const fileFilter = (req, file, cb) => {
    const typeIncluded = filters.find((type) => type === file.mimetype);

    if (typeIncluded) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

  // Setup uploaded file limits
  const limits = {
    fileSize: '10000',  // 10 MB
    files: 10           // 10 files maximum
  }

  return multer({ storage, fileFilter, limits });
};
