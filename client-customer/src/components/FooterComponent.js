import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="customer-footer-full">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">EMPTY SHOP</span>
          <p className="footer-tagline">Mua sắm dễ dàng, trải nghiệm tinh tế.</p>
        </div>
        <nav className="footer-col" aria-label="Cửa hàng">
          <h4>Cửa hàng</h4>
          <Link to="/products">Sản phẩm</Link>
          <Link to="/bestsellers">Bán chạy</Link>
          <Link to="/home">Danh mục</Link>
        </nav>
        <nav className="footer-col" aria-label="Hỗ trợ">
          <h4>Hỗ trợ</h4>
          <Link to="/myorders">Đơn hàng</Link>
          <span>Bảo hành</span>
          <span>Liên hệ</span>
        </nav>
        <nav className="footer-col" aria-label="Tài khoản">
          <h4>Tài khoản</h4>
          <Link to="/login">Đăng nhập</Link>
          <Link to="/signup">Đăng ký</Link>
          <Link to="/myprofile">Hồ sơ</Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
