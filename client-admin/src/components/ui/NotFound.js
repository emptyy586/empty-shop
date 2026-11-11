import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="admin-page">
      <section className="glass not-found">
        <p className="not-found-code">404</p>
        <h1>Không tìm thấy trang</h1>
        <p>Địa chỉ bạn truy cập không tồn tại.</p>
        <Link className="btn btn-primary" to="/admin/home">Về tổng quan</Link>
      </section>
    </main>
  );
}
