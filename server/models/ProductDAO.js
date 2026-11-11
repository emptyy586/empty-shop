const mongoose = require('mongoose');
const Models = require('./Models');

const selectByCount = () => Models.Product.countDocuments({}).exec();

const selectBySkipLimit = (skip, limit) =>
  Models.Product.find({}).skip(skip).limit(limit).exec();

const insert = (product) => {
  product._id = new mongoose.Types.ObjectId();
  return Models.Product.create(product);
};

const selectByID = (_id) => Models.Product.findById(_id).exec();

const selectTopNew = (top) =>
  Models.Product.find({}).sort({ cdate: -1 }).limit(top).exec();

const selectTopHot = async (top) => {
  const groupedProducts = await Models.Order.aggregate([
    { $match: { status: 'APPROVED' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product._id',
        sum: { $sum: '$items.quantity' },
      },
    },
    { $sort: { sum: -1 } },
    { $limit: top },
  ]).exec();

  const products = [];
  for (const groupedProduct of groupedProducts) {
    if (!groupedProduct._id) continue;
    const product = await selectByID(groupedProduct._id);
    if (product) products.push(product);
  }
  return products;
};

const selectTopHotWithSales = (top) =>
  Models.Order.aggregate([
    { $match: { status: 'APPROVED' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product._id',
        sold: { $sum: '$items.quantity' },
        latestApprovedAt: { $max: '$cdate' },
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    { $sort: { sold: -1, latestApprovedAt: -1, 'product.name': 1 } },
    { $limit: top },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$product',
            { sold: '$sold', latestApprovedAt: '$latestApprovedAt' },
          ],
        },
      },
    },
  ]).exec();

const selectAllPage = async ({ skip, limit, sort, category }) => {
  const filter = category
    ? {
        $or: [
          { 'category._id': category },
          { 'category._id': new mongoose.Types.ObjectId(category) },
        ],
      }
    : {};
  const sortBy = sort === 'price-asc'
    ? { price: 1, _id: 1 }
    : sort === 'price-desc'
      ? { price: -1, _id: 1 }
      : { cdate: -1, _id: 1 };
  const [products, total] = await Promise.all([
    Models.Product.find(filter).sort(sortBy).skip(skip).limit(limit).exec(),
    Models.Product.countDocuments(filter).exec(),
  ]);
  return { products, total };
};

const selectByCatID = (_cid) => {
  const query = mongoose.isValidObjectId(_cid)
    ? {
        $or: [
          { 'category._id': new mongoose.Types.ObjectId(_cid) },
          { 'category._id': _cid },
        ],
      }
    : { 'category._id': _cid };
  return Models.Product.find(query).exec();
};

const selectByKeyword = (keyword) =>
  Models.Product.find({ name: { $regex: new RegExp(keyword, 'i') } }).exec();

const update = (product) => {
  const { _id, name, price, image, category } = product;
  return Models.Product.findByIdAndUpdate(
    _id,
    { name, price, image, category },
    { new: true }
  ).exec();
};

const deleteById = (_id) => Models.Product.findByIdAndDelete(_id).exec();

module.exports = {
  selectByCount,
  selectBySkipLimit,
  insert,
  selectByID,
  selectTopNew,
  selectTopHot,
  selectTopHotWithSales,
  selectAllPage,
  selectByCatID,
  selectByKeyword,
  update,
  delete: deleteById,
};