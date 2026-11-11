import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import ThemeToggle from './ui/ThemeToggle';
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
    const loginPaths = ['/','/admin','/admin/home','/admin/category','/admin/product','/admin/order','/admin/customer'];
    if (this.context.token || !loginPaths.includes(path)) return null;

    return (
      <div className="body-admin admin-login align-valign-center">
        <form className="admin-login-form glass" onSubmit={this.handleSubmit}>
          <div className="admin-login-heading">
            <div className="admin-login-theme"><ThemeToggle /></div>
            <div className="eyebrow">BACK OFFICE</div>
            <h1>EMPTY SHOP</h1>
          </div>
          <table>
            <tbody>
              <tr>
                <td><label htmlFor="admin-username">Tên đăng nhập</label></td>
                <td>
                  <input
                    id="admin-username"
                    value={this.state.txtUsername}
                    autoComplete="username"
                    disabled={this.state.loading}
                    onChange={(event) => this.setState({ txtUsername: event.target.value, error: '' })}
                  />
                </td>
              </tr>
              <tr>
                <td><label htmlFor="admin-password">Mật khẩu</label></td>
                <td>
                  <PasswordInput
                    id="admin-password"
                    name="password"
                    value={this.state.txtPassword}
                    autoComplete="current-password"
                    required
                    disabled={this.state.loading}
                    onChange={(event) => this.setState({ txtPassword: event.target.value, error: '' })}
                  />
                </td>
              </tr>
              <tr>
                <td />
                <td>
                  {this.state.error && <p className="field-error" role="alert">{this.state.error}</p>}
                  <button className="btn btn-primary auth-submit" type="submit" disabled={this.state.loading} aria-busy={this.state.loading}>
                    {this.state.loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    );
  }
}

export default LoginComponent;
