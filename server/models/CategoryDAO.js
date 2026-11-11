const { Category } = require('./Models');

const selectAll = () => Category.find({}).exec();

const selectByID = (_id) => Category.findById(_id).exec();

const insert = (category) => Category.create(category);

const update = (category) => {
  const { _id, name } = category;
  return Category.findByIdAndUpdate(_id, { name }, { new: true }).exec();
};

const deleteById = (_id) => Category.findByIdAndDelete(_id).exec();

module.exports = {
  selectAll,
  selectByID,
  insert,
  update,
  delete: deleteById,
};
