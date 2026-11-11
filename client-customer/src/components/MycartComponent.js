import { Component } from 'react';
import axios from 'axios';
import withRouter from '../utils/withRouter';
import getImageSrc from '../utils/getImageSrc';
import { getTotal } from '../utils/CartUtil';
import formatMoney from '../utils/formatMoney';
import MyContext from '../contexts/MyContext';
import ConfirmDialog from './ui/ConfirmDialog';
import EmptyState from './ui/EmptyState';

class Mycart extends Component {
  static contextType = MyContext;

  state = {
    confirmRemove: null,  // product._id cần xóa
    confirmCheckout: false,
    checkingOut: false,
    completedOrderId: '',
  };

  // ── Remove item ──────────────────────────────────────────────────────────
  askRemove = (id) => this.setState({ confirmRemove: id });
  cancelRemove = () => this.setState({ confirmRemove: null });
  doRemove = () => {
    const id = this.state.confirmRemove;
    const mycart = this.context.mycart.filter((item) => item.product._id !== id);
    this.context.setMycart(mycart);
    this.context.showToast('Đã xóa sản phẩm khỏi giỏ hàng.', 'info');
    this.setState({ confirmRemove: null });
  };

  // ── Quantity change ──────────────────────────────────────────────────────
  handleQtyChange = (productId, newQty) => {
    const qty = Math.max(1, Math.min(99, Number(newQty) || 1));
    const mycart = this.context.mycart.map((item) =>
      item.product._id === productId ? { ...item, quantity: qty } : item
    );
    this.context.setMycart(mycart);
  };

  // ── Checkout ─────────────────────────────────────────────────────────────
  askCheckout = () => {
    const { mycart, customer } = this.context;
    if (mycart.length === 0) return;
    if (!customer) {
      this.props.navigate('/login', { state: { from: '/mycart' } });
      return;
    }
    this.setState({ confirmCheckout: true });
  };

  cancelCheckout = () => this.setState({ confirmCheckout: false });

  doCheckout = async () => {
    if (this._checkoutPending || this.state.checkingOut || !this.context.mycart.length) return;
    this._checkoutPending = true;
    this.setState({ confirmCheckout: false, checkingOut: true });
    const { mycart, customer, token } = this.context;
    try {
      const result = await axios.post(
        '/api/customer/checkout',
        { total: getTotal(mycart), items: mycart, customer },
        { headers: { 'x-access-token': token } }
      );
      if (result.data && result.data._id) {
        this.context.setMycart([]);
        this.setState({ completedOrderId: result.data._id });
        this.context.showToast('Đặt hàng thành công!', 'success');
      } else {
        this.context.showToast('Đặt hàng thất bại. Vui lòng thử lại.', 'error');
      }
    } catch (error) {
      this.context.showToast(error.response?.data?.message || 'Đặt hàng thất bại.', 'error');
    } finally {
      this._checkoutPending = false;
      this.setState({ checkingOut: false });
    }
  };

  render() {
    const { mycart } = this.context;
    const cartItems  = Array.isArray(mycart) ? mycart : [];
    const { confirmRemove, confirmCheckout, checkingOut } = this.state;

    const displayTotal = cartItems.reduce(
      (total, item) =>
        total + Number(item?.product?.price || 0) * Number(item?.quantity || 0),
      0
    );

    // Find product name for confirm dialog
    const removeItem = confirmRemove
      ? cartItems.find((i) => i.product._id === confirmRemove)
      : null;

    return (
      <main className="customer-content">
        {this.state.completedOrderId ? (
          <section className="glass checkout-success" role="status">
            <h1>Đặt hàng thành công!</h1>
            <p>Cảm ơn bạn đã mua sắm tại EMPTY SHOP.</p>
            <p>Mã đơn hàng: <strong>{this.state.completedOrderId}</strong></p>
            <div className="checkout-success-actions">
              <button type="button" className="btn btn-primary" onClick={() => this.props.navigate('/myorders')}>Xem đơn hàng</button>
              <button type="button" className="btn btn-glass" onClick={() => this.props.navigate('/home')}>Tiếp tục mua sắm</button>
            </div>
          </section>
        ) : <>
        <h2 className="text-center">GIỎ HÀNG</h2>

        {cartItems.length === 0 ? (
          <EmptyState
            title="Giỏ hàng trống"
            message="Bạn chưa có sản phẩm nào trong giỏ hàng."
            action="Tiếp tục mua sắm"
            onAction={() => this.props.navigate('/home')}
          />
        ) : (
          <>
            <div className="table-scroll"><table className="datatable">
              <thead>
                <tr>
                  <th>#</th><th>Mã</th><th>Sản phẩm</th><th>Danh mục</th><th>Ảnh</th>
                  <th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item, index) => item?.product && (
                  <tr key={item.product._id}>
                    <td>{index + 1}</td>
                    <td>{item.product._id}</td>
                    <td>{item.product.name}</td>
                    <td>{item.product.category?.name}</td>
                    <td>
                      {item.product.image && (
                        <img
                          loading="lazy"
                          src={getImageSrc(item.product.image)}
                          alt={item.product.name || ''}
                          width="70" height="70"
                        />
                      )}
                    </td>
                    <td>{formatMoney(item.product.price)}</td>
                    <td>
                      <div className="quantity-control">
                        <button
                          type="button"
                          onClick={() => this.handleQtyChange(item.product._id, item.quantity - 1)}
                          aria-label={`Giảm số lượng ${item.product.name}`}
                          className="btn btn-glass btn-small"
                        >−</button>
                        <input
                          type="number"
                          min="1" max="99"
                          value={item.quantity}
                          onChange={(e) => this.handleQtyChange(item.product._id, e.target.value)}
                          aria-label={`Số lượng ${item.product.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => this.handleQtyChange(item.product._id, item.quantity + 1)}
                          aria-label={`Tăng số lượng ${item.product.name}`}
                          className="btn btn-glass btn-small"
                        >+</button>
                      </div>
                    </td>
                    <td>{formatMoney(Number(item.product.price || 0) * Number(item.quantity || 0))}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => this.askRemove(item.product._id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="7"><strong>Tổng cộng</strong></td>
                  <td><strong>{formatMoney(displayTotal)}</strong></td>
                  <td />
                </tr>
              </tbody>
            </table></div>

            <button
              type="button"
              onClick={this.askCheckout}
              disabled={checkingOut}
              aria-busy={checkingOut}
              className="btn btn-primary"
            >
              {checkingOut ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
          </>
        )}

        {/* Confirm remove */}
        <ConfirmDialog
          open={!!confirmRemove}
          title="Xóa sản phẩm"
          message={`Bạn có chắc muốn xóa "${removeItem?.product?.name || ''}" khỏi giỏ hàng?`}
          confirmLabel="Xóa"
          danger
          onConfirm={this.doRemove}
          onCancel={this.cancelRemove}
        />

        {/* Confirm checkout */}
        <ConfirmDialog
          open={confirmCheckout}
          title="Xác nhận đặt hàng"
          message={`Tổng tiền: ${formatMoney(displayTotal)}. Bạn có muốn đặt hàng không?`}
          confirmLabel="Đặt hàng"
          onConfirm={this.doCheckout}
          onCancel={this.cancelCheckout}
        />
        </>}
      </main>
    );
  }
}

export default withRouter(Mycart);
