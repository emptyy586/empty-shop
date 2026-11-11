const express = require('express');
const AdminDAO = require('../models/AdminDAO');
const CategoryDAO = require('../models/CategoryDAO');
const CustomerDAO = require('../models/CustomerDAO');
const OrderDAO = require('../models/OrderDAO');
const ProductDAO = require('../models/ProductDAO');
const EmailUtil = require('../utils/EmailUtil');
const JwtUtil = require('../utils/JwtUtil');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, message: 'Username and password are required' });
  }

  try {
    const admin = await AdminDAO.selectByUsernameAndPassword(username, password);
    if (!admin) {
      return res.json({ success: false, message: 'Invalid username or password' });
    }

    const token = JwtUtil.genToken(username, password);
    return res.json({ success: true, message: 'Login successful', token });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.get('/token', JwtUtil.checkToken, (req, res) => {
  res.json({ success: true, token: req.headers.authorization || req.headers['x-access-token'] });
});

router.get('/categories', JwtUtil.checkToken, async (req, res) => {
  try {
    const categories = await CategoryDAO.selectAll();
    return res.json(categories);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.post('/categories', JwtUtil.checkToken, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.json({ success: false, message: 'Category name is required' });
  }

  try {
    const result = await CategoryDAO.insert({ name });
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.put('/categories/:id', JwtUtil.checkToken, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!id || !name) {
    return res.json({ success: false, message: 'Category id and name are required' });
  }

  try {
    const result = await CategoryDAO.update({ _id: id, name });
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.delete('/categories/:id', JwtUtil.checkToken, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.json({ success: false, message: 'Category id is required' });
  }

  try {
    const result = await CategoryDAO.delete(id);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.get('/customers', JwtUtil.checkToken, async (req, res) => {
  try {
    const customers = await CustomerDAO.selectAll();
    return res.json(customers);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.get('/orders/customer/:cid', JwtUtil.checkToken, async (req, res) => {
  try {
    const orders = await OrderDAO.selectByCustID(req.params.cid);
    return res.json(orders);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.put('/customers/deactive/:id', JwtUtil.checkToken, async (req, res) => {
  try {
    const result = await CustomerDAO.active(req.params.id, req.body.token, 0);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.get('/customers/sendmail/:id', JwtUtil.checkToken, async (req, res) => {
  try {
    const customer = await CustomerDAO.selectByID(req.params.id);
    if (!customer) {
      return res.json({ success: false, message: 'Not exists customer' });
    }

    try {
      await EmailUtil.send(customer.email, customer._id, customer.token);
      return res.json({ success: true, message: 'Please check email' });
    } catch (error) {
      return res.json({ success: false, message: 'Email failure' });
    }
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.get('/products', JwtUtil.checkToken, async (req, res) => {
  const sizePage = 4;
  const curPage = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

  try {
    const count = await ProductDAO.selectByCount();
    const products = await ProductDAO.selectBySkipLimit((curPage - 1) * sizePage, sizePage);
    const noPages = Math.ceil(count / sizePage);
    return res.json({ products, noPages, curPage });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.get('/orders', JwtUtil.checkToken, async (req, res) => {
  try {
    const orders = await OrderDAO.selectAll();
    return res.json(orders);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.put('/orders/status/:id', JwtUtil.checkToken, async (req, res) => {
  try {
    const result = await OrderDAO.update(req.params.id, req.body.status);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.post('/products', JwtUtil.checkToken, async (req, res) => {
  try {
    const selectedCategory = await CategoryDAO.selectByID(req.body.category);
    const category = selectedCategory ? selectedCategory.toObject() : null;
    const product = {
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
      cdate: Date.now(),
      category,
    };
    const result = await ProductDAO.insert(product);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.put('/products/:id', JwtUtil.checkToken, async (req, res) => {
  try {
    const selectedCategory = await CategoryDAO.selectByID(req.body.category);
    const category = selectedCategory ? selectedCategory.toObject() : null;
    const product = {
      _id: req.params.id,
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
      category,
    };
    const result = await ProductDAO.update(product);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.delete('/products/:id', JwtUtil.checkToken, async (req, res) => {
  try {
    const result = await ProductDAO.delete(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

module.exports = router;
