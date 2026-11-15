import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import ProductDetailComponent from './ProductDetailComponent';
import Loading from './ui/Loading';
import ErrorState from './ui/ErrorState';
import EmptyState from './ui/EmptyState';
import ConfirmDialog from './ui/ConfirmDialog';
import formatMoney from '../utils/formatMoney';

const PAGE_SIZE = 10;

class ProductComponent extends Component {
  static contextType = MyContext;

  state = {
    products: [], curPage: 1, itemSelected: null, formKey: 0,
    loading: true, error: '', search: '', filterCat: '',
    confirmDeleteItem: null, deleting: false,
  };

  componentDidMount() {
    this.apiGetProducts(1);
  }

  apiGetProducts = async (page = this.state.curPage) => {
    this.setState({ loading: true, error: '' });
    try {
      const config = { headers: { 'x-access-token': this.context.token } };
      const firstPage = await axios.get('/api/admin/products', { ...config, params: { page: 1 } });
      if (firstPage.data?.success === false || !Array.isArray(firstPage.data?.products)) {
        throw new Error(firstPage.data?.message || 'Không thể tải sản phẩm.');
      }
      const serverPages = Number(firstPage.data.noPages) || 0;
      const remaining = await Promise.all(
        Array.from({ length: Math.max(0, serverPages - 1) }, (_, i) =>
          axios.get('/api/admin/products', { ...config, params: { page: i + 2 } })
        )
      );
      if (remaining.some(r => r.data?.success === false || !Array.isArray(r.data?.products))) {
        throw new Error('Không thể tải toàn bộ sản phẩm.');
      }
      const products = [
        ...firstPage.data.products,
        ...remaining.flatMap(r => r.data.products),
      ];
      const pageCount = Math.ceil(products.length / PAGE_SIZE);
      this.setState({ products, curPage: Math.min(page, Math.max(pageCount, 1)), loading: false });
    } catch (error) {
      this.setState({
        error: error.response?.data?.message || error.message || 'Không thể tải sản phẩm.',
        loading: false,
      });
    }
  };

  handleNew = () => {
    this.setState(s => ({ itemSelected: null, formKey: s.formKey + 1 }));
  };

  askDelete = (item, e) => {
    e.stopPropagation();
    this.setState({ confirmDeleteItem: item });
  };

  doDelete = async () => {
    const item = this.state.confirmDeleteItem;
    if (!item) return;
    this.setState({ deleting: true, confirmDeleteItem: null });
    try {
      const res = await axios.delete(`/api/admin/products/${item._id}`, {
        headers: { 'x-access-token': this.context.token },
      });
      if (!res.data || res.data.success === false) throw new Error(res.data?.message || 'Không thể xóa.');
      this.context.showToast('Đã xóa sản phẩm.', 'success');
      this.setState(s => ({
        products: s.products.filter(p => p._id !== item._id),
        curPage: 1, deleting: false,
        itemSelected: s.itemSelected?._id === item._id ? null : s.itemSelected,
      }));
    } catch (err) {
      this.context.showToast(err.response?.data?.message || err.message || 'Không thể xóa.', 'error');
      this.setState({ deleting: false });
    }
  };

  render() {
    const { products, curPage, itemSelected, formKey, loading, error, search, filterCat, confirmDeleteItem } = this.state;

    // Unique categories from loaded products
    const categories = [...new Map(
      products.filter(p => p.category?._id).map(p => [p.category._id, p.category])
    ).values()];

    const filtered = products.filter(item => {
      const matchName = `${item.name || ''} ${item._id || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchCat = !filterCat || item.category?._id === filterCat;
      return matchName && matchCat;
    });
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const visible = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

    // Page numbers: show up to 5 around current page
    const totalPages = pageCount;
    const half = 2;
    let start = Math.max(1, curPage - half);
    let end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    const pageNums = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    return (
      <div className="admin-panels">
        {/* List panel */}
        <section className="admin-panel admin-list">
          {/* Toolbar */}
          <div className="av2-page-header">
            <h2 style={{ margin: 0 }}>Sản phẩm</h2>
            <button type="button" className="btn btn-primary" onClick={this.handleNew} disabled={loading}>
              + Thêm sản phẩm
            </button>
          </div>

          <div className="list-toolbar">
            <label htmlFor="product-search" className="sr-only">Tìm sản phẩm</label>
            <input
              id="product-search" type="search"
              placeholder="🔍 Tìm theo tên sản phẩm…"
              value={search}
              onChange={e => this.setState({ search: e.target.value, curPage: 1 })}
            />
            <select
              value={filterCat}
              onChange={e => this.setState({ filterCat: e.target.value, curPage: 1 })}
              aria-label="Lọc theo danh mục"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <span className="list-count">{filtered.length} sản phẩm</span>
          </div>

          {loading && <Loading text="Đang tải sản phẩm..." />}
          {!loading && error && <ErrorState message={error} onRetry={() => this.apiGetProducts(curPage)} />}
          {!loading && !error && filtered.length === 0 && (
            <EmptyState title="Không có sản phẩm" message={search || filterCat ? 'Không tìm thấy sản phẩm phù hợp.' : 'Chưa có sản phẩm trong danh sách.'} />
          )}

          {!loading && !error && filtered.length > 0 && (
            <>
              <div className="table-scroll">
                <table className="table-bordered">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Danh mục</th>
                      <th>Giá</th>
                      <th>Đã bán</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(item => (
                      <tr key={item._id}>
                        <td>
                          <div className="av2-product-cell">
                            {item.image
                              ? <img className="av2-product-thumb" loading="lazy"
                                  src={item.image} alt={item.name || ''} />
                              : <div className="av2-product-thumb-ph" />
                            }
                            <b>{item.name}</b>
                          </div>
                        </td>
                        <td>{item.category?.name || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{formatMoney(item.price)}</td>
                        <td style={{ color: 'var(--av2-mu, #6b5b61)' }}>{item.sold ?? '—'}</td>
                        <td>
                          <button type="button" className="av2-action-btn av2-action-edit"
                            onClick={() => this.setState({ itemSelected: item })}>Sửa</button>
                          <button type="button" className="av2-action-btn av2-action-delete"
                            onClick={e => this.askDelete(item, e)}>Xóa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pageCount > 1 && (
                <div className="av2-pagination">
                  <button className="av2-page-btn" disabled={curPage <= 1 || loading}
                    onClick={() => this.setState({ curPage: curPage - 1 })}>‹</button>
                  {pageNums.map(n => (
                    <button key={n} className={`av2-page-btn${n === curPage ? ' is-active' : ''}`}
                      onClick={() => this.setState({ curPage: n })} disabled={loading}>{n}</button>
                  ))}
                  <button className="av2-page-btn" disabled={curPage >= pageCount || loading}
                    onClick={() => this.setState({ curPage: curPage + 1 })}>›</button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Detail / form panel */}
        <ProductDetailComponent
          item={itemSelected}
          formKey={formKey}
          updateProducts={() => this.apiGetProducts(curPage)}
        />

        <ConfirmDialog
          open={!!confirmDeleteItem}
          title="Xóa sản phẩm"
          message={`Bạn có chắc muốn xóa "${confirmDeleteItem?.name || ''}"?`}
          confirmLabel="Xóa"
          danger
          onConfirm={this.doDelete}
          onCancel={() => this.setState({ confirmDeleteItem: null })}
        />
      </div>
    );
  }
}

export default ProductComponent;
