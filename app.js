const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const compression = require('compression');
const helmet = require('helmet');

const cors = require('./middleware/cors.middleware');
const notFound = require('./middleware/not-found.middleware');
const serverError = require('./middleware/server-error.middleware');
const configRoute = require('./routes/app-config.route');
const authRoute = require('./routes/auth.route');
const kindergartenRoute = require('./routes/kindergarten.route');
const themeRoute = require('./routes/theme.route');
const packageRoute = require('./routes/package.route');
const serviceAddRoute = require('./routes/service-adds.route');
const paperSizeRoute = require('./routes/paper-size.route');
const serviceTypeRoute = require('./routes/service-type.route');
const costumRoute = require('./routes/costum.route');
const serviceReqRoute = require('./routes/service-request.route');
const kinderReqRoute = require('./routes/kindergarten-request.route');
const orderRoute = require('./routes/order.route');
const kindergartenClassRoute = require('./routes/kindergarten-class.route');

const app = express();

// Helmet for security headers
app.use(helmet());

// File compression
app.use(compression());

// Include URL body
app.use(express.json());

// Prevent CORS errors
app.use(cors);

// Include assets folder
app.use(express.static(path.join(__dirname, 'assets')));

// Register routes
app.use(configRoute);
app.use(authRoute);
app.use(kindergartenRoute);
app.use(themeRoute);
app.use(packageRoute);
app.use(serviceAddRoute);
app.use(paperSizeRoute);
app.use(serviceTypeRoute);
app.use(costumRoute);
app.use(serviceReqRoute);
app.use(kinderReqRoute);
app.use(orderRoute);
app.use(kindergartenClassRoute);

// Resource not found handler
app.use(notFound);

// Server-side error handler
app.use(serverError);

// MongoDB connection string config
const { mongo } = JSON.parse(process.env.APP_CONFIG || '{}');
const USERNAME = mongo.user;
const PASSWORD = process.env.MONGO_PASSWORD;

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
      // console.log(`${new Date().toLocaleString()} Client connected:`, socket.id);
    });

    io.on('connect_error', (error) => console.log('Socket.io connection error:', error));
    io.on('connect_failed', (error) => console.log('Socket.io connection failed:', error));
  })
  .catch((error) => console.log(error));
