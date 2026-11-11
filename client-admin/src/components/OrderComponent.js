import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import ConfirmDialog from './ui/ConfirmDialog';
import Loading from './ui/Loading';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';
import formatMoney from '../utils/formatMoney';

const PAGE_SIZE = 8;
const STATUS_TEXT = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', CANCELED: 'Đã hủy' };

class OrderComponent extends Component {
  static contextType = MyContext;

  state = { orders: [], order: null, loading: true, error: '', search: '', statusFilter: '', page: 1, busyId: '', cancelOrder: null };

  componentDidMount() {
    this.apiGetOrders();
  }

  apiGetOrders = async () => {
    this.setState({ loading: true, error: '' });
    try {
      const res = await axios.get('/api/admin/orders', {
        headers: { 'x-access-token': this.context.token },
      });
      if (!Array.isArray(res.data)) throw new Error(res.data?.message || 'Không thể tải đơn hàng.');
      this.setState({ orders: res.data, loading: false });
    } catch (error) {
      this.setState({ error: error.response?.data?.message || error.message || 'Không thể tải đơn hàng.', loading: false });
    }
  };

  apiPutOrderStatus = async (id, status) => {
    if (this.state.busyId) return;
    this.setState({ busyId: id, cancelOrder: null });
    try {
      const res = await axios.put(`/api/admin/orders/status/${id}`, { status }, {
        headers: { 'x-access-token': this.context.token },
      });
      if (!res.data || res.data.success === false) throw new Error(res.data?.message || 'Không thể cập nhật đơn hàng.');
      this.setState((current) => {
        const orders = current.orders.map((item) => item._id === id ? { ...item, status } : item);
        const order = current.order?._id === id ? { ...current.order, status } : current.order;
        return { orders, order, busyId: '' };
      });
      this.context.showToast(status === 'APPROVED' ? 'Đã duyệt đơn hàng.' : 'Đã hủy đơn hàng.', 'success');
    } catch (error) {
      this.context.showToast(error.response?.data?.message || error.message || 'Không thể cập nhật đơn hàng.', 'error');
      this.setState({ busyId: '' });
    }
  };

  render() {
    const { orders, order, loading, error, search, statusFilter, page, busyId, cancelOrder } = this.state;
    const filtered = orders.filter((item) =>
      (!statusFilter || item.status === statusFilter) &&
      `${item._id || ''} ${item.customer?.name || ''} ${item.customer?.phone || ''}`.toLowerCase().includes(search.toLowerCase())
    );
    const pages = Math.ceil(filtered.length / PAGE_SIZE);
    const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return (
      <div className="admin-page">
        <section className="glass">
          <h2 className="text-center">ĐƠN HÀNG</h2>
          <div className="list-toolbar">
            <label htmlFor="order-search" className="sr-only">Tìm đơn hàng</label>
            <input id="order-search" type="search" placeholder="Tìm mã đơn, khách hàng..." value={search}
              onChange={(event) => this.setState({ search: event.target.value, page: 1 })} />
            <label htmlFor="order-status" className="sr-only">Lọc trạng thái đơn hàng</label>
            <select id="order-status" value={statusFilter} onChange={(event) => this.setState({ statusFilter: event.target.value, page: 1 })}>
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="CANCELED">Đã hủy</option>
            </select>
            <span className="list-count">{filtered.length} đơn</span>
          </div>
          {loading && <Loading text="Đang tải đơn hàng..." />}
          {!loading && error && <ErrorState message={error} onRetry={this.apiGetOrders} />}
          {!loading && !error && filtered.length === 0 && <EmptyState title="Không có đơn hàng" message="Thay đổi bộ lọc hoặc chờ đơn hàng mới." />}
          {!loading && !error && visible.length > 0 && (
            <div className="table-scroll"><table className="table-bordered">
              <thead><tr><th>Mã đơn</th><th>Ngày tạo</th><th>Khách hàng</th><th>Điện thoại</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>{visible.map((item) => (
                <tr key={item._id} onClick={() => this.setState({ order: item })} tabIndex="0"
                  onKeyDown={(event) => event.key === 'Enter' && this.setState({ order: item })}>
                  <td>{item._id}</td><td>{new Date(item.cdate).toLocaleDateString('vi-VN')}</td>
                  <td>{item.customer?.name}</td><td>{item.customer?.phone}</td>
                  <td>{formatMoney(item.total)}</td>
                  <td><span className={`status-badge status-${(item.status || '').toLowerCase()}`}>{STATUS_TEXT[item.status] || item.status}</span></td>
                  <td>{item.status === 'PENDING' && <>
                    <button className="btn btn-small btn-primary" type="button" disabled={busyId === item._id}
                      onClick={(event) => { event.stopPropagation(); this.apiPutOrderStatus(item._id, 'APPROVED'); }}>Duyệt</button>
                    <button className="btn btn-small btn-glass" type="button" disabled={!!busyId}
                      onClick={(event) => { event.stopPropagation(); this.setState({ cancelOrder: item }); }}>Hủy</button>
                  </>}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
          {pages > 1 && <div className="pagination">
            <button type="button" className="btn btn-glass" disabled={page <= 1} onClick={() => this.setState({ page: page - 1 })}>Trước</button>
            <span>Trang {page} / {pages}</span>
            <button type="button" className="btn btn-glass" disabled={page >= pages} onClick={() => this.setState({ page: page + 1 })}>Sau</button>
          </div>}
        </section>
        {order && <section className="glass order-detail">
          <div className="section-heading">
            <h2>CHI TIẾT ĐƠN · {order._id}</h2>
            <button type="button" className="btn btn-glass" onClick={() => this.setState({ order: null })}>Đóng</button>
          </div>
          <p>Trạng thái: <span className={`status-badge status-${(order.status || '').toLowerCase()}`}>{STATUS_TEXT[order.status] || order.status}</span></p>
          <div className="table-scroll"><table className="table-bordered"><thead><tr><th>#</th><th>Sản phẩm</th><th>Ảnh</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th></tr></thead>
            <tbody>{(order.items || []).map((item, index) => {
              const product = item?.product;
              if (!product) return null;
              const image = product.image ? (product.image.startsWith('data:') ? product.image : `data:image/jpeg;base64,${product.image}`) : '';
              return <tr key={product._id || index}><td>{index + 1}</td><td>{product.name}</td>
                <td>{image && <img loading="lazy" src={image} alt={product.name || ''} className="table-product-image" />}</td>
                <td>{formatMoney(product.price)}</td><td>{item.quantity}</td>
                <td>{formatMoney(Number(product.price || 0) * Number(item.quantity || 0))}</td></tr>;
            })}</tbody></table></div>
        </section>}
        <ConfirmDialog open={!!cancelOrder} title="Hủy đơn hàng" message={`Bạn có chắc muốn hủy đơn ${cancelOrder?._id}?`}
          confirmLabel="Hủy đơn" danger onConfirm={() => this.apiPutOrderStatus(cancelOrder?._id, 'CANCELED')}
          onCancel={() => this.setState({ cancelOrder: null })} />
      </div>
    );
  }
}

export default OrderComponent;
