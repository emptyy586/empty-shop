import React, { Component } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import Loading from './ui/Loading';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';
import formatMoney from '../utils/formatMoney';
import CountUp from './ui/CountUp';

function buildDailyRevenue(approvedOrders) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const revenue = days.map(day => {
    const ds = day.toDateString();
    return approvedOrders
      .filter(o => new Date(o.cdate).toDateString() === ds)
      .reduce((s, o) => s + (Number(o.total) || 0), 0);
  });
  const labels = days.map(d =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  );
  return { revenue, labels };
}

function RevenueChart({ revenue }) {
  const W = 640, H = 220, PAD_T = 30, PAD_B = 20;
  const chartH = H - PAD_T - PAD_B;
  const maxV = Math.max(...revenue, 1);
  const pts = revenue.map((v, i) => ({
    x: (i / (revenue.length - 1)) * W,
    y: PAD_T + (1 - v / maxV) * chartH,
  }));
  const lineParts = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${lineParts} L${W},${H - PAD_B} L0,${H - PAD_B}Z`;
  const gridY = [0, 0.33, 0.67].map(f => PAD_T + f * chartH);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="av2-chart">
      <defs>
        <linearGradient id="av2gr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A91F4A" stopOpacity=".28" />
          <stop offset="1" stopColor="#A91F4A" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((y, i) => (
        <line key={i} x1="0" y1={y.toFixed(1)} x2={W} y2={y.toFixed(1)} stroke="#eee5e8" strokeWidth="1" />
      ))}
      <path d={areaPath} fill="url(#av2gr)" />
      <path d={lineParts} fill="none" stroke="#A91F4A" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

class HomeComponent extends Component {
  static contextType = MyContext;

  state = {
    loading: true, error: '',
    orders: [], productsCount: 0, customersCount: 0, allProducts: [],
  };

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
        Array.from({ length: Math.max(0, productPages - 1) }, (_, i) =>
          axios.get('/api/admin/products', { ...config, params: { page: i + 2 } })
        )
      );
      const allProducts = [
        ...firstProductsRes.data.products,
        ...restPages.flatMap(r => Array.isArray(r.data?.products) ? r.data.products : []),
      ];
      const orders = [...ordersRes.data].sort((a, b) => new Date(b.cdate) - new Date(a.cdate));
      this.setState({
        orders, customersCount: customersRes.data.length,
        productsCount: allProducts.length, allProducts, loading: false,
      });
    } catch (error) {
      this.setState({
        error: error.response?.data?.message || error.message || 'Không thể tải dữ liệu tổng quan.',
        loading: false,
      });
    }
  };

  render() {
    const { loading, error, orders, productsCount, customersCount, allProducts } = this.state;

    if (loading) return <main className="admin-page"><Loading text="Đang tải dữ liệu tổng quan..." /></main>;
    if (error)   return <main className="admin-page"><ErrorState message={error} onRetry={this.loadDashboard} /></main>;

    const approvedOrders = orders.filter(o => o.status === 'APPROVED');
    const totalRevenue = approvedOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);

    // Daily revenue chart
    const { revenue: dailyRevenue, labels: dayLabels } = buildDailyRevenue(approvedOrders);

    // Top 3 bestsellers from APPROVED orders
    const soldMap = {};
    approvedOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const id = String(item.product?._id || item.product || '');
        if (!id) return;
        soldMap[id] = (soldMap[id] || 0) + (Number(item.quantity) || 1);
      });
    });
    const topSellers = Object.entries(soldMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => {
        const p = allProducts.find(p => String(p._id) === id);
        return { name: p?.name || id, count };
      });

    return (
      <main className="admin-page">
        <div className="av2-page-header">
          <div>
            <h1>Tổng quan</h1>
            <p className="av2-page-sub">Chào mừng trở lại, {this.context.username || 'Admin'}</p>
          </div>
        </div>

        {/* 4 stat cards */}
        <section className="dashboard-stats" aria-label="Thống kê cửa hàng">
          <article className="stat-card">
            <span>Doanh thu (đơn đã duyệt)</span>
            <strong>{formatMoney(totalRevenue)}</strong>
            <Link to="/admin/order">Xem đơn hàng</Link>
          </article>
          <article className="stat-card">
            <span>Đơn hàng</span>
            <strong><CountUp value={orders.length} /></strong>
            <Link to="/admin/order">Quản lý đơn</Link>
          </article>
          <article className="stat-card">
            <span>Khách hàng</span>
            <strong><CountUp value={customersCount} /></strong>
            <Link to="/admin/customer">Quản lý khách</Link>
          </article>
          <article className="stat-card">
            <span>Sản phẩm</span>
            <strong><CountUp value={productsCount} /></strong>
            <Link to="/admin/product">Quản lý sản phẩm</Link>
          </article>
        </section>

        {/* Chart + bestsellers */}
        <div className="av2-dash-row2">
          <div className="av2-card">
            <h3>Doanh thu theo ngày</h3>
            <RevenueChart revenue={dailyRevenue} />
            <div className="av2-chart-labels">
              {dayLabels.map((l, i) => <span key={i}>{l}</span>)}
            </div>
          </div>
          <div className="av2-card">
            <h3>Bán chạy nhất</h3>
            {topSellers.length === 0
              ? <EmptyState title="Chưa có dữ liệu" message="Bán hàng để xem thống kê." />
              : topSellers.map((s, i) => (
                <div key={i} className="av2-best-row">
                  <b>{s.name}</b>
                  <span>{s.count} đã bán</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Recent orders */}
        <div className="av2-card av2-recent-orders">
          <h3>Đơn hàng gần đây</h3>
          {orders.length === 0
            ? <EmptyState title="Chưa có đơn hàng" message="Đơn hàng mới sẽ xuất hiện tại đây." />
            : (
              <div className="table-scroll">
                <table className="table-bordered">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Tổng</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => (
                      <tr key={order._id}>
                        <td style={{ fontWeight: 600 }}>#{String(order._id).slice(-6)}</td>
                        <td>{order.customer?.name || '—'}</td>
                        <td>{formatMoney(order.total)}</td>
                        <td>
                          <span className={`status-badge status-${(order.status || '').toLowerCase()}`}>
                            {{ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', CANCELED: 'Đã hủy' }[order.status] || order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </main>
    );
  }
}

export default HomeComponent;
