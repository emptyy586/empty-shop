import React, { Component } from 'react';
import axios from 'axios';
import withRouter from '../utils/withRouter';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';
import ProductCard from './ui/ProductCard';
import ProductGridSkeleton from './ui/ProductGridSkeleton';
import AnimatedCount from './ui/AnimatedCount';
import apiErrorMessage from '../utils/apiErrorMessage';

const PAGE_SIZE = 12;

function parseQuery(search) {
  const query = new URLSearchParams(search);
  const page = Number(query.get('page')) || 1;
  const sort = ['newest', 'price-asc', 'price-desc'].includes(query.get('sort'))
    ? query.get('sort')
    : 'newest';
  return { page: Math.max(1, Math.floor(page)), sort, category: query.get('category') || '' };
}

class ProductsPage extends Component {
  state = { products: [], total: 0, pages: 0, categories: [], loading: true, error: '', pageAnimation: false };
  categoryFilterRef = null;
  indicatorFrame = 0;
  animationTimer = 0;

  componentDidMount() {
    this.loadCategories();
    this.loadProducts();
    window.addEventListener('resize', this.syncCategoryIndicator);
    this.syncCategoryIndicator(false);
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousProps.location.search !== this.props.location.search) {
      this.loadProducts();
      const previousPage = parseQuery(previousProps.location.search).page;
      const currentPage = parseQuery(this.props.location.search).page;
      if (previousPage !== currentPage) {
        this.pendingScroll = true;
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          this.setState({ pageAnimation: true });
          window.clearTimeout(this.animationTimer);
          this.animationTimer = window.setTimeout(() => this.setState({ pageAnimation: false }), 900);
        }
      }
    }
    if (previousState.categories !== this.state.categories ||
      previousProps.location.search !== this.props.location.search) {
      this.syncCategoryIndicator();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.syncCategoryIndicator);
    window.cancelAnimationFrame(this.indicatorFrame);
    window.clearTimeout(this.animationTimer);
  }

  syncCategoryIndicator = (animate = true) => {
    window.cancelAnimationFrame(this.indicatorFrame);
    this.indicatorFrame = window.requestAnimationFrame(() => this.positionCategoryIndicator(animate));
  };

  positionCategoryIndicator = (animate) => {
    const container = this.categoryFilterRef;
    const selected = container?.querySelector('.chip.is-selected');
    const indicator = container?.querySelector('.category-filter-indicator');
    if (!container || !selected || !indicator) return;
    if (!this.categoryIndicatorReady) indicator.style.transition = 'none';
    const x = selected.offsetLeft;
    const y = selected.offsetTop;
    indicator.style.width = `${selected.offsetWidth}px`;
    indicator.style.height = `${selected.offsetHeight}px`;
    indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    indicator.style.opacity = '1';
    if (!this.categoryIndicatorReady) {
      indicator.getBoundingClientRect();
      window.requestAnimationFrame(() => {
        indicator.style.removeProperty('transition');
        this.categoryIndicatorReady = true;
      });
    } else if (!animate) {
      indicator.style.transition = 'none';
      indicator.getBoundingClientRect();
      window.requestAnimationFrame(() => indicator.style.removeProperty('transition'));
    }
  };

  loadCategories = async () => {
    try {
      const response = await axios.get('/api/customer/categories');
      if (!Array.isArray(response.data)) throw new Error('Dữ liệu danh mục không hợp lệ.');
      this.setState({ categories: response.data });
    } catch (error) {
      this.setState({
        categoriesError: error.response || error.request ? apiErrorMessage(error) : error.message,
      });
    }
  };

  loadProducts = async () => {
    const { page, sort, category } = parseQuery(this.props.location.search);
    this.setState({ loading: true, error: '' });
    try {
      const response = await axios.get('/api/customer/products', {
        params: { page, limit: PAGE_SIZE, sort, ...(category ? { category } : {}) },
      });
      if (!Array.isArray(response.data?.products) || !Number.isFinite(response.data?.total)) {
        throw new Error('Dữ liệu sản phẩm không hợp lệ.');
      }
      this.setState({
        products: response.data.products,
        total: response.data.total,
        pages: response.data.pages,
        loading: false,
      }, () => {
        if (this.pendingScroll) {
          this.pendingScroll = false;
          document.getElementById('products-grid')?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start',
          });
        }
      });
    } catch (error) {
      this.setState({
        error: error.response || error.request ? apiErrorMessage(error) : error.message || 'Không thể tải sản phẩm.',
        loading: false,
      });
    }
  };

  updateQuery = (changes) => {
    const current = parseQuery(this.props.location.search);
    const next = { ...current, ...changes };
    const query = new URLSearchParams();
    if (next.page > 1) query.set('page', next.page);
    if (next.sort !== 'newest') query.set('sort', next.sort);
    if (next.category) query.set('category', next.category);
    this.props.navigate(`/products${query.toString() ? `?${query}` : ''}`);
  };

  clearFilters = () => this.updateQuery({ page: 1, sort: 'newest', category: '' });

  render() {
    const { products, total, pages, categories, categoriesError, loading, error, pageAnimation } = this.state;
    const { page, sort, category } = parseQuery(this.props.location.search);
    return (
      <main className="customer-content products-page">
        <div className="products-page-heading">
          <div>
            <p className="eyebrow">KHÁM PHÁ CỬA HÀNG</p>
            <h1>Tất cả sản phẩm</h1>
          </div>
          <span className="products-total" aria-live="polite"><AnimatedCount value={total} /> sản phẩm</span>
        </div>
        <section className="products-toolbar glass" aria-label="Lọc và sắp xếp sản phẩm">
          <div className="category-filter" ref={(node) => { this.categoryFilterRef = node; }}>
            <span className="category-filter-indicator" aria-hidden="true" />
            <button type="button" className={`chip${!category ? ' is-selected' : ''}`} onClick={() => this.updateQuery({ page: 1, category: '' })}>Tất cả</button>
            {categories.map((item) => (
              <button
                type="button"
                key={item._id}
                className={`chip${category === item._id ? ' is-selected' : ''}`}
                onClick={() => this.updateQuery({ page: 1, category: item._id })}
              >{item.name}</button>
            ))}
          </div>
          <label className="sort-control">
            <span>Sắp xếp</span>
            <select value={sort} onChange={(event) => this.updateQuery({ page: 1, sort: event.target.value })}>
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá tăng</option>
              <option value="price-desc">Giá giảm</option>
            </select>
          </label>
        </section>
        {categoriesError && <ErrorState message={categoriesError} onRetry={this.loadCategories} />}
        {loading && <ProductGridSkeleton />}
        {!loading && error && <ErrorState message={error} onRetry={this.loadProducts} />}
        {!loading && !error && products.length === 0 && (
          <EmptyState title="Không tìm thấy sản phẩm" message="Thử thay đổi danh mục hoặc xóa bộ lọc." action="Xóa bộ lọc" onAction={this.clearFilters} />
        )}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="product-list" id="products-grid">
              {products.map((product, index) => <ProductCard key={product._id} product={product} index={index} animateOnUpdate={pageAnimation} />)}
            </div>
            {pages > 1 && (
              <nav className="products-pagination" aria-label="Phân trang sản phẩm">
                <button className="btn btn-glass" type="button" disabled={page <= 1} onClick={() => this.updateQuery({ page: page - 1 })}>Trước</button>
                <span>Trang {page} / {pages}</span>
                <button className="btn btn-glass" type="button" disabled={page >= pages} onClick={() => this.updateQuery({ page: page + 1 })}>Sau</button>
              </nav>
            )}
          </>
        )}
      </main>
    );
  }
}

export default withRouter(ProductsPage);
