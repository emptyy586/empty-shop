const nodemailer = require('nodemailer');
const MyConstants = require('./MyConstants');

const isConfigured = () => Boolean(MyConstants.EMAIL_USER && MyConstants.EMAIL_PASS);

const activationUrl = (id, token) => {
  const baseUrl = MyConstants.CLIENT_URL.replace(/\/+$/, '');
  return `${baseUrl}/active?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
};

const createTransport = () => {
  if (!isConfigured()) throw new Error('Email is not configured');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: MyConstants.EMAIL_USER,
      pass: MyConstants.EMAIL_PASS,
    },
  });
};

const createMessage = (email, id, token) => {
  const url = activationUrl(id, token);
  return {
    from: MyConstants.EMAIL_FROM || MyConstants.EMAIL_USER,
    to: email,
    subject: 'Kích hoạt tài khoản EMPTY SHOP',
    text: [
      'Cảm ơn bạn đã đăng ký EMPTY SHOP.',
      `Kích hoạt tài khoản tại: ${url}`,
      '',
      'Nếu không mở được liên kết, nhập hai mã dự phòng sau tại trang kích hoạt:',
      `Mã khách hàng (id): ${id}`,
      `Mã kích hoạt (token): ${token}`,
    ].join('\n'),
    html: `<p>Cảm ơn bạn đã đăng ký EMPTY SHOP.</p>
      <p><a href="${url}">Kích hoạt tài khoản</a></p>
      <p>Nếu không mở được liên kết, hãy nhập hai mã dự phòng sau tại trang kích hoạt:</p>
      <ul><li>Mã khách hàng (id): <code>${id}</code></li>
      <li>Mã kích hoạt (token): <code>${token}</code></li></ul>`,
  };
};

const send = async (email, id, token, transporter = createTransport()) =>
  transporter.sendMail(createMessage(email, id, token));

module.exports = { send, isConfigured, activationUrl, createMessage };
