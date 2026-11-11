import React, { Component } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';
import ProductCard from './ui/ProductCard';
import ProductGridSkeleton from './ui/ProductGridSkeleton';
import apiErrorMessage from '../utils/apiErrorMessage';
import withRouter from '../utils/withRouter';

export const BESTSELLER_LIMIT = 12;

class Bestsellers extends Component {
  state = { products: [], loading: true, error: '' };

  componentDidMount() {
    this.loadProducts();
  }

  loadProducts = async () => {
    this.setState({ loading: true, error: '' });
    try {
      const response = await axios.get('/api/customer/products/hot', {
        params: { limit: BESTSELLER_LIMIT },
      });
      if (!Array.isArray(response.data)) throw new Error('Dữ liệu bán chạy không hợp lệ.');
      this.setState({ products: response.data, loading: false });
    } catch (error) {
      this.setState({
        error: error.response || error.request ? apiErrorMessage(error) : error.message || 'Không thể tải sản phẩm bán chạy.',
        loading: false,
      });
    }
  };

  render() {
    const { products, loading, error } = this.state;
    return (
      <main className="customer-content bestseller-page">
        <p className="eyebrow">ĐƯỢC KHÁCH HÀNG LỰA CHỌN</p>
        <h1>Bán chạy nhất</h1>
        {loading && <ProductGridSkeleton />}
        {!loading && error && <ErrorState message={error} onRetry={this.loadProducts} />}
        {!loading && !error && products.length === 0 && (
          <EmptyState title="Chưa có dữ liệu bán hàng" message="Sản phẩm bán chạy sẽ xuất hiện khi có đơn hàng được duyệt." action="Khám phá sản phẩm" onAction={() => this.props.navigate('/products')} />
        )}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="bestseller-top">
              {products.slice(0, 3).map((product, index) => (
                <ProductCard key={product._id} product={product} rank={index + 1} sold={product.sold} featured />
              ))}
            </div>
            {products.length > 3 && (
              <section className="bestseller-rest">
                <h2>Các sản phẩm được yêu thích</h2>
                <div className="product-list">
                  {products.slice(3).map((product, index) => (
                    <ProductCard key={product._id} product={product} index={index + 1} rank={index + 4} sold={product.sold} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
        <div className="bestseller-cta"><Link className="btn btn-glass" to="/products">Xem tất cả sản phẩm</Link></div>
      </main>
    );
  }
}

export default withRouter(Bestsellers);
