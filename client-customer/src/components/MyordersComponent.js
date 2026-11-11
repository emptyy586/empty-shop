import { Component } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import getImageSrc from '../utils/getImageSrc';
import MyContext from '../contexts/MyContext';
import Loading from './ui/Loading';
import EmptyState from './ui/EmptyState';
import ErrorState from './ui/ErrorState';
import withRouter from '../utils/withRouter';
import formatMoney from '../utils/formatMoney';

const STATUS_LABEL = {
  PENDING:  { text: 'Chờ duyệt', className: 'status-pending' },
  APPROVED: { text: 'Đã duyệt', className: 'status-approved' },
  CANCELED: { text: 'Đã hủy', className: 'status-canceled' },
};

function StatusBadge({ status }) {
  const info = STATUS_LABEL[status] || { text: status, className: '' };
  return (
    <span
      className={`status-badge ${info.className}`}
    >
      {info.text}
    </span>
  );
}

class Myorders extends Component {
  static contextType = MyContext;

  state = { orders: [], selectedOrder: null, loading: true, error: '' };

  componentDidMount() {
    const { token, customer } = this.context;
    if (token !== '' && customer) this.apiGetOrders(customer._id, token);
    else this.setState({ loading: false });
  }

  apiGetOrders = async (customerId, token) => {
    this.setState({ loading: true, error: '' });
    try {
      const result = await axios.get(
        '/api/customer/orders/customer/' + customerId,
        { headers: { 'x-access-token': token } }
      );
      if (Array.isArray(result.data)) {
        this.setState({ orders: result.data, loading: false });
      } else {
        this.setState({ error: 'Không thể tải đơn hàng.', loading: false });
      }
    } catch (error) {
      this.setState({ error: 'Không thể tải đơn hàng.', loading: false });
    }
  };

  render() {
    if (this.context.token === '') return <Navigate replace to="/login" />;

    const { orders, selectedOrder, loading, error } = this.state;
    const { customer, token } = this.context;

    return (
      <main className="customer-content">
        <h2 className="text-center">LỊCH SỬ ĐƠN HÀNG</h2>

        {loading && <Loading fullPage />}

        {!loading && error && (
          <ErrorState
            message={error}
            onRetry={() => customer && this.apiGetOrders(customer._id, token)}
          />
        )}

        {!loading && !error && orders.length === 0 && (
          <EmptyState
            title="Chưa có đơn hàng"
            message="Bạn chưa đặt hàng nào. Hãy mua sắm ngay!"
            action="Mua sắm ngay"
            onAction={() => this.props.navigate('/home')}
          />
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="table-scroll"><table className="datatable">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Ngày tạo</th>
                <th>Khách hàng</th>
                <th>Điện thoại</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {(orders || []).map((order) => order && (
                <tr
                  key={order._id}
                  className={selectedOrder?._id === order._id ? 'is-selected' : ''}
                >
                  <td>{order._id}</td>
                  <td>{new Date(order.cdate).toLocaleString('vi-VN')}</td>
                  <td>{order.customer && order.customer.name}</td>
                  <td>{order.customer && order.customer.phone}</td>
                  <td>{formatMoney(order.total)}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td><button type="button" className="btn btn-glass btn-small" onClick={() => this.setState({ selectedOrder: order })}>Xem chi tiết</button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}

        {selectedOrder && (
          <>
            <h2 className="text-center order-detail-title">CHI TIẾT ĐƠN HÀNG</h2>
            <p className="order-detail-summary">
              Mã đơn: <strong>{selectedOrder._id}</strong>
              {' — '}Trạng thái: <StatusBadge status={selectedOrder.status} />
            </p>
            <div className="table-scroll"><table className="datatable">
              <thead>
                <tr>
                  <th>#</th><th>Mã sản phẩm</th><th>Sản phẩm</th><th>Ảnh</th>
                  <th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {(selectedOrder.items || []).map((item, index) => item?.product && (
                  <tr key={item.product._id || index}>
                    <td>{index + 1}</td>
                    <td>{item.product._id}</td>
                    <td>{item.product.name}</td>
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
                    <td>{item.quantity}</td>
                    <td>{formatMoney(Number(item.product.price || 0) * Number(item.quantity || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </>
        )}
      </main>
    );
  }
}

export default withRouter(Myorders);
