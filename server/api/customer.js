const express = require('express');
const mongoose = require('mongoose');
const CategoryDAO = require('../models/CategoryDAO');
const CustomerDAO = require('../models/CustomerDAO');
const OrderDAO = require('../models/OrderDAO');
const ProductDAO = require('../models/ProductDAO');
const crypto = require('crypto');
const EmailUtil = require('../utils/EmailUtil');
const JwtUtil = require('../utils/JwtUtil');
const MyConstants = require('../utils/MyConstants');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIGNUP_REQUIRED_FIELDS = ['username', 'password', 'name', 'email'];

const logSignupError = (label, error) => {
  const duplicateField = error.keyPattern
    ? Object.keys(error.keyPattern).join(',')
    : undefined;
  const message = String(error.message || '')
    .replace(/dup key:.*/i, 'duplicate key value redacted')
    .replace(/password\s*[:=]\s*[^,\s}]+/gi, 'password=[redacted]');
  console.error(`[signup] ${label}`, {
    name: error.name,
    code: error.code || null,
    duplicateField,
    message,
  });
};

router.post('/signup', async (req, res) => {
  const body = req.body || {};
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (SIGNUP_REQUIRED_FIELDS.some((field) => {
    const value = field === 'username' ? username
      : field === 'password' ? password
        : field === 'name' ? name
          : email;
    return !value.trim();
  })) {
    return res.status(400).json({ success: false, message: 'Username, password, name and email are required' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const emailConfigured = EmailUtil.isConfigured();
  // a) SKIP: biến môi trường bật, hoặc production mà chưa có email (tránh 503 trên Render)
  const skipActivation = process.env.SKIP_EMAIL_ACTIVATION === 'true' || (isProduction && !emailConfigured);

  try {
    const [existingUsername, existingEmail] = await Promise.all([
      CustomerDAO.selectByUsername(username),
      CustomerDAO.selectByEmail(email),
    ]);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username already registered',
      });
    }
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const customer = {
      username,
      password,
      name,
      phone: phone || '',
      email,
      active: skipActivation ? 1 : 0,
      token, // luôn lưu token vào DB dù không gửi mail
    };
    let result;
    try {
      result = await CustomerDAO.insert(customer);
    } catch (error) {
      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern || {})[0];
        const message = duplicateField === 'username'
          ? 'Username already registered'
          : duplicateField === 'email'
            ? 'Email already registered'
            : 'A unique customer field is already in use';
        return res.status(409).json({ success: false, message });
      }
      logSignupError('MongoDB insert failed', error);
      return res.status(500).json({ success: false, message: 'Could not create customer record' });
    }
    if (!result) {
      return res.status(500).json({ success: false, message: 'Could not create customer record' });
    }

    // a) SKIP — tự kích hoạt ngay, không gửi mail, không in console
    if (skipActivation) {
      return res.json({ success: true, activated: true, message: 'Account created and activated' });
    }

    // b) EMAIL — có cấu hình email, gửi mail kích hoạt
    if (emailConfigured) {
      try {
        await EmailUtil.send(email, result._id, token);
        return res.json({ success: true, message: 'Please check email' });
      } catch (error) {
        logSignupError('Activation email delivery failed', error);
        return res.status(502).json({
          success: false,
          message: 'Không gửi được email kích hoạt',
        });
      }
    }

    // c) DEV — dev, chưa có email, không bật SKIP: in link/mã kích hoạt ra console
    console.log('[signup] Activation URL:', EmailUtil.activationUrl(result._id, token));
    console.log('[signup] Customer ID:', String(result._id));
    console.log('[signup] Token:', token);
    return res.json({ success: true, message: 'Please check the server console for the activation link' });
  } catch (error) {
    logSignupError('Signup request failed', error);
    return res.status(500).json({ success: false, message: 'Could not process signup request' });
  }
});

router.post('/active', async (req, res) => {
  const { id, token } = req.body;

  try {
    const result = await CustomerDAO.active(id, token, 1);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({
      success: false,
      message: 'Please input username and password',
    });
  }

  try {
    const customer = await CustomerDAO.selectByUsernameAndPassword(
      username,
      password
    );
    if (!customer) {
      return res.json({
        success: false,
        message: 'Incorrect username or password',
      });
    }
    if (customer.active !== 1) {
      return res.json({ success: false, message: 'Account is deactive' });
    }

    const token = JwtUtil.genToken(customer.username, customer.password);
    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      customer,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

router.get('/token', JwtUtil.checkToken, (req, res) => {
  res.json({
    success: true,
    token: req.headers.authorization || req.headers['x-access-token'],
  });
});

router.put('/customers/:id', JwtUtil.checkToken, async (req, res) => {
  try {
    const result = await CustomerDAO.update({
      ...req.body,
      _id: req.params.id,
    });
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

// +84XXXXXXXXX → 0XXXXXXXXX; bỏ khoảng trắng, dấu gạch, dấu chấm
const normalizePhone = (raw = '') => {
  let p = String(raw).replace(/[\s\-.]/g, '');
  if (p.startsWith('+84')) p = '0' + p.slice(3);
  return p;
};

router.post('/checkout', JwtUtil.checkToken, async (req, res) => {
  try {
    const si = req.body.shippingInfo || {};
    const shipName    = typeof si.name    === 'string' ? si.name.trim()    : '';
    const shipPhone   = normalizePhone(si.phone);
    const shipAddress = typeof si.address === 'string' ? si.address.trim() : '';
    const shipNote    = typeof si.note    === 'string' ? si.note.trim()    : '';

    if (!shipName)
      return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên người nhận.' });
    if (shipName.length > 100)
      return res.status(400).json({ success: false, message: 'Họ tên người nhận tối đa 100 ký tự.' });
    if (!shipPhone)
      return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại.' });
    if (!/^\d{9,11}$/.test(shipPhone))
      return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ (9–11 chữ số, có thể bắt đầu bằng +84).' });
    if (!shipAddress)
      return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ giao hàng.' });
    if (shipAddress.length > 255)
      return res.status(400).json({ success: false, message: 'Địa chỉ giao hàng tối đa 255 ký tự.' });
    if (shipNote.length > 500)
      return res.status(400).json({ success: false, message: 'Ghi chú tối đa 500 ký tự.' });

    const order = {
      cdate: Date.now(),
      total: req.body.total,
      status: 'PENDING',
      customer: req.body.customer,
      items: req.body.items,
      shippingInfo: { name: shipName, phone: shipPhone, address: shipAddress, note: shipNote },
    };
    const result = await OrderDAO.insert(order);
    return res.json(result);
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

router.get('/categories', async (req, res) => {
  try {
    const categories = await CategoryDAO.selectAll();
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/products/new', async (req, res) => {
  try {
    const products = await ProductDAO.selectTopNew(3);
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/products/hot', async (req, res) => {
  try {
    if (req.query.limit === undefined) {
      const products = await ProductDAO.selectTopHot(3);
      return res.json(products);
    }

    const limit = Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 12) {
      return res.status(400).json({ success: false, message: 'Invalid product limit' });
    }
    const products = await ProductDAO.selectTopHotWithSales(limit);
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 12 : Number(req.query.limit);
    const sort = req.query.sort || 'newest';
    const category = req.query.category || '';

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({ success: false, message: 'Invalid page' });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: 'Invalid limit' });
    }
    if (!['newest', 'price-asc', 'price-desc'].includes(sort)) {
      return res.status(400).json({ success: false, message: 'Invalid sort' });
    }
    if (category && !mongoose.isValidObjectId(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const { products, total } = await ProductDAO.selectAllPage({
      skip: (page - 1) * limit,
      limit,
      sort,
      category,
    });
    return res.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/products/category/:cid', async (req, res) => {
  try {
    const products = await ProductDAO.selectByCatID(req.params.cid);
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/products/search/:keyword', async (req, res) => {
  try {
    const products = await ProductDAO.selectByKeyword(req.params.keyword);
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await ProductDAO.selectByID(req.params.id);
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
