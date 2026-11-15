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
    confirmRemove: null,
    showCheckoutForm: false,
    checkingOut: false,
    completedOrderId: '',
    // shipping form
    shipName: '',
    shipPhone: '',
    shipAddress: '',
    shipNote: '',
    shipErrors: {},
    shipServerError: '',
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

  // ── Phone normalisation ──────────────────────────────────────────────────
  normalizePhone = (raw = '') => {
    let p = String(raw).replace(/[\s\-.]/g, '');
    if (p.startsWith('+84')) p = '0' + p.slice(3);
    return p;
  };

  // ── Shipping form ────────────────────────────────────────────────────────
  askCheckout = () => {
    const { mycart, customer } = this.context;
    if (mycart.length === 0) return;
    if (!customer) {
      this.props.navigate('/login', { state: { from: '/mycart' } });
      return;
    }
    this.setState({
      showCheckoutForm: true,
      shipName: customer.name || '',
      shipPhone: customer.phone || '',
      shipAddress: '',
      shipNote: '',
      shipErrors: {},
      shipServerError: '',
    });
  };

  cancelCheckout = () => this.setState({ showCheckoutForm: false, shipErrors: {}, shipServerError: '' });

  handleShipChange = (field, value) => {
    this.setState({ [field]: value }, () => {
      const keyMap = { shipName: 'name', shipPhone: 'phone', shipAddress: 'address', shipNote: 'note' };
      const key = keyMap[field];
      if (!key) return;
      const all = this.validateShip();
      const errors = { ...this.state.shipErrors };
      if (all[key]) errors[key] = all[key];
      else delete errors[key];
      this.setState({ shipErrors: errors });
    });
  };

  validateShip = () => {
    const { shipName, shipPhone, shipAddress, shipNote } = this.state;
    const errors = {};
    if (!shipName.trim()) errors.name = 'Vui lòng nhập họ tên người nhận.';
    else if (shipName.trim().length > 100) errors.name = 'Họ tên tối đa 100 ký tự.';

    const p = this.normalizePhone(shipPhone);
    if (!p) errors.phone = 'Vui lòng nhập số điện thoại.';
    else if (!/^\d{9,11}$/.test(p)) errors.phone = 'Số điện thoại không hợp lệ (9–11 chữ số, có thể bắt đầu bằng +84).';

    if (!shipAddress.trim()) errors.address = 'Vui lòng nhập địa chỉ giao hàng.';
    else if (shipAddress.trim().length > 255) errors.address = 'Địa chỉ tối đa 255 ký tự.';

    if (shipNote.trim().length > 500) errors.note = 'Ghi chú tối đa 500 ký tự.';
    return errors;
  };

  doCheckout = async (e) => {
    if (e) e.preventDefault();
    if (this._checkoutPending || this.state.checkingOut || !this.context.mycart.length) return;

    const errors = this.validateShip();
    if (Object.keys(errors).length > 0) {
      this.setState({ shipErrors: errors });
      return;
    }

    this._checkoutPending = true;
    this.setState({ checkingOut: true, shipServerError: '' });
    const { mycart, customer, token } = this.context;
    const { shipName, shipPhone, shipAddress, shipNote } = this.state;
    try {
      const result = await axios.post(
        '/api/customer/checkout',
        {
          total: getTotal(mycart),
          items: mycart,
          customer,
          shippingInfo: {
            name:    shipName.trim(),
            phone:   this.normalizePhone(shipPhone),
            address: shipAddress.trim(),
            note:    shipNote.trim(),
          },
        },
        { headers: { 'x-access-token': token } }
      );
      if (result.data && result.data._id) {
        this.context.setMycart([]);
        this.setState({ completedOrderId: result.data._id, showCheckoutForm: false });
        this.context.showToast('Đặt hàng thành công!', 'success');
      } else {
        const msg = result.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.';
        this.setState({ shipServerError: msg });
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Đặt hàng thất bại.';
      this.setState({ shipServerError: msg });
    } finally {
      this._checkoutPending = false;
      this.setState({ checkingOut: false });
    }
  };

  render() {
    const { mycart } = this.context;
    const cartItems = Array.isArray(mycart) ? mycart : [];
    const { confirmRemove, showCheckoutForm, checkingOut,
            shipName, shipPhone, shipAddress, shipNote, shipErrors, shipServerError } = this.state;

    const displayTotal = cartItems.reduce(
      (total, item) => total + Number(item?.product?.price || 0) * Number(item?.quantity || 0),
      0
    );

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
                  <th>#</th><th className="cart-id-col">Mã</th><th>Sản phẩm</th><th>Danh mục</th><th>Ảnh</th>
                  <th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item, index) => item?.product && (
                  <tr key={item.product._id}>
                    <td>{index + 1}</td>
                    <td className="cart-id-col">{item.product._id}</td>
                    <td>{item.product.name}</td>
                    <td>{item.product.category?.name}</td>
                    <td>
                      {item.product.image && (
                        <img loading="lazy" src={getImageSrc(item.product.image)}
                          alt={item.product.name || ''} width="70" height="70" />
                      )}
                    </td>
                    <td>{formatMoney(item.product.price)}</td>
                    <td>
                      <div className="quantity-control">
                        <button type="button"
                          onClick={() => this.handleQtyChange(item.product._id, item.quantity - 1)}
                          aria-label={`Giảm số lượng ${item.product.name}`}
                          className="btn btn-glass btn-small">−</button>
                        <input type="number" min="1" max="99" value={item.quantity}
                          onChange={(e) => this.handleQtyChange(item.product._id, e.target.value)}
                          aria-label={`Số lượng ${item.product.name}`} />
                        <button type="button"
                          onClick={() => this.handleQtyChange(item.product._id, item.quantity + 1)}
                          aria-label={`Tăng số lượng ${item.product.name}`}
                          className="btn btn-glass btn-small">+</button>
                      </div>
                    </td>
                    <td>{formatMoney(Number(item.product.price || 0) * Number(item.quantity || 0))}</td>
                    <td>
                      <button type="button" className="cart-remove-btn"
                        onClick={() => this.askRemove(item.product._id)}>Xóa</button>
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

            <button type="button" onClick={this.askCheckout} disabled={checkingOut}
              aria-busy={checkingOut} className="btn btn-primary">
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

        {/* Checkout form modal */}
        {showCheckoutForm && (
          <div className="confirm-backdrop"
            onClick={(e) => e.target === e.currentTarget && !checkingOut && this.cancelCheckout()}
            role="presentation">
            <div className="checkout-modal glass" role="dialog" aria-modal="true"
              aria-labelledby="ship-modal-title">
              <h3 id="ship-modal-title">Thông tin giao hàng</h3>
              <p className="checkout-modal-total">
                Tổng tiền: <strong>{formatMoney(displayTotal)}</strong>
              </p>
              <form onSubmit={this.doCheckout} noValidate>
                <div className="checkout-field">
                  <label htmlFor="ship-name">Họ tên người nhận <span aria-hidden="true">*</span></label>
                  <input id="ship-name" type="text" value={shipName} maxLength={100}
                    disabled={checkingOut}
                    onChange={(e) => this.handleShipChange('shipName', e.target.value)} />
                  {shipErrors.name && <span className="field-error">{shipErrors.name}</span>}
                </div>
                <div className="checkout-field">
                  <label htmlFor="ship-phone">Số điện thoại <span aria-hidden="true">*</span></label>
                  <input id="ship-phone" type="tel" value={shipPhone}
                    disabled={checkingOut}
                    onChange={(e) => this.handleShipChange('shipPhone', e.target.value)} />
                  {shipErrors.phone && <span className="field-error">{shipErrors.phone}</span>}
                </div>
                <div className="checkout-field">
                  <label htmlFor="ship-address">Địa chỉ giao hàng <span aria-hidden="true">*</span></label>
                  <input id="ship-address" type="text" value={shipAddress} maxLength={255}
                    disabled={checkingOut}
                    onChange={(e) => this.handleShipChange('shipAddress', e.target.value)} />
                  {shipErrors.address && <span className="field-error">{shipErrors.address}</span>}
                </div>
                <div className="checkout-field">
                  <label htmlFor="ship-note">Ghi chú</label>
                  <input id="ship-note" type="text" value={shipNote} maxLength={500}
                    disabled={checkingOut} placeholder="Không bắt buộc"
                    onChange={(e) => this.handleShipChange('shipNote', e.target.value)} />
                  {shipErrors.note && <span className="field-error">{shipErrors.note}</span>}
                </div>
                {shipServerError && (
                  <p className="field-error checkout-server-error">{shipServerError}</p>
                )}
                <div className="confirm-actions">
                  <button type="button" className="btn btn-glass"
                    onClick={this.cancelCheckout} disabled={checkingOut}>Hủy</button>
                  <button type="submit" className="btn btn-primary"
                    disabled={checkingOut} aria-busy={checkingOut}>
                    {checkingOut ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </>}
      </main>
    );
  }
}

export default withRouter(Mycart);
