import React, { Component } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import Loading from './ui/Loading';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';
import formatMoney from '../utils/formatMoney';
import CountUp from './ui/CountUp';

class HomeComponent extends Component {
  static contextType = MyContext;

  state = { loading: true, error: '', orders: [], productsCount: 0, customersCount: 0 };

  componentDidMount() {
    this.loadDashboard();
  }

  loadDashboard = async () => {
    this.setState({ loading: true, error: '' });
    const config = { headers: { 'x-access-token': this.context.token } };
    try {
      const [ordersRes, customersRes, firstProductsRes] = await Promise.all([
        axios.get('/api/admin/orders', config),
        axios.get('/api/admin/customers', config),
        axios.get('/api/admin/products', { ...config, params: { page: 1 } }),
      ]);
      if (!Array.isArray(ordersRes.data) || !Array.isArray(customersRes.data) ||
        !Array.isArray(firstProductsRes.data?.products)) {
        throw new Error('Không thể tải dữ liệu tổng quan.');
      }
      const productPages = Number(firstProductsRes.data.noPages) || 0;
      const restPages = await Promise.all(
        Array.from({ length: Math.max(0, productPages - 1) }, (_, index) =>
          axios.get('/api/admin/products', { ...config, params: { page: index + 2 } })
        )
      );
      const productData = restPages.flatMap((response) =>
        Array.isArray(response.data?.products) ? response.data.products : []
      );
      if (restPages.some((response) => response.data?.success === false || !Array.isArray(response.data?.products))) {
        throw new Error('Không thể tải toàn bộ sản phẩm.');
      }
      const orders = [...ordersRes.data].sort((a, b) => new Date(b.cdate) - new Date(a.cdate));
      this.setState({
        orders, customersCount: customersRes.data.length,
        productsCount: firstProductsRes.data.products.length + productData.length,
        loading: false,
      });
    } catch (error) {
      this.setState({ error: error.response?.data?.message || error.message || 'Không thể tải dữ liệu tổng quan.', loading: false });
    }
  };

  render() {
    const { loading, error, orders, productsCount, customersCount } = this.state;
    const pending = orders.filter((order) => order.status === 'PENDING').length;
    return (
      <main className="admin-page">
        <h1 className="admin-page-title">Tổng quan</h1>
        {loading && <Loading text="Đang tải dữ liệu tổng quan..." />}
        {!loading && error && <ErrorState message={error} onRetry={this.loadDashboard} />}
        {!loading && !error && <>
          <section className="dashboard-stats" aria-label="Thống kê cửa hàng">
            <article className="glass stat-card"><span>Đơn chờ duyệt</span><strong><CountUp value={pending} /></strong><Link to="/admin/order">Xem đơn hàng</Link></article>
            <article className="glass stat-card"><span>Tổng đơn hàng</span><strong><CountUp value={orders.length} /></strong><Link to="/admin/order">Quản lý đơn</Link></article>
            <article className="glass stat-card"><span>Sản phẩm</span><strong><CountUp value={productsCount} /></strong><Link to="/admin/product">Quản lý sản phẩm</Link></article>
            <article className="glass stat-card"><span>Khách hàng</span><strong><CountUp value={customersCount} /></strong><Link to="/admin/customer">Quản lý khách hàng</Link></article>
          </section>
          <section className="glass dashboard-recent">
            <h2>Đơn hàng gần đây</h2>
            {orders.length === 0 ? <EmptyState title="Chưa có đơn hàng" message="Đơn hàng mới sẽ xuất hiện tại đây." /> : (
              <div className="table-scroll"><table className="table-bordered"><thead><tr><th>Mã đơn</th><th>Ngày tạo</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
                <tbody>{orders.slice(0, 5).map((order) => <tr key={order._id}>
                  <td>{order._id}</td><td>{new Date(order.cdate).toLocaleDateString('vi-VN')}</td>
                  <td>{order.customer?.name || '—'}</td><td>{formatMoney(order.total)}</td>
                  <td><span className={`status-badge status-${(order.status || '').toLowerCase()}`}>
                    {{ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', CANCELED: 'Đã hủy' }[order.status] || order.status}
                  </span></td>
                </tr>)}</tbody>
              </table></div>
            )}
          </section>
        </>}
      </main>
    );
  }
}

export default HomeComponent;
