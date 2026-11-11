import React, { Component } from 'react';
import axios from 'axios';
import MyContext from './MyContext';

// ─── localStorage helpers ───────────────────────────────────────────────────
const LS_TOKEN    = 'esa_token';
const LS_USERNAME = 'esa_username';
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
  if (window.location.pathname !== '/admin' && window.location.pathname !== '/') {
    window.history.replaceState(null, '', '/admin');
    window.dispatchEvent(new Event('popstate'));
  }
}

// ─── Axios 401 interceptor ───────────────────────────────────────────────────
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
    const username = lsGet(LS_USERNAME, '');

    const storedToken = typeof token === 'string' ? token : '';
    const tokenExpired = isTokenExpired(storedToken);
    const safeToken = tokenExpired ? '' : storedToken;
    const safeUsername = typeof username === 'string' ? username : '';

    if (tokenExpired) lsRemove(LS_TOKEN, LS_USERNAME);
    this._sessionExpiredOnStart = tokenExpired;
    this._sessionExpiryHandled = false;

    this.state = {
      token:    safeToken,
      username: safeUsername,

      // Toast state (shared across the admin app)
      toast: null,  // { message, type: 'success'|'error'|'info'|'warn' }

      // ── Setters ──────────────────────────────────────────────────────────
      setToken: (token) => {
        const val = typeof token === 'string' ? token : '';
        lsSet(LS_TOKEN, val);
        this._sessionExpiryHandled = false;
        this.setState({ token: val });
        this.scheduleTokenExpiry(val);
      },

      setUsername: (username) => {
        const val = typeof username === 'string' ? username : '';
        lsSet(LS_USERNAME, val);
        this.setState({ username: val });
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
    lsRemove(LS_TOKEN, LS_USERNAME);
    this.setState(
      {
        token: '',
        username: '',
        toast: reason === 'SESSION_EXPIRED'
          ? { message: 'Phiên đăng nhập admin đã hết hạn.', type: 'warn' }
          : null,
      },
      () => {
        if (reason === 'SESSION_EXPIRED') navigateToLogin();
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
