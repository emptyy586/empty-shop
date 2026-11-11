import { Component } from 'react';
import axios from 'axios';
import withRouter from '../utils/withRouter';
import MyContext from '../contexts/MyContext';
import { Link } from 'react-router-dom';
import apiErrorMessage from '../utils/apiErrorMessage';
import PasswordInput from './ui/PasswordInput';

class Login extends Component {
  static contextType = MyContext;

  state = {
    txtUsername: '',
    txtPassword: '',
    loading: false,
    error: '',
  };

  btnLoginClick = async (event) => {
    event.preventDefault();
    if (this._loginPending || this.state.loading) return;
    const { txtUsername, txtPassword } = this.state;
    if (!txtUsername.trim() || !txtPassword) {
      this.setState({ error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
      return;
    }
    this.setState({ loading: true, error: '' });
    this._loginPending = true;
    try {
      const result = await axios.post('/api/customer/login', {
        username: txtUsername.trim(),
        password: txtPassword,
      });
      if (!result.data.success) {
        const message = result.data.message || '';
        const error = /incorrect username or password|invalid username or password/i.test(message)
          ? 'Sai tên đăng nhập hoặc mật khẩu.'
          : /account is deactive/i.test(message)
            ? 'Tài khoản chưa được kích hoạt.'
            : `Máy chủ từ chối đăng nhập: ${message || 'Vui lòng thử lại.'}`;
        this.setState({ error, loading: false });
        return;
      }
      this.context.setToken(result.data.token);
      this.context.setCustomer(result.data.customer);
      this.context.showToast('Đăng nhập thành công!', 'success');
      // Navigate back to previous page or home
      const from = this.props.location?.state?.from || '/home';
      this.props.navigate(from);
    } catch (error) {
      this.setState({ error: apiErrorMessage(error), loading: false });
    } finally {
      this._loginPending = false;
    }
  };

  render() {
    const { txtUsername, txtPassword, loading, error } = this.state;
    return (
      <main className="customer-content auth-page">
        <form className="auth-form" onSubmit={this.btnLoginClick} noValidate>
          <h2 className="auth-form-title">ĐĂNG NHẬP</h2>
          <label>
            Tên đăng nhập:{' '}
            <input
              name="username"
              type="text"
              value={txtUsername}
              autoComplete="username"
              required
              onChange={(e) => this.setState({ txtUsername: e.target.value, error: '' })}
              disabled={loading}
            />
          </label>
          <br />
          <label>
            Mật khẩu:{' '}
            <PasswordInput
              name="password"
              value={txtPassword}
              autoComplete="current-password"
              required
              onChange={(e) => this.setState({ txtPassword: e.target.value, error: '' })}
              disabled={loading}
            />
          </label>
          <br />
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <button className="btn btn-primary auth-submit" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          <p className="auth-switch">Chưa có tài khoản? <Link to="/signup">Đăng ký</Link></p>
        </form>
      </main>
    );
  }
}

export default withRouter(Login);
