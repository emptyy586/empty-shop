import { Component } from 'react';
import axios from 'axios';
import withRouter from '../utils/withRouter';
import Loading from './ui/Loading';

// status: 'idle' | 'loading' | 'success' | 'error'
class Active extends Component {
  state = {
    txtId: '',
    txtToken: '',
    status: 'idle',
    message: '',
  };

  componentDidMount() {
    const params = new URLSearchParams(window.location.search);
    const id    = params.get('id')    || '';
    const token = params.get('token') || '';
    if (/^[a-f\d]{24}$/i.test(id) && /^(?:[a-f\d]{32}|[a-f\d]{64})$/i.test(token)) {
      this.setState({ txtId: id, txtToken: token });
      this.apiActive(id, token);
    } else if (id || token) {
      this.setState({ txtId: id, txtToken: token });
    }
  }

  apiActive = async (id, token) => {
    if (this._activationPending) return;
    this._activationPending = true;
    this.setState({ status: 'loading', message: '' });
    try {
      const result = await axios.post('/api/customer/active', { id, token });
      if (result.data && result.data._id) {
        this.setState({ status: 'success', message: 'Tài khoản đã được kích hoạt thành công!' });
      } else {
        this.setState({ status: 'error', message: result.data?.message || 'Kích hoạt thất bại. Link có thể đã hết hạn.' });
      }
    } catch (error) {
      this.setState({ status: 'error', message: error.response?.data?.message || 'Kích hoạt thất bại. Vui lòng thử lại.' });
    } finally {
      this._activationPending = false;
    }
  };

  btnActiveClick = (event) => {
    event.preventDefault();
    this.apiActive(this.state.txtId, this.state.txtToken);
  };

  render() {
    const { txtId, txtToken, status, message } = this.state;

    return (
      <main className="customer-content auth-page">
        {status === 'loading' && (
          <section className="glass auth-result">
            <h2 className="auth-form-title">KÍCH HOẠT TÀI KHOẢN</h2>
            <Loading text="Đang xử lý kích hoạt..." />
          </section>
        )}

        {status === 'success' && (
          <section className="glass result-panel auth-result" role="status">
            <h2 className="auth-form-title">KÍCH HOẠT TÀI KHOẢN</h2>
            <p className="result-title">
              {message}
            </p>
            <button className="btn btn-primary auth-submit" type="button" onClick={() => this.props.navigate('/login')}>
              Đăng nhập
            </button>
          </section>
        )}

        {status === 'error' && (
          <section className="glass result-panel auth-result" role="alert">
            <h2 className="auth-form-title">KÍCH HOẠT TÀI KHOẢN</h2>
            <p className="result-title">
              {message}
            </p>
            <button className="btn btn-glass auth-submit" type="button" onClick={() => this.apiActive(txtId, txtToken)}>
              Thử lại
            </button>
          </section>
        )}

        {status === 'idle' && (
          <form className="auth-form" onSubmit={this.btnActiveClick}>
            <h2 className="auth-form-title">KÍCH HOẠT TÀI KHOẢN</h2>
            <label>
              Mã khách hàng:{' '}
              <input
                type="text"
                name="id"
                required
                value={txtId}
                onChange={(e) => this.setState({ txtId: e.target.value })}
              />
            </label>
            <br />
            <label>
              Mã kích hoạt:{' '}
              <input
                type="text"
                name="token"
                required
                value={txtToken}
                onChange={(e) => this.setState({ txtToken: e.target.value })}
              />
            </label>
            <br />
            <button className="btn btn-primary auth-submit" type="submit">Kích hoạt</button>
          </form>
        )}
      </main>
    );
  }
}

export default withRouter(Active);
