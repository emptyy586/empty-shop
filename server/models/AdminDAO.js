const { Admin } = require('./Models');

const selectByUsernameAndPassword = (username, password) =>
  Admin.findOne({ username, password }).exec();

module.exports = { selectByUsernameAndPassword };
