require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await mongoose.connection.collection('products').find({}).toArray();
    console.log(`Found ${products.length} products`);

    const outPath = path.join(__dirname, '..', 'backup-products.json');
    fs.writeFileSync(outPath, JSON.stringify(products, null, 2), 'utf8');
    console.log(`Backup saved to: ${outPath}`);
  } catch (error) {
    console.error('Backup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
