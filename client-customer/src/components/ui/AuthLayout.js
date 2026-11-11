import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function AuthLayout({ children, title }) {
  useEffect(() => {
    document.title = `${title} | EMPTY SHOP`;
    return () => {
      document.title = 'EMPTY SHOP';
    };
  }, [title]);

  return (
    <div className="auth-layout">
      <Link className="auth-home-link" to="/home">
        <span className="auth-home-brand">EMPTY SHOP</span>
        <span>← Quay lại trang chủ</span>
      </Link>
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
