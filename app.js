const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const compression = require('compression');
const helmet = require('helmet');

const fileStorage = require('./middleware/file-storage.middleware');
const cors = require('./middleware/cors.middleware');
const notFound = require('./middleware/not-found.middleware');
const serverError = require('./middleware/server-error.middleware');
const authRoute = require('./routes/auth.route');
const preschoolRoute = require('./routes/preschool.route');

const app = express();

// Helmet for security headers
app.use(helmet());

// File compression
app.use(compression());

// Include URL body
app.use(express.json());

// Prevent CORS errors
app.use(cors);

// Configure multer and file storage
app.use(fileStorage);

// Include assets folder
app.use(express.static(path.join(__dirname, 'assets')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Register routes
app.use(authRoute);
app.use(preschoolRoute);

// Resource not found handler
app.use(notFound);

// Server-side error handler
app.use(serverError);

// MongoDB connection string config
const { mongo } = JSON.parse(process.env.APP_CONFIG || '{}');
const USERNAME = mongo.user;
const PASSWORD = mongo.password;

// MongoDB URI
const connection = `${process.env.development ? 'mongodb+srv' : 'mongodb'}://${USERNAME}:${encodeURIComponent(PASSWORD)}@${mongo.hostString}`;

mongoose
  .connect(connection)
  .then((result) => {
    console.clear();
    console.log(`${new Date().toLocaleString()}: Connected`);

    const server = app.listen(process.env.port || 3000);

    // Setup socket.io
    const io = require('./socket').init(server);

    io.on('connection', (socket) => {
      console.log(`${new Date().toLocaleString()} Client connected:`, socket.id);
    });

    io.on('connect_error', (error) => console.log('Socket.io connection error:', error));
    io.on('connect_failed', (error) => console.log('Socket.io connection failed:', error));
  })
  .catch((error) => console.log(error));
