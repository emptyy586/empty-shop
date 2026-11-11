import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import ProductDetailComponent from './ProductDetailComponent';
import Loading from './ui/Loading';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';
import formatMoney from '../utils/formatMoney';

const PAGE_SIZE = 8;

class ProductComponent extends Component {
  static contextType = MyContext;

  state = { products: [], curPage: 1, itemSelected: null, loading: true, error: '', search: '' };

  componentDidMount() {
    this.apiGetProducts(1);
  }

  apiGetProducts = async (page = this.state.curPage) => {
    this.setState({ loading: true, error: '' });
    try {
      const config = { headers: { 'x-access-token': this.context.token } };
      const firstPage = await axios.get('/api/admin/products', {
        ...config, params: { page: 1 },
      });
      if (firstPage.data?.success === false || !Array.isArray(firstPage.data?.products)) {
        throw new Error(firstPage.data?.message || 'Không thể tải sản phẩm.');
      }
      const serverPages = Number(firstPage.data.noPages) || 0;
      const remaining = await Promise.all(Array.from(
        { length: Math.max(0, serverPages - 1) },
        (_, index) => axios.get('/api/admin/products', { ...config, params: { page: index + 2 } })
      ));
      if (remaining.some((response) =>
        response.data?.success === false || !Array.isArray(response.data?.products)
      )) throw new Error('Không thể tải toàn bộ sản phẩm.');
      const products = [
        ...firstPage.data.products,
        ...remaining.flatMap((response) => response.data.products),
      ];
      const pageCount = Math.ceil(products.length / PAGE_SIZE);
      this.setState({ products, curPage: Math.min(page, Math.max(pageCount, 1)), loading: false });
    } catch (error) {
      this.setState({ error: error.response?.data?.message || error.message || 'Không thể tải sản phẩm.', loading: false });
    }
  };

  render() {
    const { products, curPage, itemSelected, loading, error, search } = this.state;
    const filtered = products.filter((item) =>
      `${item.name || ''} ${item.category?.name || ''} ${item._id || ''}`.toLowerCase().includes(search.toLowerCase())
    );
    const visible = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    return (
      <div className="admin-panels">
        <section className="admin-panel admin-list glass">
          <h2 className="text-center">SẢN PHẨM</h2>
          <div className="list-toolbar">
            <label htmlFor="product-search" className="sr-only">Tìm sản phẩm</label>
            <input id="product-search" type="search" placeholder="Tìm sản phẩm..." value={search}
              onChange={(event) => this.setState({ search: event.target.value, curPage: 1 })} />
            <span className="list-count">{filtered.length} kết quả</span>
          </div>
          {loading && <Loading text="Đang tải sản phẩm..." />}
          {!loading && error && <ErrorState message={error} onRetry={() => this.apiGetProducts(curPage)} />}
          {!loading && !error && filtered.length === 0 && <EmptyState title="Không có sản phẩm" message={search ? 'Không tìm thấy sản phẩm phù hợp.' : 'Chưa có sản phẩm trong danh sách.'} />}
          {!loading && !error && filtered.length > 0 && (
            <div className="table-scroll">
              <table className="table-bordered">
                <thead><tr><th>Mã</th><th>Tên</th><th>Giá</th><th>Ảnh</th><th>Danh mục</th><th>Ngày tạo</th></tr></thead>
                <tbody>{visible.map((item) => (
                  <tr key={item._id} onClick={() => this.setState({ itemSelected: item })} tabIndex="0"
                    onKeyDown={(event) => event.key === 'Enter' && this.setState({ itemSelected: item })}>
                    <td>{item._id}</td><td>{item.name}</td><td>{formatMoney(item.price)}</td>
                    <td>{item.image && <img loading="lazy" src={item.image} alt={item.name || ''} className="table-product-image" />}</td>
                    <td>{item.category?.name}</td><td>{item.cdate ? new Date(item.cdate).toLocaleDateString('vi-VN') : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {pageCount > 1 && <div className="pagination">
            <button type="button" className="btn btn-glass" disabled={curPage <= 1 || loading} onClick={() => this.setState({ curPage: curPage - 1 })}>Trước</button>
            <span>Trang {curPage} / {pageCount}</span>
            <button type="button" className="btn btn-glass" disabled={curPage >= pageCount || loading} onClick={() => this.setState({ curPage: curPage + 1 })}>Sau</button>
          </div>}
        </section>
        <ProductDetailComponent item={itemSelected} updateProducts={() => this.apiGetProducts(curPage)} />
      </div>
    );
  }
}

export default ProductComponent;
