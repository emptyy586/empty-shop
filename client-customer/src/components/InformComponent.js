import { Component } from 'react';
import { Link } from 'react-router-dom';
import MyContext from '../contexts/MyContext';

class Inform extends Component {
  static contextType = MyContext;

  btnLogoutClick = () => {
    this.context.logout();
  };

  render() {
    const { token, customer } = this.context;
    return (
      <div className="border-bottom caption-right glass">
        {token === '' ? (
          <>
            <Link to="/login">Login</Link>
            {' | '}
            <Link to="/signup">Sign-up</Link>
            {' | '}
            <Link to="/active">Active</Link>
          </>
        ) : (
          <>
            <span>Xin chào {customer ? customer.name : ''}</span>
            {' | '}
            <Link to="/home" onClick={this.btnLogoutClick}>
              Đăng xuất
            </Link>
            {' | '}
            <Link to="/myprofile">Hồ sơ</Link>
            {' | '}
            <Link to="/myorders">Đơn hàng</Link>
          </>
        )}
        {' | '}
        <Link className="cart-link" to="/mycart">
          Giỏ hàng <span className="cart-count">{this.context.mycart.reduce((count, item) => count + Number(item.quantity || 0), 0)}</span>
        </Link>
      </div>
    );
  }
}

export default Inform;
