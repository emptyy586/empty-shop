import React, { Component, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import ThemeToggle from './ui/ThemeToggle';

function AdminNavigation({ onNavClick }) {
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const initialPositioned = useRef(false);

  const moveIndicator = useCallback(() => {
    const nav = navRef.current;
    const selected = nav?.querySelector('[aria-current="page"]');
    const indicator = indicatorRef.current;
    if (!nav || !indicator || !selected) return;
    const parent = nav.getBoundingClientRect();
    const active = selected.getBoundingClientRect();
    indicator.style.width = `${active.width}px`;
    indicator.style.height = `${active.height}px`;
    indicator.style.transform = `translate3d(${active.left - parent.left}px, ${active.top - parent.top}px, 0)`;
    indicator.style.opacity = '1';
  }, []);

  useLayoutEffect(() => {
    if (initialPositioned.current) return;
    const indicator = indicatorRef.current;
    if (!indicator) return;
    indicator.style.transition = 'none';
    moveIndicator();
    indicator.getBoundingClientRect();
    requestAnimationFrame(() => {
      indicator.style.removeProperty('transition');
      initialPositioned.current = true;
    });
  }, [moveIndicator]);

  useEffect(() => {
    if (!initialPositioned.current) return;
    moveIndicator();
  }, [moveIndicator, pathname]);

  useEffect(() => {
    window.addEventListener('resize', moveIndicator);
    return () => window.removeEventListener('resize', moveIndicator);
  }, [moveIndicator]);

  return (
    <nav ref={navRef} aria-label="Điều hướng quản trị">
      <span className="admin-nav-indicator" ref={indicatorRef} aria-hidden="true" />
      <NavLink to="/admin/home" onClick={onNavClick}>Tổng quan</NavLink>
      <NavLink to="/admin/category" onClick={onNavClick}>Danh mục</NavLink>
      <NavLink to="/admin/product" onClick={onNavClick}>Sản phẩm</NavLink>
      <NavLink to="/admin/customer" onClick={onNavClick}>Khách hàng</NavLink>
      <NavLink to="/admin/order" onClick={onNavClick}>Đơn hàng</NavLink>
    </nav>
  );
}

class MenuComponent extends Component {
  static contextType = MyContext;

  state = { mobileOpen: false };

  handleLogout = () => {
    this.context.logout();
  };

  closeMobile = () => this.setState({ mobileOpen: false });

  render() {
    const { mobileOpen } = this.state;

    return (
      <>
        {/* Mobile top bar */}
        <div className="av2-mobile-header">
          <Link className="av2-mobile-brand" to="/admin/home" onClick={this.closeMobile}>
            EMPTY SHOP <span>ADMIN</span>
          </Link>
          <button
            type="button"
            className="av2-hamburger"
            onClick={() => this.setState({ mobileOpen: true })}
            aria-label="Mở menu điều hướng"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {/* Overlay */}
        {mobileOpen && (
          <div className="av2-drawer-overlay" onClick={this.closeMobile} aria-hidden="true" />
        )}

        {/* Sidebar */}
        <aside className={`admin-sidebar glass${mobileOpen ? ' av2-drawer-open' : ''}`}>
          <Link className="admin-brand" to="/admin/home" onClick={this.closeMobile}>
            EMPTY SHOP <span>ADMIN</span>
          </Link>
          <AdminNavigation onNavClick={this.closeMobile} />
          <div className="admin-sidebar-footer">
            <span className="admin-greeting">{this.context.username}</span>
            <ThemeToggle />
            <button type="button" className="btn btn-glass" onClick={this.handleLogout}>Đăng xuất</button>
          </div>
        </aside>
      </>
    );
  }
}

export default MenuComponent;
