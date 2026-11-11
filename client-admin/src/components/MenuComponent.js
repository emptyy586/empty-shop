import React, { Component, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import { NavLink, useLocation } from 'react-router-dom';
import ThemeToggle from './ui/ThemeToggle';

function AdminNavigation() {
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
      <NavLink to="/admin/home">Tổng quan</NavLink>
      <NavLink to="/admin/category">Danh mục</NavLink>
      <NavLink to="/admin/product">Sản phẩm</NavLink>
      <NavLink to="/admin/customer">Khách hàng</NavLink>
      <NavLink to="/admin/order">Đơn hàng</NavLink>
    </nav>
  );
}

class MenuComponent extends Component {
  static contextType = MyContext;

  handleLogout = () => {
    this.context.logout();
  };

  render() {
    return (
      <aside className="admin-sidebar glass">
        <Link className="admin-brand" to="/admin/home">EMPTY SHOP <span>ADMIN</span></Link>
        <AdminNavigation />
        <div className="admin-sidebar-footer">
          <span className="admin-greeting">{this.context.username}</span>
          <ThemeToggle />
          <button type="button" className="btn btn-glass" onClick={this.handleLogout}>Đăng xuất</button>
        </div>
      </aside>
    );
  }
}

export default MenuComponent;
