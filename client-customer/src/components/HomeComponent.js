import { Component } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import getImageSrc from '../utils/getImageSrc';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';
import withRouter from '../utils/withRouter';
import formatMoney from '../utils/formatMoney';
import apiErrorMessage from '../utils/apiErrorMessage';
import ProductCard from './ui/ProductCard';
import ProductGridSkeleton from './ui/ProductGridSkeleton';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = { newprods: [], hotprods: [], categories: [], categoriesError: '', loading: true, error: '' };
  }

  componentDidMount() {
    this.apiGetProducts();
    this.apiGetCategories();
  }

  apiGetCategories = async () => {
    try {
      const result = await axios.get('/api/customer/categories');
      if (!Array.isArray(result.data)) throw new Error('Máy chủ trả dữ liệu danh mục không hợp lệ.');
      this.setState({ categories: result.data, categoriesError: '' });
    } catch (error) {
      this.setState({
        categoriesError: error.response || error.request
          ? apiErrorMessage(error)
          : error.message || 'Không thể tải danh mục.',
      });
    }
  };

  async apiGetProducts() {
    this.setState({ loading: true, error: '' });
    try {
      const [newResult, hotResult] = await Promise.all([
        axios.get('/api/customer/products/new'),
        axios.get('/api/customer/products/hot', { params: { limit: 12 } }),
      ]);
      if (!Array.isArray(newResult.data) || !Array.isArray(hotResult.data)) {
        throw new Error('Dữ liệu sản phẩm không hợp lệ.');
      }
      this.setState({
        newprods: newResult.data,
        hotprods: hotResult.data,
        loading: false,
      });
    } catch (error) {
      this.setState({
        error: error.response || error.request
          ? apiErrorMessage(error)
          : error.message || 'Không thể tải sản phẩm.',
        loading: false,
      });
    }
  }

  renderProducts(title, products) {
    return (
      <section className="hot-products" id="best-sellers">
        <div className="hot-heading">
          <h2>{title}</h2>
          <span className="section-label">ĐƯỢC YÊU THÍCH</span>
        </div>
        <div className="product-list">
          {(products || []).slice(0, 3).map((item, index) => item && (
            <ProductCard key={item._id} product={item} index={index} rank={index + 1} sold={item.sold} />
          ))}
        </div>
        <Link className="section-link" to="/bestsellers">Xem tất cả</Link>
      </section>
    );
  }

  render() {
    const { newprods, hotprods, categories, categoriesError, loading, error } = this.state;
    const featured = (newprods || [])[0];
    const remainingProducts = (newprods || []).slice(1);

    if (loading) return <main className="customer-content"><ProductGridSkeleton count={3} /></main>;
    if (error)   return <main className="customer-content"><ErrorState message={error} onRetry={() => this.apiGetProducts()} /></main>;

    return (
      <main className="customer-content">
        {featured && (
          <>
            <section className="spotlight">
              <div className="spotlight-copy">
                <div className="eyebrow">SẢN PHẨM MỚI</div>
                <h1 className="spotlight-title">{featured.name || ''}</h1>
                <p className="spotlight-description">Khám phá những lựa chọn mới được tuyển chọn dành riêng cho bạn.</p>
                <div className="spotlight-price">{formatMoney(featured.price)}</div>
                <div className="spotlight-actions">
                  <Link className="btn btn-primary" to={'/product/' + featured._id}>Mua ngay</Link>
                  <a className="btn btn-glass" href="#categories">Xem danh mục</a>
                </div>
              </div>
              <div className="spotlight-visual">
                <div className="spotlight-orbit" />
                <Link
                  className="spotlight-image-link"
                  to={'/product/' + featured._id}
                  aria-label={`Xem ${featured.name || 'sản phẩm nổi bật'}`}
                >
                  {featured.image && (
                    <img
                      className="spotlight-image"
                      loading="lazy"
                      src={getImageSrc(featured.image)}
                      alt={featured.name || ''}
                    />
                  )}
                </Link>
              </div>
            </section>

            <section className="new-products" id="new-products">
              <div className="strip-heading">
                <h2>SẢN PHẨM MỚI</h2>
                <Link className="section-link" to="/products">Xem tất cả</Link>
              </div>
              <div className="product-list">
                {remainingProducts.map((item, index) => item && (
                  <ProductCard key={item._id || index} product={item} index={index} />
                ))}
              </div>
              {remainingProducts.length === 0 && (
                <EmptyState title="Đang cập nhật sản phẩm mới" message="Hãy quay lại sau để khám phá các sản phẩm mới." />
              )}
            </section>
          </>
        )}
        <section className="category-chips glass" id="categories" aria-label="Danh mục sản phẩm">
          <div className="section-heading"><h2>Khám phá danh mục</h2><Link to="/home#new-products">Sản phẩm mới</Link></div>
          {categoriesError && <ErrorState message={categoriesError} onRetry={this.apiGetCategories} />}
          {!categoriesError && categories.length === 0
            ? <EmptyState title="Chưa có danh mục" message="Danh mục sẽ xuất hiện khi có sản phẩm." />
            : <div className="category-chip-list">{categories.map((category) => <Link className="chip" key={category._id} to={`/product/category/${category._id}`}>{category.name}</Link>)}</div>}
        </section>
        {newprods.length === 0 && (
          <EmptyState title="Chưa có sản phẩm" message="Danh mục sản phẩm sẽ sớm được cập nhật." action="Tải lại" onAction={() => this.apiGetProducts()} />
        )}
        {hotprods?.length > 0
          ? this.renderProducts('BÁN CHẠY NHẤT', hotprods)
          : <EmptyState title="Chưa có sản phẩm bán chạy" message="Sản phẩm nổi bật sẽ xuất hiện tại đây." />}
        <footer className="customer-footer glass">EMPTY SHOP · Mua sắm dễ dàng, trải nghiệm tinh tế.</footer>
      </main>
    );
  }
}

export default withRouter(Home);
