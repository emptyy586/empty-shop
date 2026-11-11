const mongoose = require('mongoose');

const OrderCategorySnapshotSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
  },
  { versionKey: false }
);

const CustomerSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    name: String,
    phone: String,
    email: String,
    active: Number,
    token: String,
  },
  { versionKey: false }
);

const OrderProductSnapshotSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    image: String,
    cdate: Number,
    category: OrderCategorySnapshotSchema,
  },
  { versionKey: false }
);

const OrderCustomerSnapshotSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    password: String,
    name: String,
    phone: String,
    email: String,
    active: Number,
    token: String,
  },
  { versionKey: false }
);

const ItemSchema = new mongoose.Schema(
  {
    product: OrderProductSnapshotSchema,
    quantity: Number,
  },
  { _id: false, versionKey: false }
);

const OrderSchema = new mongoose.Schema(
  {
    cdate: Number,
    total: Number,
    status: String,
    customer: OrderCustomerSnapshotSchema,
    items: [ItemSchema],
  },
  { versionKey: false }
);

const AdminSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
  },
  { versionKey: false }
);

const CategoryModelSchema = new mongoose.Schema(
  {
    name: String,
  },
  { versionKey: false }
);

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    image: String,
    cdate: Number,
    category: Object,
  },
  { versionKey: false }
);

module.exports = {
  Admin: mongoose.model('Admin', AdminSchema, 'admins'),
  Category: mongoose.model('Category', CategoryModelSchema, 'categories'),
  Customer: mongoose.model('Customer', CustomerSchema, 'customers'),
  Product: mongoose.model('Product', ProductSchema, 'products'),
  Order: mongoose.model('Order', OrderSchema, 'orders'),
};
