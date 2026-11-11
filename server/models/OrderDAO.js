const mongoose = require('mongoose');
const { Order } = require('./Models');

const insert = (order) => {
  order._id = new mongoose.Types.ObjectId();
  return Order.create(order);
};

const selectByCustID = (_cid) =>
  Order.find({ 'customer._id': _cid }).exec();

const selectAll = () =>
  Order.find({}).sort({ cdate: -1 });

const update = (_id, newStatus) =>
  Order.findByIdAndUpdate(_id, { status: newStatus }, { new: true });

module.exports = { insert, selectByCustID, selectAll, update };
