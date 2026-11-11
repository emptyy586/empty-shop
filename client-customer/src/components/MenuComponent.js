import { Component } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import withRouter from '../utils/withRouter';
import MyContext from '../contexts/MyContext';
import ThemeToggle from './ui/ThemeToggle';
import ErrorState from './ui/ErrorState';
import apiErrorMessage from '../utils/apiErrorMessage';

function getSearchKeyword(pathname = '') {
  const match = pathname.match(/^\/product\/search\/([^/]+)$/);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

class Menu extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      categories: [],
      txtKeyword: getSearchKeyword(props.location?.pathname),
      error: '',
      categoriesLoading: true,
      mobileOpen: false,
      categoryOpen: false,
      searchOpen: false,
      accountOpen: false,
      badgeBump: false,
    };
    this.searchInputRef = null;
    this.accountButtonRef = null;
    this.customerLinksRef = null;
    this.categoryOpenTimer = null;
    this.categoryCloseTimer = null;
    this.badgeTimer = null;
    this.navIndicatorFrame = 0;
    this.navIndicatorReady = false;
  }

  componentDidMount() {
    this.lastCartCount = this.getCartCount();
    this.syncNavIndicator(false);
    window.addEventListener('resize', this.syncNavIndicator);
    this.apiGetCategories();
    document.addEventListener('mousedown', this.closeAccountOnOutsideClick);
    document.addEventListener('keydown', this.handleGlobalKeyDown);
  }

  componentDidUpdate(previousProps, previousState) {
    const currentCartCount = this.getCartCount();
    if (this.lastCartCount !== currentCartCount) {
      this.lastCartCount = currentCartCount;
      this.setState({ badgeBump: true });
      window.clearTimeout(this.badgeTimer);
      this.badgeTimer = window.setTimeout(() => this.setState({ badgeBump: false }), 350);
    }
    if (previousProps.location.pathname !== this.props.location.pathname) {
      this.setState({
        txtKeyword: getSearchKeyword(this.props.location.pathname),
        categoryOpen: false,
        mobileOpen: false,
      });
    }
    if (previousProps.location.pathname !== this.props.location.pathname ||
      previousState.mobileOpen !== this.state.mobileOpen) {
      window.requestAnimationFrame(this.syncNavIndicator);
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.closeAccountOnOutsideClick);
    document.removeEventListener('keydown', this.handleGlobalKeyDown);
    window.removeEventListener('resize', this.syncNavIndicator);
    window.clearTimeout(this.categoryOpenTimer);
    window.clearTimeout(this.categoryCloseTimer);
    window.clearTimeout(this.badgeTimer);
    window.cancelAnimationFrame(this.navIndicatorFrame);
  }

  syncNavIndicator = (animate = true) => {
    window.cancelAnimationFrame(this.navIndicatorFrame);
    this.navIndicatorFrame = window.requestAnimationFrame(() => {
      const container = this.customerLinksRef;
      const selected = container?.querySelector('[aria-current="page"]');
      const indicator = container?.querySelector('.nav-active-indicator');
      if (!container || !indicator) return;
      if (!this.navIndicatorReady) indicator.style.transition = 'none';
      if (!selected) {
        indicator.style.opacity = '0';
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();
      indicator.style.width = `${selectedRect.width}px`;
      indicator.style.height = `${selectedRect.height}px`;
      indicator.style.transform = `translate3d(${selectedRect.left - containerRect.left}px, ${selectedRect.top - containerRect.top}px, 0)`;
      indicator.style.opacity = '1';
      if (!this.navIndicatorReady) {
        indicator.getBoundingClientRect();
        window.requestAnimationFrame(() => {
          indicator.style.removeProperty('transition');
          this.navIndicatorReady = true;
        });
      } else if (!animate) {
        indicator.style.transition = 'none';
        indicator.getBoundingClientRect();
        window.requestAnimationFrame(() => indicator.style.removeProperty('transition'));
      }
    });
  };

  getCartCount = () => (this.context.mycart || []).reduce(
    (count, item) => count + Number(item.quantity || 0),
    0
  );

  scheduleCategoryOpen = () => {
    window.clearTimeout(this.categoryCloseTimer);
    window.clearTimeout(this.categoryOpenTimer);
    this.categoryOpenTimer = window.setTimeout(() => this.setState({ categoryOpen: true }), 120);
  };

  scheduleCategoryClose = () => {
    window.clearTimeout(this.categoryOpenTimer);
    window.clearTimeout(this.categoryCloseTimer);
    this.categoryCloseTimer = window.setTimeout(() => this.setState({ categoryOpen: false }), 200);
  };

  closeAccountOnOutsideClick = (event) => {
    const accountMenu = document.getElementById('customer-account-menu');
    const clickInsideMenu = accountMenu?.contains(event.target);
    const clickOnTrigger = this.accountButtonRef?.contains(event.target);
    if (this.state.accountOpen && !clickInsideMenu && !clickOnTrigger) {
      this.setState({ accountOpen: false });
    }
  };

  handleGlobalKeyDown = (event) => {
    if (event.key !== 'Escape') return;
    const shouldRestoreAccountFocus = this.state.accountOpen;
    this.setState({
      accountOpen: false,
      categoryOpen: false,
      searchOpen: false,
      mobileOpen: false,
    }, () => {
      if (shouldRestoreAccountFocus) this.accountButtonRef?.focus();
    });
  };

  apiGetCategories = async () => {
    this.setState({ categoriesLoading: true, error: '' });
    try {
      const result = await axios.get('/api/customer/categories');
      if (!Array.isArray(result.data)) throw new Error('Máy chủ trả dữ liệu danh mục không hợp lệ.');
      this.setState({ categories: result.data, error: '', categoriesLoading: false });
    } catch (error) {
      const message = error.response || error.request
        ? apiErrorMessage(error)
        : error.message || 'Không thể tải danh mục.';
      this.setState({ error: message, categoriesLoading: false });
      if (this.props.location.pathname !== '/home') {
        this.context.showToast(message, 'error');
      }
    }
  };

  btnSearchClick = (event) => {
    event.preventDefault();
    const keyword = this.state.txtKeyword.trim();
    this.props.navigate(keyword
      ? '/product/search/' + encodeURIComponent(keyword)
      : '/home#new-products');
    this.setState({ mobileOpen: false, searchOpen: false });
  };

  render() {
    const {
      categories,
      error,
      categoriesLoading,
      mobileOpen,
      categoryOpen,
      searchOpen,
      accountOpen,
    } = this.state;
    const cartCount = this.getCartCount();
    const pathname = this.props.location.pathname;
    const categoryActive = pathname.startsWith('/product/category/');
    const homeActive = pathname === '/' || pathname === '/home';
    const bestsellerActive = pathname === '/bestsellers';
    const productsActive = pathname === '/products' ||
      (pathname.startsWith('/product/') && !categoryActive);
    const accountName = this.context.customer?.name || 'Khách hàng';

    return (
      <header className="customer-header-wrap">
        <div className="customer-header glass">
          <Link className="brand" to="/" aria-label="EMPTY SHOP - Trang chủ">
            EMPTY SHOP
          </Link>
          <button
            type="button"
            className="iconbtn mobile-menu-toggle"
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileOpen}
            aria-controls="customer-navigation"
            onClick={() => this.setState({ mobileOpen: !mobileOpen })}
          >
            {mobileOpen
              ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
              : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
          </button>
          <div id="customer-navigation" className={`customer-nav ${mobileOpen ? 'is-open' : ''}`}>
            <nav className="customer-links" aria-label="Điều hướng chính" ref={(element) => { this.customerLinksRef = element; }}>
              <span className="nav-active-indicator" aria-hidden="true" />
              <Link
                className={homeActive ? 'is-active' : ''}
                aria-current={homeActive ? 'page' : undefined}
                to="/home"
                onClick={() => this.setState({ mobileOpen: false })}
              >Trang chủ</Link>
              <Link
                className={productsActive ? 'is-active' : ''}
                aria-current={productsActive ? 'page' : undefined}
                to="/products"
                onClick={() => this.setState({ mobileOpen: false })}
              >Sản phẩm</Link>
              <Link
                className={bestsellerActive ? 'is-active' : ''}
                aria-current={bestsellerActive ? 'page' : undefined}
                to="/bestsellers"
                onClick={() => this.setState({ mobileOpen: false })}
              >Bán chạy</Link>
              <div className="category-nav" onMouseEnter={this.scheduleCategoryOpen} onMouseLeave={this.scheduleCategoryClose}>
                <button
                  type="button"
                  className={`nav-category-button${categoryActive ? ' is-active' : ''}`}
                  aria-current={categoryActive ? 'page' : undefined}
                  aria-expanded={categoryOpen}
                  aria-controls="customer-category-menu"
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      this.setState({ categoryOpen: true }, () => {
                        document.querySelector('#customer-category-menu a')?.focus();
                      });
                    }
                  }}
                  onClick={() => this.setState({ categoryOpen: !categoryOpen })}
                >Danh mục</button>
                <div id="customer-category-menu" className={`category-menu glass${categoryOpen ? ' is-open' : ''}`}>
                  {categoriesLoading && <span>Đang tải...</span>}
                  {!categoriesLoading && error && (
                    <ErrorState message={error} onRetry={this.apiGetCategories} />
                  )}
                  {!categoriesLoading && !error && categories.length === 0 && <span>Chưa có danh mục</span>}
                  {categories.map((item) => item && (
                    <Link
                      key={item._id}
                      to={`/product/category/${item._id}`}
                      onClick={() => this.setState({ mobileOpen: false, categoryOpen: false })}
                    >{item.name}</Link>
                  ))}
                </div>
              </div>
            </nav>
            <form className={`search${searchOpen ? ' is-open' : ''}`} role="search" onSubmit={this.btnSearchClick}>
              <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 5 5" />
              </svg>
              <input
                ref={(element) => { this.searchInputRef = element; }}
                className="keyword"
                type="search"
                value={this.state.txtKeyword}
                onChange={(event) => this.setState({ txtKeyword: event.target.value })}
                aria-label="Tìm sản phẩm"
                placeholder="Tìm sản phẩm…"
              />
              <button
                type="button"
                className="search-toggle iconbtn"
                aria-label={searchOpen ? 'Đóng ô tìm kiếm' : 'Mở ô tìm kiếm'}
                aria-expanded={searchOpen}
                onClick={() => this.setState(
                  (current) => ({ searchOpen: !current.searchOpen }),
                  () => {
                    if (this.state.searchOpen) this.searchInputRef?.focus();
                  }
                )}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path d="m16 16 5 5" />
                </svg>
              </button>
            </form>
          </div>
          <div className="customer-header-actions">
            <ThemeToggle />
            <Link
              className="cart-link iconbtn"
              to="/mycart"
              aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
              title="Giỏ hàng"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 1.9-1.4L22 9H6" />
                <circle cx="10" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
              <span className={`cart-count${this.state.badgeBump ? ' is-bumping' : ''}`}>{cartCount}</span>
            </Link>
            {this.context.token
              ? <div className="customer-account-group">
                  <button
                    ref={(element) => { this.accountButtonRef = element; }}
                    type="button"
                    className="customer-account iconbtn"
                    aria-label={`Tài khoản: ${accountName}`}
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                    aria-controls="customer-account-menu"
                    onClick={() => this.setState({ accountOpen: !accountOpen })}
                  >
                    <span className="avatar">{accountName.slice(0, 1).toLocaleUpperCase('vi-VN')}</span>
                  </button>
                  {accountOpen && (
                    <div id="customer-account-menu" className="account-menu glass" role="menu">
                      <Link role="menuitem" to="/myprofile" onClick={() => this.setState({ accountOpen: false })}>Hồ sơ</Link>
                      <Link role="menuitem" to="/myorders" onClick={() => this.setState({ accountOpen: false })}>Đơn hàng</Link>
                      <button role="menuitem" type="button" onClick={() => {
                        this.setState({ accountOpen: false });
                        this.context.logout();
                      }}>Đăng xuất</button>
                    </div>
                  )}
                </div>
              : <Link className="btn btn-primary customer-login-link" to="/login">Đăng nhập</Link>}
          </div>
        </div>
      </header>
    );
  }
}

export default withRouter(Menu);
