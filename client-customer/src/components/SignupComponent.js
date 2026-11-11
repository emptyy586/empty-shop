import { Component } from 'react';
import axios from 'axios';
import withRouter from '../utils/withRouter';
import { Link } from 'react-router-dom';
import apiErrorMessage from '../utils/apiErrorMessage';
import PasswordInput from './ui/PasswordInput';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class Signup extends Component {
  state = {
    txtUsername: '',
    txtPassword: '',
    txtConfirm: '',
    txtName: '',
    txtPhone: '',
    txtEmail: '',
    loading: false,
    success: false,
    successMessage: '',
    errors: {},
  };

  validate = () => {
    const { txtUsername, txtPassword, txtConfirm, txtName, txtEmail, txtPhone } = this.state;
    const errors = {};
    if (!txtUsername.trim()) errors.username = 'Vui lòng nhập tên đăng nhập.';
    if (txtPassword.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự.';
    if (txtConfirm !== txtPassword) errors.confirm = 'Mật khẩu nhập lại không khớp.';
    if (!txtName.trim()) errors.name = 'Vui lòng nhập họ tên.';
    if (!EMAIL_RE.test(txtEmail)) errors.email = 'Email không hợp lệ.';
    if (txtPhone.trim() && !/^[0-9+().\-\s]{8,20}$/.test(txtPhone.trim())) errors.phone = 'Số điện thoại không hợp lệ.';
    return errors;
  };

  handleChange = (field) => (e) => {
    this.setState({ [field]: e.target.value }, () => {
      const allErrors = this.validate();
      const key = {
        txtUsername: 'username',
        txtPassword: 'password',
        txtConfirm: 'confirm',
        txtName: 'name',
        txtEmail: 'email',
        txtPhone: 'phone',
      }[field];
      const errors = { ...this.state.errors };
      if (key && allErrors[key]) errors[key] = allErrors[key];
      else if (key) delete errors[key];
      if (field === 'txtPassword' && allErrors.confirm) errors.confirm = allErrors.confirm;
      if (field === 'txtPassword' && !allErrors.confirm) delete errors.confirm;
      this.setState({ errors });
    });
  };

  btnSignupClick = async (event) => {
    event.preventDefault();
    if (this._signupPending || this.state.loading) return;
    const errors = this.validate();
    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }
    const { txtUsername, txtPassword, txtName, txtPhone, txtEmail } = this.state;
    this._signupPending = true;
    this.setState({ loading: true });
    try {
      const result = await axios.post('/api/customer/signup', {
        username: txtUsername.trim(),
        password: txtPassword,
        name: txtName.trim(),
        phone: txtPhone.trim(),
        email: txtEmail.trim(),
      });
      if (result.data?.success === true) {
        const message = /console/i.test(result.data.message || '')
          ? 'Tài khoản đã được tạo. Hãy lấy liên kết kích hoạt trong console của server đang chạy.'
          : /activated for development/i.test(result.data.message || '')
            ? 'Tài khoản đã được kích hoạt trong môi trường phát triển. Bạn có thể đăng nhập.'
            : 'Vui lòng kiểm tra email để kích hoạt tài khoản trước khi đăng nhập.';
        this.setState({ success: true, successMessage: message, loading: false });
      } else {
        this.showSignupError(result.data?.message || '');
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      if (serverMessage) this.showSignupError(serverMessage);
      else this.setState({ errors: { _server: apiErrorMessage(error) }, loading: false });
    } finally {
      this._signupPending = false;
    }
  };

  showSignupError(serverMessage) {
    if (/username already registered/i.test(serverMessage)) {
      this.setState({ errors: { username: 'Tên đăng nhập đã được sử dụng.' }, loading: false });
      return;
    }
    if (/email already registered/i.test(serverMessage)) {
      this.setState({ errors: { email: 'Email đã được sử dụng.' }, loading: false });
      return;
    }
    if (/invalid email/i.test(serverMessage)) {
      this.setState({ errors: { email: 'Email không hợp lệ.' }, loading: false });
      return;
    }
    if (/password must be at least/i.test(serverMessage)) {
      this.setState({ errors: { password: 'Mật khẩu tối thiểu 6 ký tự.' }, loading: false });
      return;
    }
    if (/username, password, name and email are required/i.test(serverMessage)) {
      this.setState({
        errors: {
          username: 'Vui lòng nhập tên đăng nhập.',
          password: 'Vui lòng nhập mật khẩu.',
          name: 'Vui lòng nhập họ tên.',
          email: 'Vui lòng nhập email.',
        },
        loading: false,
      });
      return;
    }
    const message = /activation email could not be sent|không gửi được email kích hoạt/i.test(serverMessage)
      ? 'Tài khoản đã được tạo nhưng không gửi được email kích hoạt. Vui lòng liên hệ quản trị viên để được hỗ trợ.'
      : /email is not configured in production/i.test(serverMessage)
        ? 'Máy chủ chưa cấu hình email kích hoạt. Vui lòng liên hệ quản trị viên.'
        : /could not create customer record/i.test(serverMessage)
          ? 'Máy chủ không thể lưu tài khoản. Vui lòng thử lại.'
          : /could not process signup request/i.test(serverMessage)
            ? 'Máy chủ không thể xử lý yêu cầu. Vui lòng thử lại.'
            : `Máy chủ từ chối đăng ký: ${serverMessage || 'Vui lòng thử lại.'}`;
    this.setState({ errors: { _server: message }, loading: false });
  }

  renderField(label, field, type = 'text', extra) {
    const { errors } = this.state;
    const errorKey = {
      txtUsername: 'username', txtPassword: 'password', txtConfirm: 'confirm',
      txtName: 'name', txtPhone: 'phone', txtEmail: 'email',
    }[field];
    return (
      <>
        <label>
          {label}:{' '}
          <input
            name={field.replace(/^txt/, '').toLowerCase()}
            type={type}
            value={this.state[field]}
            onChange={this.handleChange(field)}
            disabled={this.state.loading}
            required={field !== 'txtPhone'}
            aria-invalid={Boolean(errors[errorKey])}
            aria-describedby={errors[errorKey] ? `signup-${errorKey}-error` : undefined}
            {...extra}
          />
        </label>
        {errors[errorKey] && (
          <span id={`signup-${errorKey}-error`} role="alert" className="field-error">
            {errors[errorKey]}
          </span>
        )}
        <br />
      </>
    );
  }

  renderPasswordField(label, field) {
    const errorKey = field === 'txtPassword' ? 'password' : 'confirm';
    const name = field === 'txtPassword' ? 'password' : 'password-confirm';
    return (
      <>
        <label>
          {label}:{' '}
          <PasswordInput
            name={name}
            value={this.state[field]}
            onChange={this.handleChange(field)}
            disabled={this.state.loading}
            autoComplete="new-password"
            required
            aria-invalid={Boolean(this.state.errors[errorKey])}
            aria-describedby={this.state.errors[errorKey] ? `signup-${errorKey}-error` : undefined}
          />
        </label>
        {this.state.errors[errorKey] && (
          <span id={`signup-${errorKey}-error`} role="alert" className="field-error">
            {this.state.errors[errorKey]}
          </span>
        )}
        <br />
      </>
    );
  }

  render() {
    const { loading, success, successMessage, errors } = this.state;

    if (success) {
      return (
        <main className="customer-content auth-page">
          <section className="glass result-panel auth-result" role="status">
            <h2 className="auth-form-title">ĐĂNG KÝ</h2>
            <p className="result-title">Đăng ký thành công!</p>
            <p>{successMessage}</p>
            <button
              type="button"
              className="btn btn-primary auth-submit"
              onClick={() => this.props.navigate('/active')}
            >
              Đến trang kích hoạt
            </button>
          </section>
        </main>
      );
    }

    return (
      <main className="customer-content auth-page">
        <form className="auth-form" onSubmit={this.btnSignupClick} noValidate>
          <h2 className="auth-form-title">ĐĂNG KÝ</h2>
          {this.renderField('Tên đăng nhập', 'txtUsername')}
          {this.renderPasswordField('Mật khẩu', 'txtPassword')}
          {this.renderPasswordField('Nhập lại mật khẩu', 'txtConfirm')}
          {this.renderField('Họ và tên', 'txtName')}
          {this.renderField('Số điện thoại', 'txtPhone')}
          {this.renderField('Email', 'txtEmail', 'email')}
          {errors._server && (
            <p role="alert" className="field-error signup-server-error">{errors._server}</p>
          )}
          <button className="btn btn-primary auth-submit" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
          <p className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
        </form>
      </main>
    );
  }
}

export default withRouter(Signup);
