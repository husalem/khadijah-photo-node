// MongoDB credentials
const { mongo } = JSON.parse(process.env.APP_CONFIG || '{}');
const USERNAME = mongo ? mongo.user : 'dbuser';
const PASSWORD = mongo ? '' : 'Halsalem-17';

// MongoDB URI
exports.MONGODB = mongo
  ? `mongodb://${USERNAME}:${encodeURIComponent(PASSWORD)}@${mongo.hostString}`
  : `mongodb+srv://${USERNAME}:${PASSWORD}@husalem-cluster.faysvm4.mongodb.net/khadijah-photo-db`;

// CORS Config
exports.CORS_ORIGIN = '*';
exports.CORS_METHOD = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
exports.CORS_HEADERS = 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization';
exports.CORS_EMBEDDER = 'require-corp';
exports.CORS_OPENER = 'same-origin';