import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import ConfirmDialog from './ui/ConfirmDialog';
import Loading from './ui/Loading';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';
import formatMoney from '../utils/formatMoney';

const PAGE_SIZE = 8;
const ORDER_STATUS = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', CANCELED: 'Đã hủy' };

class CustomerComponent extends Component {
  static contextType = MyContext;

  state = {
    customers: [], orders: [], order: null, selectedCustomer: null,
    loading: true, error: '', ordersLoading: false, ordersError: '',
    search: '', activeFilter: '', page: 1, confirmCustomer: null, busyId: '',
  };

  componentDidMount() {
    this.apiGetCustomers();
  }

  getConfig = () => ({ headers: { 'x-access-token': this.context.token } });

  apiGetCustomers = async () => {
    this.setState({ loading: true, error: '' });
    try {
      const res = await axios.get('/api/admin/customers', this.getConfig());
      if (!Array.isArray(res.data)) throw new Error(res.data?.message || 'Không thể tải khách hàng.');
      this.setState({ customers: res.data, loading: false });
    } catch (error) {
      this.setState({ error: error.response?.data?.message || error.message || 'Không thể tải khách hàng.', loading: false });
    }
  };

  apiGetOrdersByCustomer = async (id) => {
    this.setState({ orders: [], order: null, ordersLoading: true, ordersError: '' });
    try {
      const res = await axios.get(`/api/admin/orders/customer/${id}`, this.getConfig());
      if (!Array.isArray(res.data)) throw new Error(res.data?.message || 'Không thể tải đơn hàng của khách.');
      this.setState({ orders: res.data, ordersLoading: false });
    } catch (error) {
      this.setState({ ordersError: error.response?.data?.message || error.message || 'Không thể tải đơn hàng của khách.', ordersLoading: false });
    }
  };

  deactivateCustomer = async () => {
    const customer = this.state.confirmCustomer;
    if (!customer || this.state.busyId) return;
    this.setState({ busyId: customer._id, confirmCustomer: null });
    try {
      const res = await axios.put(`/api/admin/customers/deactive/${customer._id}`, { token: customer.token }, this.getConfig());
      if (!res.data || res.data.success === false) throw new Error(res.data?.message || 'Không thể vô hiệu hóa tài khoản.');
      this.setState((current) => ({
        customers: current.customers.map((item) => item._id === customer._id ? { ...item, active: 0 } : item),
        busyId: '',
      }));
      this.context.showToast('Đã vô hiệu hóa tài khoản khách hàng.', 'success');
    } catch (error) {
      this.setState({ busyId: '' });
      this.context.showToast(error.response?.data?.message || error.message || 'Không thể vô hiệu hóa tài khoản.', 'error');
    }
  };

  resendActivation = async (id) => {
    if (this.state.busyId) return;
    this.setState({ busyId: id });
    try {
      const res = await axios.get(`/api/admin/customers/sendmail/${id}`, this.getConfig());
      if (!res.data || res.data.success === false) throw new Error(res.data?.message || 'Không thể gửi email kích hoạt.');
      this.context.showToast(res.data.message || 'Đã gửi lại email kích hoạt.', 'success');
    } catch (error) {
      this.context.showToast(error.response?.data?.message || error.message || 'Không thể gửi lại email kích hoạt.', 'error');
    } finally {
      this.setState({ busyId: '' });
    }
  };

  selectCustomer = (customer) => {
    this.setState({ selectedCustomer: customer });
    this.apiGetOrdersByCustomer(customer._id);
  };

  render() {
    const { customers, orders, order, selectedCustomer, loading, error, ordersLoading, ordersError, search, activeFilter, page, confirmCustomer, busyId } = this.state;
    const filtered = customers.filter((item) =>
      (!activeFilter || String(item.active) === activeFilter) &&
      `${item.username || ''} ${item.name || ''} ${item.email || ''} ${item.phone || ''}`.toLowerCase().includes(search.toLowerCase())
    );
    const pages = Math.ceil(filtered.length / PAGE_SIZE);
    const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return (
      <div className="admin-page">
        <section className="glass">
          <h2 className="text-center">KHÁCH HÀNG</h2>
          <div className="list-toolbar">
            <label htmlFor="customer-search" className="sr-only">Tìm khách hàng</label>
            <input id="customer-search" type="search" placeholder="Tìm tên, email, số điện thoại..." value={search}
              onChange={(event) => this.setState({ search: event.target.value, page: 1 })} />
            <label htmlFor="customer-active" className="sr-only">Lọc trạng thái tài khoản</label>
            <select id="customer-active" value={activeFilter} onChange={(event) => this.setState({ activeFilter: event.target.value, page: 1 })}>
              <option value="">Tất cả tài khoản</option><option value="1">Đã kích hoạt</option><option value="0">Chưa kích hoạt</option>
            </select>
            <span className="list-count">{filtered.length} khách hàng</span>
          </div>
          {loading && <Loading text="Đang tải khách hàng..." />}
          {!loading && error && <ErrorState message={error} onRetry={this.apiGetCustomers} />}
          {!loading && !error && filtered.length === 0 && <EmptyState title="Không có khách hàng" message="Thay đổi bộ lọc hoặc chờ khách hàng đăng ký." />}
          {!loading && !error && visible.length > 0 && <div className="table-scroll">
            <table className="table-bordered"><thead><tr><th>Tên đăng nhập</th><th>Khách hàng</th><th>Điện thoại</th><th>Email</th><th>Tài khoản</th><th>Thao tác</th></tr></thead>
              <tbody>{visible.map((item) => <tr key={item._id} onClick={() => this.selectCustomer(item)} tabIndex="0"
                onKeyDown={(event) => event.key === 'Enter' && this.selectCustomer(item)}>
                <td>{item.username}</td><td>{item.name}</td><td>{item.phone || '—'}</td><td>{item.email}</td>
                <td><span className={`status-badge ${item.active === 1 ? 'status-approved' : 'status-pending'}`}>{item.active === 1 ? 'Đã kích hoạt' : 'Chưa kích hoạt'}</span></td>
                <td>{item.active === 0
                  ? <button className="btn btn-small btn-glass" type="button" disabled={busyId === item._id}
                      onClick={(event) => { event.stopPropagation(); this.resendActivation(item._id); }}>{busyId === item._id ? 'Đang gửi...' : 'Gửi lại email kích hoạt'}</button>
                  : <button className="btn btn-small btn-glass" type="button" disabled={!!busyId}
                      onClick={(event) => { event.stopPropagation(); this.setState({ confirmCustomer: item }); }}>Vô hiệu hóa</button>}
                </td>
              </tr>)}</tbody>
            </table>
          </div>}
          {pages > 1 && <div className="pagination">
            <button type="button" className="btn btn-glass" disabled={page <= 1} onClick={() => this.setState({ page: page - 1 })}>Trước</button>
            <span>Trang {page} / {pages}</span>
            <button type="button" className="btn btn-glass" disabled={page >= pages} onClick={() => this.setState({ page: page + 1 })}>Sau</button>
          </div>}
        </section>
        {selectedCustomer && <section className="glass order-detail">
          <div className="section-heading"><h2>ĐƠN HÀNG · {selectedCustomer.name}</h2>
            <button type="button" className="btn btn-glass" onClick={() => this.setState({ selectedCustomer: null, orders: [], order: null })}>Đóng</button></div>
          {ordersLoading && <Loading text="Đang tải đơn hàng..." />}
          {!ordersLoading && ordersError && <ErrorState message={ordersError} onRetry={() => this.apiGetOrdersByCustomer(selectedCustomer._id)} />}
          {!ordersLoading && !ordersError && orders.length === 0 && <EmptyState title="Khách hàng chưa có đơn hàng" />}
          {!ordersLoading && !ordersError && orders.length > 0 && <div className="table-scroll"><table className="table-bordered">
            <thead><tr><th>Mã đơn</th><th>Ngày tạo</th><th>Tổng tiền</th><th>Trạng thái</th><th>Chi tiết</th></tr></thead>
            <tbody>{orders.map((item) => <tr key={item._id}><td>{item._id}</td><td>{new Date(item.cdate).toLocaleDateString('vi-VN')}</td>
              <td>{formatMoney(item.total)}</td>
              <td><span className={`status-badge status-${(item.status || '').toLowerCase()}`}>{ORDER_STATUS[item.status] || item.status}</span></td>
              <td><button className="btn btn-small btn-glass" type="button" onClick={() => this.setState({ order: item })}>Xem</button></td>
            </tr>)}</tbody>
          </table></div>}
          {order && <div className="table-scroll order-detail-inner"><h3>Chi tiết đơn {order._id}</h3>
            <table className="table-bordered"><thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Thành tiền</th></tr></thead>
              <tbody>{(order.items || []).map((item, index) => <tr key={item?.product?._id || index}>
                <td>{item?.product?.name || 'Sản phẩm không còn tồn tại'}</td><td>{item?.quantity}</td>
                <td>{formatMoney(Number(item?.product?.price || 0) * Number(item?.quantity || 0))}</td>
              </tr>)}</tbody></table>
          </div>}
        </section>}
        <ConfirmDialog open={!!confirmCustomer} title="Vô hiệu hóa tài khoản"
          message={`Bạn có chắc muốn vô hiệu hóa tài khoản "${confirmCustomer?.username}"?`}
          confirmLabel="Vô hiệu hóa" danger onConfirm={this.deactivateCustomer}
          onCancel={() => this.setState({ confirmCustomer: null })} />
      </div>
    );
  }
}

export default CustomerComponent;
