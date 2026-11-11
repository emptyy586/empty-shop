const mongoose = require('mongoose');
const MyConstants = require('./MyConstants');

const uri = MyConstants.MONGODB_URI ||
  `mongodb+srv://${encodeURIComponent(MyConstants.DB_USER)}:${encodeURIComponent(
    MyConstants.DB_PASS
  )}@${MyConstants.DB_SERVER}/${MyConstants.DB_DATABASE}`;

if (!MyConstants.MONGODB_URI && !MyConstants.DB_PASS) {
  throw new Error('MongoDB password is missing. Set MONGODB_URI or DB_PASS before starting the server.');
}

mongoose
  .connect(uri, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => console.log('Connected to MongoDB: ' + MyConstants.DB_DATABASE))
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    console.error('Check the Atlas cluster address, DNS/network access, IP allowlist, and database credentials.');
  });

module.exports = mongoose;