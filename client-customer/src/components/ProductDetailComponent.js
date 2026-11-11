import { Component } from 'react';
import axios from 'axios';
import withRouter from '../utils/withRouter';
import getImageSrc from '../utils/getImageSrc';
import MyContext from '../contexts/MyContext';
import formatMoney from '../utils/formatMoney';
import ErrorState from './ui/ErrorState';
import ProductDetailSkeleton from './ui/ProductDetailSkeleton';
import apiErrorMessage from '../utils/apiErrorMessage';

class ProductDetail extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = { product: null, txtQuantity: 1, loading: true, error: '', imageLoaded: false };
  }

  componentDidMount() {
    this.apiGetProduct();
  }

  componentDidUpdate(previousProps) {
    if (previousProps.params.id !== this.props.params.id) {
      this.setState({ product: null, loading: true, error: '', imageLoaded: false });
      this.apiGetProduct();
    }
  }

  async apiGetProduct() {
    this.setState({ loading: true, error: '' });
    try {
      const result = await axios.get('/api/customer/products/' + this.props.params.id);
      this.setState({ product: result.data, loading: false });
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
    const updatedCart =
      existingIndex === -1
        ? [...mycart, { product, quantity }]
        : mycart.map((item, index) =>
            index === existingIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
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

  render() {
    const { product, txtQuantity, loading, error } = this.state;

    if (loading) return <main className="customer-content"><ProductDetailSkeleton /></main>;
    if (error)   return <main className="customer-content"><ErrorState message={error} onRetry={() => this.apiGetProduct()} /></main>;
    if (!product) return <main className="customer-content"><ErrorState message="Không tìm thấy sản phẩm." onRetry={() => this.apiGetProduct()} /></main>;

    return (
      <main className="customer-content">
        <h2 className="text-center">CHI TIẾT SẢN PHẨM</h2>
        <div className="product-details float-clear">
          <div className="details-image float-left">
            <div className="details-orbit" />
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
          </div>
          <div className="details-info float-right">
            <div>Mã sản phẩm: {product._id}</div>
            <div>Tên sản phẩm: {product.name}</div>
            <div>Giá: {formatMoney(product.price)}</div>
            <div>Danh mục: {product.category && product.category.name}</div>
            <div className="quantity-control">
              <span>Số lượng:</span>
              <button
                type="button"
                onClick={() => this.handleQtyChange(-1)}
                aria-label="Giảm số lượng"
                className="btn btn-glass btn-small"
              >−</button>
              <input
                type="number"
                min="1"
                max="99"
                value={txtQuantity}
                onChange={(e) => this.setState({ txtQuantity: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })}
                aria-label="Số lượng sản phẩm"
              />
              <button
                type="button"
                onClick={() => this.handleQtyChange(1)}
                aria-label="Tăng số lượng"
                className="btn btn-glass btn-small"
              >+</button>
            </div>
            <div className="product-detail-actions">
              <button type="button" className="btn btn-primary" onClick={this.btnAdd2CartClick}>Thêm vào giỏ</button>
              <button type="button" className="btn btn-glass" onClick={this.buyNow}>Mua ngay</button>
            </div>
          </div>
        </div>
      </main>
    );
  }
}

export default withRouter(ProductDetail);
