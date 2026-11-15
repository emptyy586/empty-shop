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
    this.state = {
      newprods: [],
      hotprods: [],
      categories: [],
      categoriesError: '',
      loading: true,
      error: '',
    };
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
        axios.get('/api/customer/products', { params: { sort: 'newest', limit: 5 } }),
        axios.get('/api/customer/products/hot', { params: { limit: 3 } }),
      ]);
      const newprods = Array.isArray(newResult.data?.products) ? newResult.data.products : [];
      const hotprods = Array.isArray(hotResult.data) ? hotResult.data : [];
      this.setState({ newprods, hotprods, loading: false });
    } catch (error) {
      this.setState({
        error: error.response || error.request
          ? apiErrorMessage(error)
          : error.message || 'Không thể tải sản phẩm.',
        loading: false,
      });
    }
  }

  render() {
    const { newprods, hotprods, categories, categoriesError, loading, error } = this.state;
    const featured = newprods[0];
    const gridProds = newprods.slice(1);

    if (loading) return <main className="customer-content"><ProductGridSkeleton count={4} /></main>;
    if (error)   return <main className="customer-content"><ErrorState message={error} onRetry={() => this.apiGetProducts()} /></main>;

    return (
      <main className="customer-content">

        {/* ── Hero ─────────────────────────────────────────────── */}
        {featured && (
          <section className="spotlight">
            <div className="spotlight-copy">
              <div className="eyebrow">NỔI BẬT</div>
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
        )}

        {/* ── Category chips ───────────────────────────────────── */}
        <section className="home-category-row" id="categories" aria-label="Danh mục sản phẩm">
          {categoriesError
            ? <ErrorState message={categoriesError} onRetry={this.apiGetCategories} />
            : categories.map((c) => (
                <Link key={c._id} className="chip" to={`/product/category/${c._id}`}>{c.name}</Link>
              ))
          }
        </section>

        {/* ── Sản phẩm mới ─────────────────────────────────────── */}
        <section className="new-products" id="new-products">
          <div className="strip-heading">
            <h2>Sản phẩm mới</h2>
            <Link className="section-link" to="/products">Xem tất cả</Link>
          </div>
          {gridProds.length === 0
            ? <EmptyState title="Đang cập nhật sản phẩm mới" message="Hãy quay lại sau để khám phá các sản phẩm mới." />
            : (
              <div className="product-list">
                {gridProds.map((item, index) => item && (
                  <ProductCard key={item._id || index} product={item} index={index} />
                ))}
              </div>
            )
          }
        </section>

        {/* ── Promo banner ─────────────────────────────────────── */}
        <section className="promo-banner" aria-label="Ưu đãi cuối tuần">
          <div className="promo-banner-text">
            <h2>Ưu đãi cuối tuần</h2>
            <p>Mua sắm sản phẩm Apple chính hãng.</p>
          </div>
          <Link className="btn promo-banner-btn" to="/products">Khám phá</Link>
        </section>

        {/* ── Store features ───────────────────────────────────── */}
        <div className="store-features" aria-label="Cam kết của cửa hàng">
          <div className="feature-item">
            <span className="feature-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>
            </span>
            <div>
              <strong>Chính hãng</strong>
              <small>Sản phẩm Apple</small>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            </span>
            <div>
              <strong>Bảo hành minh bạch</strong>
              <small>Rõ ràng</small>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3m-1 11h4a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2" /><circle cx="8" cy="20" r="1" /><circle cx="16.5" cy="20" r="1" /></svg>
            </span>
            <div>
              <strong>Giao hàng nhanh</strong>
              <small>Toàn quốc</small>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </span>
            <div>
              <strong>Hỗ trợ khách hàng</strong>
              <small>Trả lời nhanh</small>
            </div>
          </div>
        </div>

        {/* ── Bán chạy nhất ────────────────────────────────────── */}
        {hotprods.length > 0
          ? (
            <section className="hot-products" id="best-sellers">
              <div className="hot-heading">
                <h2>Bán chạy nhất</h2>
                <Link className="section-link" to="/bestsellers">Xem tất cả</Link>
              </div>
              <div className="product-list">
                {hotprods.slice(0, 3).map((item, index) => item && (
                  <ProductCard key={item._id} product={item} index={index} rank={index + 1} sold={item.sold} />
                ))}
              </div>
            </section>
          )
          : <EmptyState title="Chưa có sản phẩm bán chạy" message="Sản phẩm nổi bật sẽ xuất hiện tại đây." />
        }

        {newprods.length === 0 && (
          <EmptyState
            title="Chưa có sản phẩm"
            message="Danh mục sản phẩm sẽ sớm được cập nhật."
            action="Tải lại"
            onAction={() => this.apiGetProducts()}
          />
        )}

      </main>
    );
  }
}

export default withRouter(Home);
