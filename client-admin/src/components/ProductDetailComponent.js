import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import ConfirmDialog from './ui/ConfirmDialog';
import ErrorState from './ui/ErrorState';
import Loading from './ui/Loading';
import formatMoney from '../utils/formatMoney';

class ProductDetailComponent extends Component {
  static contextType = MyContext;

  state = {
    txtID: '', txtName: '', txtPrice: '', txtImage: '', txtCategory: '',
    specs: [],
    categories: [], categoryLoading: true, categoryError: '', errors: {},
    submitting: false, imageLoading: false, confirmDelete: false,
  };

  componentDidMount() {
    this.apiGetCategories();
  }

  componentDidUpdate(prevProps) {
    if (this.props.item !== prevProps.item || this.props.formKey !== prevProps.formKey) {
      const item = this.props.item;
      this.setState({
        txtID: item?._id || '', txtName: item?.name || '',
        txtPrice: item?.price ?? '', txtImage: item?.image || '',
        txtCategory: item?.category?._id || '',
        specs: Array.isArray(item?.specs) ? item.specs.map(s => ({ ...s })) : [],
        errors: {},
      });
    }
  }

  apiGetCategories = async () => {
    this.setState({ categoryLoading: true, categoryError: '' });
    try {
      const res = await axios.get('/api/admin/categories', {
        headers: { 'x-access-token': this.context.token },
      });
      if (!Array.isArray(res.data)) throw new Error(res.data?.message || 'Không thể tải danh mục.');
      this.setState({ categories: res.data, categoryLoading: false });
    } catch (error) {
      this.setState({
        categoryError: error.response?.data?.message || error.message || 'Không thể tải danh mục.',
        categoryLoading: false,
      });
    }
  };

  validate = () => {
    const { txtName, txtPrice, txtCategory } = this.state;
    const errors = {};
    if (!txtName.trim()) errors.name = 'Vui lòng nhập tên sản phẩm.';
    if (txtPrice === '' || !Number.isFinite(Number(txtPrice)) || Number(txtPrice) <= 0)
      errors.price = 'Giá phải là số lớn hơn 0.';
    if (!txtCategory) errors.category = 'Vui lòng chọn danh mục.';
    return errors;
  };

  save = async (event, method) => {
    event.preventDefault();
    if (this.state.submitting || this.state.imageLoading) return;
    const errors = this.validate();
    this.setState({ errors });
    if (Object.keys(errors).length) return;
    this.setState({ submitting: true });
    const { txtID, txtName, txtPrice, txtImage, txtCategory, specs } = this.state;
    const cleanSpecs = specs.filter(s => (s.label || '').trim() || (s.value || '').trim());
    const product = {
      name: txtName.trim(), price: Number(txtPrice),
      image: txtImage, category: txtCategory,
      specs: cleanSpecs,
    };
    try {
      const config = { headers: { 'x-access-token': this.context.token } };
      const res = method === 'add'
        ? await axios.post('/api/admin/products', product, config)
        : await axios.put(`/api/admin/products/${txtID}`, product, config);
      if (!res.data || res.data.success === false) throw new Error(res.data?.message || 'Không thể lưu sản phẩm.');
      this.context.showToast(method === 'add' ? 'Đã thêm sản phẩm.' : 'Đã cập nhật sản phẩm.', 'success');
      if (method === 'add') {
        this.setState({ txtID: '', txtName: '', txtPrice: '', txtImage: '', txtCategory: '', specs: [], errors: {} });
      }
      this.props.updateProducts();
    } catch (error) {
      this.context.showToast(error.response?.data?.message || error.message || 'Không thể lưu sản phẩm.', 'error');
    } finally {
      this.setState({ submitting: false });
    }
  };

  deleteProduct = async () => {
    if (this.state.submitting || !this.state.txtID) return;
    const id = this.state.txtID;
    this.setState({ submitting: true, confirmDelete: false });
    try {
      const res = await axios.delete(`/api/admin/products/${id}`, {
        headers: { 'x-access-token': this.context.token },
      });
      if (!res.data || res.data.success === false) throw new Error(res.data?.message || 'Không thể xóa sản phẩm.');
      this.context.showToast('Đã xóa sản phẩm.', 'success');
      this.setState({ txtID: '', txtName: '', txtPrice: '', txtImage: '', txtCategory: '', specs: [], errors: {} });
      this.props.updateProducts();
    } catch (error) {
      this.context.showToast(error.response?.data?.message || error.message || 'Không thể xóa sản phẩm.', 'error');
    } finally {
      this.setState({ submitting: false });
    }
  };

  handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.context.showToast('Vui lòng chọn tệp hình ảnh.', 'error');
      event.target.value = '';
      return;
    }
    this.setState({ imageLoading: true });
    const reader = new FileReader();
    reader.onerror = () => {
      this.setState({ imageLoading: false });
      this.context.showToast('Không thể đọc tệp ảnh.', 'error');
    };
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => {
        this.setState({ imageLoading: false });
        this.context.showToast('Tệp ảnh không hợp lệ.', 'error');
      };
      image.onload = () => {
        const scale = Math.min(1, 800 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          this.setState({ imageLoading: false });
          this.context.showToast('Trình duyệt không thể xử lý ảnh này.', 'error');
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        this.setState({ txtImage: canvas.toDataURL('image/jpeg', 0.8), imageLoading: false });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // Specs handlers
  handleSpecChange = (i, field, value) => {
    this.setState(s => ({
      specs: s.specs.map((sp, idx) => idx === i ? { ...sp, [field]: value } : sp),
    }));
  };
  addSpec = () => this.setState(s => ({ specs: [...s.specs, { label: '', value: '' }] }));
  removeSpec = (i) => this.setState(s => ({ specs: s.specs.filter((_, idx) => idx !== i) }));

  render() {
    const {
      txtID, txtName, txtPrice, txtImage, txtCategory, specs,
      categories, categoryLoading, categoryError, errors,
      submitting, imageLoading, confirmDelete,
    } = this.state;

    return (
      <section className={`admin-panel admin-detail${this.props.item ? ' is-selected' : ''}`}>
        <h2 className="text-center">CHI TIẾT SẢN PHẨM</h2>
        {categoryLoading && <Loading text="Đang tải danh mục..." />}
        {!categoryLoading && categoryError && <ErrorState message={categoryError} onRetry={this.apiGetCategories} />}
        <form className="admin-form" onSubmit={e => this.save(e, txtID ? 'update' : 'add')} noValidate>
          <label htmlFor="pd-id">Mã sản phẩm</label>
          <input id="pd-id" value={txtID} readOnly />

          <label htmlFor="pd-name">Tên sản phẩm</label>
          <input id="pd-name" value={txtName} disabled={submitting}
            onChange={e => this.setState({ txtName: e.target.value, errors: { ...errors, name: '' } })} />
          {errors.name && <span className="field-error" role="alert">{errors.name}</span>}

          <label htmlFor="pd-price">Giá (USD)</label>
          <input id="pd-price" type="number" min="0.01" step="any" value={txtPrice} disabled={submitting}
            onChange={e => this.setState({ txtPrice: e.target.value, errors: { ...errors, price: '' } })} />
          {txtPrice !== '' && Number.isFinite(Number(txtPrice)) && Number(txtPrice) > 0 &&
            <span className="price-preview">Hiển thị: {formatMoney(txtPrice)}</span>}
          {errors.price && <span className="field-error" role="alert">{errors.price}</span>}

          <label htmlFor="pd-image">Ảnh sản phẩm</label>
          <input id="pd-image" type="file" accept="image/*" disabled={imageLoading || submitting}
            onChange={this.handleImageChange} />
          {imageLoading && <Loading text="Đang tối ưu ảnh..." />}
          {txtImage && <img loading="lazy" src={txtImage} alt="Xem trước sản phẩm" className="image-preview" />}

          <label htmlFor="pd-cat">Danh mục</label>
          <select id="pd-cat" value={txtCategory} disabled={categoryLoading || submitting}
            onChange={e => this.setState({ txtCategory: e.target.value, errors: { ...errors, category: '' } })}>
            <option value="">Chọn danh mục</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          {errors.category && <span className="field-error" role="alert">{errors.category}</span>}

          <label>Thông số kỹ thuật</label>
          <div className="av2-specs-editor">
            {specs.map((s, i) => (
              <div key={i} className="av2-spec-row">
                <input
                  placeholder="Nhãn (vd: Chip)"
                  value={s.label}
                  disabled={submitting}
                  onChange={e => this.handleSpecChange(i, 'label', e.target.value)}
                />
                <input
                  placeholder="Giá trị"
                  value={s.value}
                  disabled={submitting}
                  onChange={e => this.handleSpecChange(i, 'value', e.target.value)}
                />
                <button type="button" className="av2-spec-remove" disabled={submitting}
                  onClick={() => this.removeSpec(i)} aria-label="Xóa dòng">×</button>
              </div>
            ))}
            <button type="button" className="av2-specs-add" disabled={submitting} onClick={this.addSpec}>
              + Thêm dòng
            </button>
          </div>

          <div className="form-actions">
            <button className="btn btn-glass" type="button" disabled={submitting}
              onClick={() => this.setState({ txtID: '', txtName: '', txtPrice: '', txtImage: '', txtCategory: '', specs: [], errors: {} })}>
              Sản phẩm mới
            </button>
            {!txtID
              ? <button className="btn btn-primary" type="submit"
                  disabled={submitting || imageLoading || categoryLoading} aria-busy={submitting}>
                  {submitting ? 'Đang lưu...' : 'Thêm sản phẩm'}
                </button>
              : <>
                <button className="btn btn-primary" type="submit"
                  disabled={submitting || imageLoading || categoryLoading} aria-busy={submitting}>
                  {submitting ? 'Đang lưu...' : 'Cập nhật'}
                </button>
                <button className="btn btn-glass" type="button" disabled={submitting}
                  onClick={() => this.setState({ confirmDelete: true })}>Xóa sản phẩm</button>
              </>
            }
          </div>
        </form>
        <ConfirmDialog
          open={confirmDelete}
          title="Xóa sản phẩm"
          message={`Bạn có chắc muốn xóa "${txtName}"?`}
          confirmLabel="Xóa sản phẩm"
          danger
          onConfirm={this.deleteProduct}
          onCancel={() => this.setState({ confirmDelete: false })}
        />
      </section>
    );
  }
}

export default ProductDetailComponent;
