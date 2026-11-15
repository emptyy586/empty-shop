require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.collection('products').updateOne(
    { name: 'iPhone X' },
    { $unset: { specs: '' } }
  );
  const v = await mongoose.connection.collection('products').findOne({ name: 'iPhone X' });
  console.log('iPhone X specs after cleanup:', v.specs ?? 'undefined (clean)');
  await mongoose.disconnect();
})();
