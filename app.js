const path = require('path');
const fs = require('fs');

const express = require('express');
const mongoose = require('mongoose');
const compression = require('compression');
const helmet = require('helmet');
const cron = require('node-cron');

const config = require('./config');
const fileStorage = require('./middleware/file-storage.middleware');
const cors = require('./middleware/cors.middleware');
const notFound = require('./middleware/not-found.middleware');
const serverError = require('./middleware/server-error.middleware');
const authRoute = require('./routes/auth.route');

const app = express();

app.use(helmet());
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

// Resource not found handler
app.use(notFound);

// Server-side error handler
app.use(serverError);

mongoose
  .connect(config.MONGODB)
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
