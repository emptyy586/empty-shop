import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import PasswordInput from './ui/PasswordInput';

class LoginComponent extends Component {
  static contextType = MyContext;

  state = {
    txtUsername: '',
    txtPassword: '',
    loading: false,
    error: '',
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const { txtUsername, txtPassword } = this.state;
    if (this.state.loading) return;
    if (!txtUsername.trim() || !txtPassword) {
      this.setState({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
      return;
    }
    this.setState({ loading: true, error: '' });

    try {
      const response = await axios.post('/api/admin/login', {
        username: txtUsername.trim(),
        password: txtPassword,
      });
      const result = response.data;

      if (result.success && result.token) {
        this.context.setToken(result.token);
        this.context.setUsername(txtUsername.trim());
        this.context.showToast('Đăng nhập thành công.', 'success');
      } else {
        const message = result.message || '';
        const error = /invalid username or password/i.test(message)
          ? 'Sai tên đăng nhập hoặc mật khẩu.'
          : `Máy chủ từ chối đăng nhập: ${message || 'Vui lòng thử lại.'}`;
        this.setState({ error, loading: false });
      }
    } catch (error) {
      const responseText = typeof error.response?.data === 'string' ? error.response.data : '';
      const message = !error.response || /proxy error|econnrefused|could not proxy request/i.test(responseText)
        ? 'Không kết nối được máy chủ. Hãy kiểm tra server đang chạy tại cổng 3000.'
        : error.response.status >= 500
          ? `Máy chủ gặp lỗi (HTTP ${error.response.status}). Vui lòng thử lại.`
          : `Máy chủ từ chối yêu cầu (HTTP ${error.response.status}). Vui lòng thử lại.`;
      this.setState({ error: message, loading: false });
    } finally {
      if (this.state.loading) this.setState({ loading: false });
    }
  };

  render() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const loginPaths = ['/', '/admin', '/admin/home', '/admin/category', '/admin/product', '/admin/order', '/admin/customer'];
    if (this.context.token || !loginPaths.includes(path)) return null;

    const { txtUsername, txtPassword, loading, error } = this.state;

    return (
      <div className="av2-login">

        {/* Left — branding panel */}
        <div className="av2-login-left">
          <div className="av2-login-brand">
            <b>EMPTY SHOP</b>
            <p>ADMIN</p>
          </div>
          <div className="av2-login-headline">
            <h1>Quản lý cửa hàng<br />gọn gàng, rõ ràng</h1>
            <p>Sản phẩm, danh mục, khách hàng và đơn hàng trong một nơi.</p>
          </div>
          <p className="av2-login-copy">© 2026 EMPTY SHOP</p>
        </div>

        {/* Right — form card */}
        <div className="av2-login-right">
          <div className="av2-login-card">
            <div className="av2-login-card-hd">
              <h2>Đăng nhập quản trị</h2>
              <p>Nhập tài khoản quản trị viên để tiếp tục.</p>
            </div>
            <form className="av2-login-form" onSubmit={this.handleSubmit} noValidate>
              <div>
                <label htmlFor="admin-username">Tên đăng nhập</label>
                <input
                  id="admin-username"
                  type="text"
                  autoComplete="username"
                  value={txtUsername}
                  disabled={loading}
                  onChange={(e) => this.setState({ txtUsername: e.target.value, error: '' })}
                />
              </div>
              <div>
                <label htmlFor="admin-password">Mật khẩu</label>
                <PasswordInput
                  id="admin-password"
                  name="password"
                  value={txtPassword}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  onChange={(e) => this.setState({ txtPassword: e.target.value, error: '' })}
                />
              </div>
              {error && <p className="field-error" role="alert">{error}</p>}
              <button
                className="btn btn-primary av2-login-submit"
                type="submit"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default LoginComponent;
