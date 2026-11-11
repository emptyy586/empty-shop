module.exports = {
  DB_SERVER: process.env.DB_SERVER || '',
  DB_USER: process.env.DB_USER || '',
  DB_PASS: process.env.DB_PASS || '',
  DB_DATABASE: process.env.DB_DATABASE || 'shoppingonline',
  MONGODB_URI: process.env.MONGODB_URI || '',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3001',
  DEV_AUTO_ACTIVATE: process.env.DEV_AUTO_ACTIVATE === 'true',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '3600000',
};