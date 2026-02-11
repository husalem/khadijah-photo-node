const fs = require('fs');

const StudioSample = require('../models/studio-sample');
const utils = require('../utils');

const allowedFilters = ['description', 'tags', 'createdAt', 'updatedAt'];
const allowedSorters = ['createdAt', 'updatedAt'];

exports.getSamplesCount = async (req, res, next) => {
  const { filter } = req.query;
  const { query } = utils.prepareFilterAndSort(filter, '', allowedFilters, []);

  try {
    const count = await StudioSample.countDocuments(query);

    res.status(200).json(count);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getSample = async (req, res, next) => {
  const { sampleId } = req.params;

  try {
    const sample = await StudioSample.findById(sampleId);

    if (!sample) {
      const error = new Error('Sample does not exist');
      error.statusCode = 404;

      throw error;
    }

    const flatSample = sample.toObject(utils.resOpts);

    res.status(200).json(flatSample);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getSamples = async (req, res, next) => {
  const { skip, limit, filter, sort } = req.query;
  const { query, sorter } = utils.prepareFilterAndSort(filter, sort, allowedFilters, allowedSorters);

  try {
    const samples = await StudioSample.find(query).sort(sorter).skip(skip).limit(limit);

    res.status(200).json(samples);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.createSample = async (req, res, next) => {
  const smapleFiles = req.files || [];
  const { description, tags } = req.body;

  try {
    if (!smapleFiles.length) {
      const error = new Error('Missing sample images');
      error.statusCode = 400;

      throw error;
    }

    let samples = [];

    smapleFiles.map((file) => {
      const studioSample = new StudioSample({
        imagePath: file.path,
        description,
        tags
      });

      samples.push(studioSample);
    });

    await StudioSample.insertMany(samples);

    res.status(201).json({ message: 'Samples were added successfully' });
  } catch (error) {
    // Delete file if uploaded in case of error
    smapleFiles.map((sampleImage) => {
      if (sampleImage && fs.existsSync(sampleImage.path)) {
        fs.unlink(sampleImage.path, (error) => {
          if (error) {
            console.log(`Sample image ${sampleImage.path} should have been deleted and it has not due to an error.`);
          }
        });
      }
    });

    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.updateSample = async (req, res, next) => {
  const { sampleId } = req.params;
  const sampleFile = req.file;
  let input = req.body;

  try {
    const loadedSample = await StudioSample.findById(sampleId);

    // If file was uploaded, delete the old file
    if (sampleFile) {
      if (fs.existsSync(loadedSample.imagePath)) {
        fs.unlink(loadedSample.imagePath, (error) => {
          if (error) {
            console.log(
              `Sample ${loadedSample.imagePath} should have been deleted and it has not due to an error.`
            );
          }

          console.log(`Sample ${loadedSample._id} was replaced`);
        });
      }

      // Update the path
      input.imagePath = sampleFile.path;
    }

    const result = await StudioSample.findOneAndUpdate({ _id: loadedSample._id }, { ...input }, { new: true });

    if (!result) {
      const error = new Error('Sample does not exist');
      error.statusCode = 404;

      throw error;
    }

    const flatST = result.toObject(utils.resOpts);
    
    res.status(201).json(flatST);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.deleteSample = async (req, res, next) => {
  const { sampleId } = req.params;
  
  try {
    const sample = await StudioSample.findById(sampleId);

    if (!sample) {
      const error = new Error('Sample does not exist');
      error.statusCode = 404;

      throw error;
    }

    if (fs.existsSync(sample.imagePath)) {
      fs.unlink(sample.imagePath, (error) => {
        if (error) {
          console.log(`Sample ${sample.imagePath} should have been deleted and it has not due to an error.`);
        }
      });
    }

    await sample.deleteOne();

    res.status(201).json({ message: 'Sample was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.uploadSampleImage = utils
  .getMulterConfig('assets/images/studio', ['image/png', 'image/jpg', 'image/jpeg'])
  .array('image');
