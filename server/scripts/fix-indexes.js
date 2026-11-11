require('dotenv').config();

const mongoose = require('mongoose');
const MyConstants = require('../utils/MyConstants');

const uri = MyConstants.MONGODB_URI ||
  `mongodb+srv://${encodeURIComponent(MyConstants.DB_USER)}:${encodeURIComponent(
    MyConstants.DB_PASS
  )}@${MyConstants.DB_SERVER}/${MyConstants.DB_DATABASE}`;

const isSingleFieldIndex = (index, field) =>
  Object.keys(index.key).length === 1 && index.key[field] === 1;

async function findDuplicateField(field) {
  const duplicates = await mongoose.connection.db.collection('customers')
    .aggregate([
      { $match: { [field]: { $type: 'string' } } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 1 },
    ])
    .toArray();
  return duplicates.length > 0;
}

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const collection = mongoose.connection.db.collection('customers');
  let indexes = await collection.indexes();
  const hasDuplicateUsername = await findDuplicateField('username');
  const hasDuplicateEmail = await findDuplicateField('email');

  if (hasDuplicateUsername || hasDuplicateEmail) {
    throw new Error(
      `Cannot create unique indexes: duplicate username=${hasDuplicateUsername}, email=${hasDuplicateEmail}`
    );
  }

  const legacyIndexes = indexes.filter((index) =>
    index.unique &&
    (Object.prototype.hasOwnProperty.call(index.key, 'phone') ||
      Object.prototype.hasOwnProperty.call(index.key, 'token'))
  );
  console.log('Legacy unique index definitions to remove:', JSON.stringify(
    legacyIndexes.map(({ name, key, unique, sparse, partialFilterExpression }) => ({
      name,
      key,
      unique: Boolean(unique),
      sparse: Boolean(sparse),
      partialFilterExpression: partialFilterExpression || null,
    }))
  ));

  for (const index of legacyIndexes) {
    await collection.dropIndex(index.name);
  }

  indexes = await collection.indexes();
  for (const field of ['username', 'email']) {
    const index = indexes.find((candidate) => isSingleFieldIndex(candidate, field));
    if (index?.unique) continue;
    if (index) await collection.dropIndex(index.name);
    await collection.createIndex({ [field]: 1 }, { unique: true, name: `${field}_1` });
  }
  console.log('Customer indexes are ready: unique username and email; phone and token are not unique.');
}

main()
  .catch((error) => {
    console.error('Index migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
