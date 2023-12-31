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

// Firebase Config
exports.FIREBASE = {
  apiKey: 'AIzaSyBlhowLAqucnhvXhmIYKretwKv5h8ncTgk',
  authDomain: 'khadijah-photo.firebaseapp.com',
  projectId: 'khadijah-photo',
  storageBucket: 'khadijah-photo.appspot.com',
  messagingSenderId: '707035189304',
  appId: '1:707035189304:web:487a5ea425a0b1b5c9d6cd'
};

// Twilio Config
exports.TWILIO = {
  name: 'khadijahphoto',
  sid: 'SK201ae0e209f84c0f1480fc73e02f6f75',
  secret: 'ZYP1mQjQ6Okq6dM61QMvMhmXhS1FESNf'
}
