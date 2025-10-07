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
      const fileName = (Math.random() * 10).toFixed(0) + Date.now() + '-' + original;

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
    fileSize: '10000', // 10 MB
    files: 10 // 10 files maximum
  };

  return multer({ storage, fileFilter, limits });
};

// Query filter builder
exports.buildFilter = (filter, allowedFilters) => {
  const mongoFilter = {};
  for (const key in filter) {
    if (allowedFilters.includes(key)) {
      const value = filter[key];
      if (typeof value === 'object' && ('$gte' in value || '$lte' in value)) {
        mongoFilter[key] = {};
        if ('$gte' in value) mongoFilter[key]['$gte'] = Number(value['$gte']);
        if ('$lte' in value) mongoFilter[key]['$lte'] = Number(value['$lte']);
      } else {
        mongoFilter[key] = value;
      }
    }
  }

  return mongoFilter;
};

// Query sorter builder
exports.buildSorter = (sorter, allowedSorter) => {
  const mongoSorter = {};
  for (const key in sorter) {
    if (allowedSorter.includes(key)) {
      const value = sorter[key];
      if (typeof value === 'object' && ('$gte' in value || '$lte' in value)) {
        mongoSorter[key] = sorter[key] === 'desc' || sorter[key] === 'descending' || sorter[key] === -1 ? -1 : 1;
      }
    }
  }

  return mongoSorter;
};
