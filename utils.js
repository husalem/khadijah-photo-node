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

const normalizeValue = (val) => {
  // Convert numeric strings to numbers, "true"/"false" to booleans
  if (typeof val === 'string') {
    if (/^\d+$/.test(val)) return Number(val);
    if (/^\d+\.\d+$/.test(val)) return Number(val);
    if (val === 'true') return true;
    if (val === 'false') return false;
  }
  return val;
};

// Query filter builder
// Builds a MongoDB filter object from a parsed filter input.
// - filter: object representing query filters
// - allowedFilters: array of allowed top-level field names
// Supports $or (array), comparison operators ($gte, $lte, $gt, $lt), $in, $regex
exports.buildFilter = (filter, allowedFilters) => {
  if (!filter || typeof filter !== 'object') return {};

  const mongoFilter = {};

  for (const key of Object.keys(filter)) {
    // allow $or and $and special operators
    if (key === '$or' || key === '$and') {
      const arr = filter[key];
      if (Array.isArray(arr)) {
        mongoFilter[key] = arr
          .map((item) => this.buildFilter(item, allowedFilters))
          .filter((it) => Object.keys(it).length > 0);
      }
      continue;
    }

    // only allow whitelisted fields
    if (!allowedFilters.includes(key)) continue;

    const value = filter[key];

    // if value is an object, it may contain operators
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const operators = {};

      const knownOps = ['$gte', '$lte', '$gt', '$lt', '$ne', '$in', '$regex', '$exists'];
      let hasOp = false;

      for (const op of knownOps) {
        if (op in value) {
          hasOp = true;
          if (op === '$in' && Array.isArray(value[op])) {
            operators[op] = value[op].map(normalizeValue);
          } else if (op === '$regex') {
            operators[op] = value[op];
          } else if (op === '$exists') {
            operators[op] = Boolean(value[op]);
          } else {
            operators[op] = normalizeValue(value[op]);
          }
        }
      }

      if (hasOp) {
        mongoFilter[key] = operators;
      } else if (Array.isArray(value)) {
        // treat arrays as $in
        mongoFilter[key] = { $in: value.map(normalizeValue) };
      } else {
        // nested object treated as exact match
        const normalized = {};
        for (const k of Object.keys(value)) {
          normalized[k] = normalizeValue(value[k]);
        }
        mongoFilter[key] = normalized;
      }
    } else if (Array.isArray(value)) {
      // arrays become $in with normalized values
      mongoFilter[key] = { $in: value.map(normalizeValue) };
    } else {
      mongoFilter[key] = normalizeValue(value);
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
      mongoSorter[key] = value === 'desc' || value === 'descending' || value === -1 ? -1 : 1;
    }
  }

  return mongoSorter;
};

// Prepares both filter and sorter
exports.prepareFilterAndSort = (filter = '', sort = '', allowedFilters = [], allowedSorters = []) => {
  let query = {};
  let sorter = {};

  if (filter) {
    const jsonFilter = JSON.parse(decodeURIComponent(filter));
    query = exports.buildFilter(jsonFilter, allowedFilters);
  }

  if (sort) {
    const jsonSort = JSON.parse(decodeURIComponent(sort));
    sorter = this.buildSorter(jsonSort, allowedSorters);
  }

  return { query, sorter };
};
