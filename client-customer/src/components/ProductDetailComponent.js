import { Component } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import withRouter from '../utils/withRouter';
import getImageSrc from '../utils/getImageSrc';
import MyContext from '../contexts/MyContext';
import formatMoney from '../utils/formatMoney';
import ErrorState from './ui/ErrorState';
import ProductDetailSkeleton from './ui/ProductDetailSkeleton';
import ProductCard from './ui/ProductCard';
import apiErrorMessage from '../utils/apiErrorMessage';

const TAB_LABELS = { warranty: 'Bảo hành', return: 'Đổi trả', shipping: 'Vận chuyển', specs: 'Thông số' };
const TAB_CONTENT = {
  warranty: [
    'Sản phẩm chính hãng Apple',
    'Bảo hành theo chính sách của cửa hàng',
    'Hỗ trợ kiểm tra máy khi nhận hàng',
  ],
  return: [
    'Đổi trả trong vòng 7 ngày nếu có lỗi nhà sản xuất',
    'Sản phẩm còn nguyên hộp, đầy đủ phụ kiện',
    'Liên hệ hỗ trợ trong giờ hành chính',
  ],
  shipping: [
    'Giao hàng toàn quốc 2–5 ngày làm việc',
    'Miễn phí vận chuyển cho đơn hàng từ $100',
    'Đóng gói cẩn thận, an toàn',
  ],
};

class ProductDetail extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      product: null,
      txtQuantity: 1,
      loading: true,
      error: '',
      imageLoaded: false,
      imageZoom: false,
      activeTab: 'warranty',
      relatedProds: [],
      soldCount: undefined,
      wishlisted: false,
    };
  }

  componentDidMount() {
    this.apiGetProduct();
  }

  componentDidUpdate(previousProps) {
    if (previousProps.params.id !== this.props.params.id) {
      this.setState({
        product: null, loading: true, error: '', imageLoaded: false,
        imageZoom: false, activeTab: 'warranty', relatedProds: [],
        soldCount: undefined, wishlisted: false,
      });
      this.apiGetProduct();
    }
  }

  async apiGetProduct() {
    this.setState({ loading: true, error: '' });
    try {
      const [productRes, hotRes] = await Promise.all([
        axios.get('/api/customer/products/' + this.props.params.id),
        axios.get('/api/customer/products/hot', { params: { limit: 22 } }),
      ]);
      const product = productRes.data;
      const hotList = Array.isArray(hotRes.data) ? hotRes.data : [];

      const hotEntry = hotList.find((p) => String(p._id) === String(product._id));
      const soldCount = hotEntry?.sold;

      let wishlisted = false;
      try {
        wishlisted = JSON.parse(localStorage.getItem('wishlist') || '[]').includes(String(product._id));
      } catch {}

      this.setState({ product, soldCount, wishlisted, loading: false });

      if (product.category?._id) {
        try {
          const catRes = await axios.get('/api/customer/products/category/' + product.category._id);
          const related = Array.isArray(catRes.data)
            ? catRes.data.filter((p) => String(p._id) !== String(product._id)).slice(0, 3)
            : [];
          const relatedWithSold = related.map((p) => {
            const h = hotList.find((hp) => String(hp._id) === String(p._id));
            return h ? { ...p, sold: h.sold } : p;
          });
          this.setState({ relatedProds: relatedWithSold });
        } catch {}
      }
    } catch (error) {
      this.setState({ error: apiErrorMessage(error), loading: false });
    }
  }

  handleQtyChange = (delta) => {
    this.setState((s) => ({
      txtQuantity: Math.max(1, Math.min(99, Number(s.txtQuantity) + delta)),
    }));
  };

  btnAdd2CartClick = () => {
    const quantity = Number.parseInt(this.state.txtQuantity, 10);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      this.context.showToast('Vui lòng nhập số lượng hợp lệ.', 'warn');
      return;
    }
    const { product } = this.state;
    const mycart = this.context.mycart;
    const existingIndex = mycart.findIndex((item) => item.product._id === product._id);
    const updatedCart = existingIndex === -1
      ? [...mycart, { product, quantity }]
      : mycart.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
    this.context.setMycart(updatedCart);
    this.context.showToast(`Đã thêm ${quantity} × "${product.name}" vào giỏ hàng.`, 'success');
  };

  buyNow = () => {
    const quantity = Number.parseInt(this.state.txtQuantity, 10);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      this.context.showToast('Vui lòng nhập số lượng hợp lệ.', 'warn');
      return;
    }
    this.btnAdd2CartClick();
    this.props.navigate('/mycart');
  };

  toggleWishlist = () => {
    const { product, wishlisted } = this.state;
    if (!product) return;
    try {
      const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const updated = wishlisted
        ? list.filter((id) => id !== String(product._id))
        : [...list, String(product._id)];
      localStorage.setItem('wishlist', JSON.stringify(updated));
    } catch {}
    this.setState((s) => ({ wishlisted: !s.wishlisted }));
  };

  render() {
    const { product, txtQuantity, loading, error, activeTab, relatedProds, soldCount, wishlisted, imageZoom } = this.state;

    if (loading) return <main className="customer-content"><ProductDetailSkeleton /></main>;
    if (error)   return <main className="customer-content"><ErrorState message={error} onRetry={() => this.apiGetProduct()} /></main>;
    if (!product) return <main className="customer-content"><ErrorState message="Không tìm thấy sản phẩm." onRetry={() => this.apiGetProduct()} /></main>;

    const tabs = ['warranty', 'return', 'shipping', ...(product.specs?.length ? ['specs'] : [])];

    return (
      <main className="customer-content">

        {/* Breadcrumb */}
        <nav className="product-breadcrumb" aria-label="Điều hướng">
          <Link to="/home">Trang chủ</Link>
          <span aria-hidden="true"> · </span>
          {product.category && (
            <>
              <Link to={`/product/category/${product.category._id}`}>{product.category.name}</Link>
              <span aria-hidden="true"> · </span>
            </>
          )}
          <span>{product.name}</span>
        </nav>

        {/* Main 2-col card */}
        <div className="product-details">

          {/* Left: image */}
          <div className="details-image">
            <div
              className={`details-image-main${imageZoom ? ' is-zoomed' : ''}`}
              onMouseEnter={() => this.setState({ imageZoom: true })}
              onMouseLeave={() => this.setState({ imageZoom: false })}
            >
              {product.image && (
                <img
                  className={this.state.imageLoaded ? 'is-loaded' : ''}
                  loading="lazy"
                  src={getImageSrc(product.image)}
                  alt={product.name || ''}
                  width="400"
                  height="400"
                  onLoad={() => this.setState({ imageLoaded: true })}
                />
              )}
              <span className="zoom-hint" aria-hidden="true">Rê chuột để phóng to</span>
            </div>
            <div className="details-thumbs">
              <button type="button" className="details-thumb is-active" aria-label={product.name || ''}>
                {product.image && (
                  <img src={getImageSrc(product.image)} alt="" loading="lazy" />
                )}
              </button>
            </div>
          </div>

          {/* Right: info */}
          <div className="details-info">
            <div className="product-detail-category">
              <span className="eyebrow">Apple</span>
              {product.category && (
                <Link className="eyebrow" to={`/product/category/${product.category._id}`}>
                  &nbsp;·&nbsp;{product.category.name}
                </Link>
              )}
            </div>

            <h1 className="product-detail-name">{product.name}</h1>
            <div className="product-detail-price">{formatMoney(product.price)}</div>
            {soldCount !== undefined && (
              <div className="product-detail-sold">Đã bán {soldCount}</div>
            )}

            <div className="product-detail-qty">
              <span className="product-detail-qty-label">Số lượng</span>
              <div className="quantity-control">
                <button type="button" className="btn btn-glass btn-small" onClick={() => this.handleQtyChange(-1)} aria-label="Giảm số lượng">−</button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={txtQuantity}
                  onChange={(e) => this.setState({ txtQuantity: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })}
                  aria-label="Số lượng sản phẩm"
                />
                <button type="button" className="btn btn-glass btn-small" onClick={() => this.handleQtyChange(1)} aria-label="Tăng số lượng">+</button>
              </div>
            </div>

            <div className="product-detail-actions">
              <button type="button" className="btn btn-primary detail-action-main" onClick={this.btnAdd2CartClick}>Thêm vào giỏ</button>
              <button type="button" className="btn btn-glass detail-action-main" onClick={this.buyNow}>Mua ngay</button>
              <button
                type="button"
                className={`wishlist-btn wishlist-btn-detail${wishlisted ? ' is-wishlisted' : ''}`}
                aria-label={wishlisted ? 'Bỏ yêu thích' : 'Yêu thích'}
                onClick={this.toggleWishlist}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs glass">
          <div className="detail-tab-nav" role="tablist" aria-label="Thông tin sản phẩm">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={`detail-tab-btn${activeTab === tab ? ' is-active' : ''}`}
                onClick={() => this.setState({ activeTab: tab })}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
          <div className="detail-tab-body" role="tabpanel">
            {TAB_CONTENT[activeTab] && (
              <ul className="detail-checklist">
                {TAB_CONTENT[activeTab].map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            )}
            {activeTab === 'specs' && product.specs?.length > 0 && (
              <table className="specs-table">
                <tbody>
                  {product.specs.map((s, i) => (
                    <tr key={i}>
                      <td className="specs-label">{s.label}</td>
                      <td>{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Related products */}
        {relatedProds.length > 0 && (
          <section className="related-products">
            <div className="strip-heading">
              <h2>Sản phẩm khác</h2>
            </div>
            <div className="product-list">
              {relatedProds.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} sold={p.sold} />
              ))}
            </div>
          </section>
        )}

      </main>
    );
  }
}

export default withRouter(ProductDetail);
