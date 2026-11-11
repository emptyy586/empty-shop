import { Component } from 'react';
import axios from 'axios';
import MyContext from './MyContext';

// ─── localStorage helpers ───────────────────────────────────────────────────
const LS_TOKEN    = 'es_token';
const LS_CUSTOMER = 'es_customer';
const LS_CART     = 'es_mycart';
const MAX_TIMEOUT = 2147483647;

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded – ignore */ }
}

function lsRemove(...keys) {
  try {
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

function getTokenExpiry(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const parsed = JSON.parse(atob(paddedPayload));
    return Number.isFinite(parsed.exp) ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const expiresAt = getTokenExpiry(token);
  return expiresAt !== null && expiresAt <= Date.now();
}

function navigateToLogin() {
  if (window.location.pathname !== '/login') {
    window.history.replaceState(null, '', '/login');
    window.dispatchEvent(new Event('popstate'));
  }
}

// ─── Axios 401 interceptor ───────────────────────────────────────────────────
// We keep a reference to the provider so the interceptor can call logout().
let _providerRef = null;

axios.interceptors.response.use(
  (response) => {
    const message = response.data?.message || '';
    const invalidToken =
      response.data?.success === false &&
      /token.*(invalid|expired|required)|invalid or expired token/i.test(message);
    if (
      _providerRef?.state.token &&
      invalidToken &&
      !response.config?.url?.includes('/login')
    ) {
      _providerRef.logout('SESSION_EXPIRED');
    }
    return response;
  },
  (error) => {
    if (
      error.response?.status === 401 &&
      _providerRef?.state.token &&
      !error.config?.url?.includes('/login')
    ) {
      _providerRef.logout('SESSION_EXPIRED');
    }
    return Promise.reject(error);
  }
);

// ────────────────────────────────────────────────────────────────────────────
class MyProvider extends Component {
  constructor(props) {
    super(props);

    // Rehydrate from localStorage on startup
    const token    = lsGet(LS_TOKEN,    '');
    const customer = lsGet(LS_CUSTOMER, null);
    const mycart   = lsGet(LS_CART,     []);

    // Basic sanity checks – discard corrupt data
    const storedToken = typeof token === 'string' ? token : '';
    const tokenExpired = isTokenExpired(storedToken);
    const safeToken = tokenExpired ? '' : storedToken;
    const safeCustomer = customer && typeof customer === 'object' && customer._id
      && !tokenExpired
      ? customer
      : null;
    const safeCart = Array.isArray(mycart)
      ? mycart.filter((item) =>
          item &&
          item.product &&
          item.product._id &&
          Number.isFinite(Number(item.quantity)) &&
          Number(item.quantity) > 0
        )
      : [];

    if (tokenExpired) lsRemove(LS_TOKEN, LS_CUSTOMER, LS_CART);
    this._sessionExpiredOnStart = tokenExpired;
    this._sessionExpiryHandled = false;

    this.state = {
      token:    safeToken,
      customer: safeCustomer,
      mycart:   safeCart,

      // Toast state (shared across the app)
      toast: null,  // { message, type: 'success'|'error'|'info'|'warn' }

      // ── Setters ──────────────────────────────────────────────────────────
      setToken: (token) => {
        const val = typeof token === 'string' ? token : '';
        lsSet(LS_TOKEN, val);
        this._sessionExpiryHandled = false;
        this.setState({ token: val });
        this.scheduleTokenExpiry(val);
      },

      setCustomer: (customer) => {
        lsSet(LS_CUSTOMER, customer);
        this.setState({ customer });
      },

      setMycart: (mycart) => {
        const val = Array.isArray(mycart) ? mycart : [];
        lsSet(LS_CART, val);
        this.setState({ mycart: val });
      },

      // ── Toast helper ─────────────────────────────────────────────────────
      showToast: (message, type = 'info') => {
        this.setState({ toast: { message, type } });
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(
          () => this.setState({ toast: null }),
          4000
        );
      },

      dismissToast: () => {
        clearTimeout(this._toastTimer);
        this.setState({ toast: null });
      },

      // ── Logout ───────────────────────────────────────────────────────────
      logout: (reason) => this.logout(reason),
    };

    _providerRef = this;
  }

  componentDidMount() {
    _providerRef = this;
    if (this._sessionExpiredOnStart) {
      this.logout('SESSION_EXPIRED');
    } else {
      this.scheduleTokenExpiry(this.state.token);
    }
  }

  componentWillUnmount() {
    clearTimeout(this._toastTimer);
    clearTimeout(this._expiryTimer);
    if (_providerRef === this) _providerRef = null;
  }

  scheduleTokenExpiry(token) {
    clearTimeout(this._expiryTimer);
    const expiresAt = getTokenExpiry(token);
    if (!expiresAt) return;

    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      this.logout('SESSION_EXPIRED');
      return;
    }

    this._expiryTimer = setTimeout(
      () => this.scheduleTokenExpiry(token),
      Math.min(remaining, MAX_TIMEOUT)
    );
  }

  logout(reason) {
    if (reason === 'SESSION_EXPIRED' && this._sessionExpiryHandled) return;
    if (reason === 'SESSION_EXPIRED') this._sessionExpiryHandled = true;
    clearTimeout(this._expiryTimer);
    lsRemove(LS_TOKEN, LS_CUSTOMER, LS_CART);
    this.setState(
      {
        token: '',
        customer: null,
        mycart: [],
        toast: reason === 'SESSION_EXPIRED'
          ? { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', type: 'warn' }
          : null,
      },
      () => {
        if (reason === 'SESSION_EXPIRED') {
          navigateToLogin();
        }
      }
    );
  }

  render() {
    return (
      <MyContext.Provider value={this.state}>
        {this.props.children}
      </MyContext.Provider>
    );
  }
}

export default MyProvider;
