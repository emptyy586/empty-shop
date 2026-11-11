import { Component } from 'react';
import { Link } from 'react-router-dom';

/*
 * NotFound – trang 404 cho customer client.
 */

class NotFound extends Component {
  render() {
    return (
      <main className="customer-content">
        <div className="glass not-found">
          <p className="not-found-code">404</p>
          <h1>Trang không tồn tại</h1>
          <p>Địa chỉ bạn truy cập không đúng hoặc đã bị xóa.</p>
          <Link className="btn btn-primary" to="/home">Về trang chủ</Link>
        </div>
      </main>
    );
  }
}

export default NotFound;
