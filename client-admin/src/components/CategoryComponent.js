import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import CategoryDetailComponent from './CategoryDetailComponent';
import Loading from './ui/Loading';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';

const PAGE_SIZE = 8;

class CategoryComponent extends Component {
  static contextType = MyContext;

  state = { categories: [], itemSelected: null, loading: true, error: '', search: '', page: 1 };

  componentDidMount() {
    this.apiGetCategories();
  }

  apiGetCategories = async () => {
    this.setState({ loading: true, error: '' });
    try {
      const res = await axios.get('/api/admin/categories', {
        headers: { 'x-access-token': this.context.token },
      });
      if (!Array.isArray(res.data)) throw new Error(res.data?.message || 'Không thể tải danh mục.');
      this.setState({ categories: res.data, loading: false });
    } catch (error) {
      this.setState({ error: error.response?.data?.message || error.message || 'Không thể tải danh mục.', loading: false });
    }
  };

  render() {
    const { categories, itemSelected, loading, error, search, page } = this.state;
    const filtered = categories.filter((item) => (item.name || '').toLowerCase().includes(search.toLowerCase()));
    const pages = Math.ceil(filtered.length / PAGE_SIZE);
    const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
      <div className="admin-panels">
        <section className="admin-panel admin-list glass">
          <h2 className="text-center">DANH MỤC</h2>
          <div className="list-toolbar">
            <label className="sr-only" htmlFor="category-search">Tìm danh mục</label>
            <input id="category-search" type="search" placeholder="Tìm danh mục..." value={search}
              onChange={(event) => this.setState({ search: event.target.value, page: 1 })} />
            <span className="list-count">{filtered.length} kết quả</span>
          </div>
          {loading && <Loading text="Đang tải danh mục..." />}
          {!loading && error && <ErrorState message={error} onRetry={this.apiGetCategories} />}
          {!loading && !error && filtered.length === 0 && <EmptyState title="Chưa có danh mục" message="Thêm danh mục mới hoặc đổi từ khóa tìm kiếm." />}
          {!loading && !error && visible.length > 0 && (
            <div className="table-scroll">
              <table className="table-bordered">
                <thead><tr><th>Mã</th><th>Tên danh mục</th></tr></thead>
                <tbody>{visible.map((item) => (
                  <tr key={item._id} onClick={() => this.setState({ itemSelected: item })} tabIndex="0"
                    onKeyDown={(event) => event.key === 'Enter' && this.setState({ itemSelected: item })}>
                    <td>{item._id}</td><td>{item.name}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {pages > 1 && <div className="pagination" aria-label="Phân trang danh mục">
            <button type="button" className="btn btn-glass" disabled={page === 1} onClick={() => this.setState({ page: page - 1 })}>Trước</button>
            <span>{page} / {pages}</span>
            <button type="button" className="btn btn-glass" disabled={page === pages} onClick={() => this.setState({ page: page + 1 })}>Sau</button>
          </div>}
        </section>
        <CategoryDetailComponent item={itemSelected} updateCategories={this.apiGetCategories} />
      </div>
    );
  }
}

export default CategoryComponent;
