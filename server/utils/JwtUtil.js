const jwt = require('jsonwebtoken');
const MyConstants = require('./MyConstants');

const genToken = (username, password) =>
  jwt.sign({ username, password }, MyConstants.JWT_SECRET, {
    expiresIn: MyConstants.JWT_EXPIRES,
  });

const checkToken = (req, res, next) => {
  const authorization = req.headers.authorization || req.headers['x-access-token'];
  const token = authorization && authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : authorization;

  if (!token) {
    return res.json({ success: false, message: 'Token is required' });
  }

  try {
    req.decoded = jwt.verify(token, MyConstants.JWT_SECRET);
    return next();
  } catch (error) {
    return res.json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { genToken, checkToken };
