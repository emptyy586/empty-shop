const mongoose = require('mongoose');
const { Customer } = require('./Models');

const selectByUsernameOrEmail = (username, email) =>
  Customer.findOne({ $or: [{ username }, { email }] }).exec();

const selectByUsername = (username) =>
  Customer.findOne({ username }).select('_id').lean().exec();

const selectByEmail = (email) =>
  Customer.findOne({ email }).select('_id').lean().exec();

const selectAll = () => Customer.find({}).exec();

const selectByID = (_id) => Customer.findById(_id).exec();

const insert = (customer) => {
  customer._id = new mongoose.Types.ObjectId();
  return Customer.create(customer);
};

const active = (_id, token, active) =>
  Customer.findOneAndUpdate(
    { _id, token },
    { active },
    { new: true }
  ).exec();

const selectByUsernameAndPassword = (username, password) =>
  Customer.findOne({ username, password }).exec();

const update = (customer) => {
  const { _id, username, password, name, phone, email } = customer;
  return Customer.findByIdAndUpdate(
    _id,
    { username, password, name, phone, email },
    { new: true }
  ).exec();
};

module.exports = {
  selectByUsernameOrEmail,
  selectByUsername,
  selectByEmail,
  selectAll,
  selectByID,
  insert,
  active,
  selectByUsernameAndPassword,
  update,
};
