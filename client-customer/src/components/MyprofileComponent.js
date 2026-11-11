import { Component } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import withRouter from '../utils/withRouter';
import MyContext from '../contexts/MyContext';
import PasswordInput from './ui/PasswordInput';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class Myprofile extends Component {
  static contextType = MyContext;

  state = {
    txtUsername: '',
    txtPassword: '',
    txtName: '',
    txtPhone: '',
    txtEmail: '',
    loading: false,
    errors: {},
  };

  componentDidMount() {
    const customer = this.context.customer;
    if (!customer) return;
    this.setState({
      txtUsername: customer.username || '',
      txtPassword: customer.password || '',
      txtName:     customer.name     || '',
      txtPhone:    customer.phone    || '',
      txtEmail:    customer.email    || '',
    });
  }

  validate = () => {
    const { txtUsername, txtName, txtEmail, txtPhone, txtPassword } = this.state;
    const errors = {};
    if (!txtUsername.trim()) errors.username = 'Vui lòng nhập tên đăng nhập.';
    if (!txtName.trim())     errors.name     = 'Vui lòng nhập họ tên.';
    if (!EMAIL_RE.test(txtEmail)) errors.email = 'Email không hợp lệ.';
    if (txtPhone.trim() && !/^[0-9+().\-\s]{8,20}$/.test(txtPhone.trim())) errors.phone = 'Số điện thoại không hợp lệ.';
    if (!txtPassword) errors.password = 'Vui lòng nhập mật khẩu.';
    else if (txtPassword.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự.';
    return errors;
  };

  handleChange = (field) => (e) => {
    this.setState({ [field]: e.target.value }, () => {
      const errors = { ...this.state.errors };
      const key = field.replace(/^txt/, '').toLowerCase();
      const currentErrors = this.validate();
      if (currentErrors[key]) errors[key] = currentErrors[key];
      else delete errors[key];
      this.setState({ errors });
    });
  };

  btnUpdateClick = async (event) => {
    event.preventDefault();
    if (this._savePending || this.state.loading) return;
    const errors = this.validate();
    if (Object.keys(errors).length > 0) { this.setState({ errors }); return; }

    const customer = this.context.customer;
    if (!customer) return;
    this._savePending = true;
    this.setState({ loading: true });

    const updatedCustomer = {
      _id:      customer._id,
      username: this.state.txtUsername.trim(),
      password: this.state.txtPassword,
      name:     this.state.txtName.trim(),
      phone:    this.state.txtPhone.trim(),
      email:    this.state.txtEmail.trim(),
    };
    try {
      const result = await axios.put(
        '/api/customer/customers/' + customer._id,
        updatedCustomer,
        { headers: { 'x-access-token': this.context.token } }
      );
      if (!result.data || result.data.success === false) {
        this.context.showToast('Cập nhật thất bại.', 'error');
        this.setState({ loading: false });
        return;
      }
      this.context.setCustomer(result.data);
      this.context.showToast('Cập nhật hồ sơ thành công!', 'success');
      this.setState({ loading: false });
    } catch (error) {
      this.context.showToast(error.response?.data?.message || 'Cập nhật thất bại.', 'error');
      this.setState({ loading: false });
    } finally {
      this._savePending = false;
    }
  };

  renderField(label, field, type = 'text') {
    const { errors, loading } = this.state;
    const errorKey = field.replace(/^txt/, '').toLowerCase();
    return (
      <>
        <label>
          {label}:{' '}
          <input
            type={type}
            value={this.state[field]}
            onChange={this.handleChange(field)}
            disabled={loading}
          />
        </label>
        {errors[errorKey] && (
          <span role="alert" className="field-error">
            {errors[errorKey]}
          </span>
        )}
        <br />
      </>
    );
  }

  render() {
    if (this.context.token === '') return <Navigate replace to="/login" />;

    const { loading } = this.state;
    return (
      <main className="customer-content profile-page">
        <h2 className="text-center">HỒ SƠ CỦA TÔI</h2>
        <form onSubmit={this.btnUpdateClick} noValidate>
          {this.renderField('Tên đăng nhập', 'txtUsername')}
          <>
            <label>
              Mật khẩu:{' '}
              <PasswordInput
                name="password"
                value={this.state.txtPassword}
                onChange={this.handleChange('txtPassword')}
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </label>
            {this.state.errors.password && (
              <span role="alert" className="field-error">{this.state.errors.password}</span>
            )}
            <br />
          </>
          {this.renderField('Họ và tên', 'txtName')}
          {this.renderField('Số điện thoại', 'txtPhone')}
          {this.renderField('Email', 'txtEmail', 'email')}
          <button className="btn btn-primary auth-submit" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </main>
    );
  }
}

export default withRouter(Myprofile);
