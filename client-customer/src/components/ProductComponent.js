import { Component } from 'react';
import axios from 'axios';
import withRouter from '../utils/withRouter';
import EmptyState from './ui/EmptyState';
import ErrorState from './ui/ErrorState';
import apiErrorMessage from '../utils/apiErrorMessage';
import ProductCard from './ui/ProductCard';
import ProductGridSkeleton from './ui/ProductGridSkeleton';

class Product extends Component {
  constructor(props) {
    super(props);
    this.state = { products: [], loading: true, error: '' };
  }

  componentDidMount() {
    this.apiGetProducts();
  }

  componentDidUpdate(previousProps) {
    if (
      previousProps.params.cid     !== this.props.params.cid ||
      previousProps.params.keyword !== this.props.params.keyword
    ) {
      this.apiGetProducts();
    }
  }

  async apiGetProducts() {
    const { cid, keyword } = this.props.params;
    const decodedKeyword = keyword || '';
    const endpoint = cid
      ? '/api/customer/products/category/' + cid
      : '/api/customer/products/search/' + encodeURIComponent(decodedKeyword);

    this.setState({ loading: true, error: '' });
    try {
      const result = await axios.get(endpoint);
      if (!Array.isArray(result.data)) throw new Error('Máy chủ trả dữ liệu sản phẩm không hợp lệ.');
      this.setState({ products: result.data, loading: false });
    } catch (error) {
      this.setState({
        error: error.response || error.request
          ? apiErrorMessage(error)
          : error.message || 'Không thể tải danh sách sản phẩm.',
        loading: false,
      });
    }
  }

  render() {
    const { products, loading, error } = this.state;
    const { keyword } = this.props.params;
    const decodedKeyword = keyword || '';

    return (
      <main className="customer-content">
        <h1 className="text-center">SẢN PHẨM</h1>

        {keyword && (
          <p className="search-summary">
            Từ khóa: <strong>"{decodedKeyword}"</strong>
            {!loading && !error && ` — ${products.length} kết quả`}
          </p>
        )}

        {loading && <ProductGridSkeleton />}

        {!loading && error && (
          <ErrorState message={error} onRetry={() => this.apiGetProducts()} />
        )}

        {!loading && !error && products.length === 0 && (
          <EmptyState
            title="Không tìm thấy sản phẩm"
            message={keyword ? `Không có sản phẩm nào khớp với "${decodedKeyword}".` : 'Danh mục này chưa có sản phẩm.'}
            action="Về trang chủ"
            onAction={() => this.props.navigate('/home')}
          />
        )}

        {!loading && !error && products.length > 0 && (
          <div className="product-list">
            {products.map((item, index) => item && <ProductCard key={item._id} product={item} index={index} />)}
          </div>
        )}
      </main>
    );
  }
}

export default withRouter(Product);
