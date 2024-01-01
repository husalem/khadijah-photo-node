// MongoDB credentials
const { mongo } = JSON.parse(process.env.APP_CONFIG || '{}');
const USERNAME = mongo.user;
const PASSWORD = mongo.password;

// MongoDB URI
exports.MONGODB = `${process.env.development ? 'mongodb+srv' : 'mongodb'}://${USERNAME}:${encodeURIComponent(PASSWORD)}@${mongo.hostString}`;

// CORS Config
exports.CORS_ORIGIN = '*';
exports.CORS_METHOD = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
exports.CORS_HEADERS = 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization';
exports.CORS_EMBEDDER = 'require-corp';
exports.CORS_OPENER = 'same-origin';
