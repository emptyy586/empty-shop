import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import ConfirmDialog from './ui/ConfirmDialog';

class CategoryDetailComponent extends Component {
  static contextType = MyContext;

  state = { txtID: '', txtName: '', errors: {}, submitting: false, confirmDelete: false };

  componentDidUpdate(prevProps) {
    if (this.props.item !== prevProps.item) {
      this.setState({
        txtID: this.props.item?._id || '',
        txtName: this.props.item?.name || '',
        errors: {},
      });
    }
  }

  validate = (needsId = false) => {
    const errors = {};
    if (needsId && !this.state.txtID.trim()) errors.id = 'Chọn danh mục cần thao tác.';
    if (!this.state.txtName.trim()) errors.name = 'Vui lòng nhập tên danh mục.';
    return errors;
  };

  save = async (event, method) => {
    event.preventDefault();
    if (this.state.submitting) return;
    const errors = this.validate(method !== 'add');
    this.setState({ errors });
    if (Object.keys(errors).length) return;
    this.setState({ submitting: true });
    const name = this.state.txtName.trim();
    const config = { headers: { 'x-access-token': this.context.token } };
    try {
      const response = method === 'add'
        ? await axios.post('/api/admin/categories', { name }, config)
        : await axios.put(`/api/admin/categories/${this.state.txtID}`, { _id: this.state.txtID, name }, config);
      if (!response.data || response.data.success === false) throw new Error(response.data?.message || 'Không thể lưu danh mục.');
      this.context.showToast(method === 'add' ? 'Đã thêm danh mục.' : 'Đã cập nhật danh mục.', 'success');
      if (method === 'add') this.setState({ txtID: '', txtName: '', errors: {} });
      this.props.updateCategories();
    } catch (error) {
      this.context.showToast(error.response?.data?.message || error.message || 'Không thể lưu danh mục.', 'error');
    } finally {
      this.setState({ submitting: false });
    }
  };

  deleteCategory = async () => {
    if (this.state.submitting || !this.state.txtID) return;
    this.setState({ submitting: true, confirmDelete: false });
    try {
      const response = await axios.delete(`/api/admin/categories/${this.state.txtID}`, {
        headers: { 'x-access-token': this.context.token },
      });
      if (!response.data || response.data.success === false) throw new Error(response.data?.message || 'Không thể xóa danh mục.');
      this.context.showToast('Đã xóa danh mục.', 'success');
      this.setState({ txtID: '', txtName: '', errors: {} });
      this.props.updateCategories();
    } catch (error) {
      this.context.showToast(error.response?.data?.message || error.message || 'Không thể xóa danh mục.', 'error');
    } finally {
      this.setState({ submitting: false });
    }
  };

  render() {
    const { txtID, txtName, errors, submitting, confirmDelete } = this.state;
    return (
      <section className="admin-panel admin-detail glass">
        <h2 className="text-center">CHI TIẾT DANH MỤC</h2>
        <form className="admin-form" onSubmit={(event) => this.save(event, txtID ? 'update' : 'add')} noValidate>
          <label htmlFor="category-id">Mã danh mục</label>
          <input id="category-id" value={txtID} readOnly aria-describedby={errors.id ? 'category-id-error' : undefined} />
          {errors.id && <span id="category-id-error" className="field-error" role="alert">{errors.id}</span>}
          <label htmlFor="category-name">Tên danh mục</label>
          <input id="category-name" value={txtName} disabled={submitting}
            onChange={(event) => this.setState({ txtName: event.target.value, errors: { ...errors, name: '' } })} />
          {errors.name && <span className="field-error" role="alert">{errors.name}</span>}
          <div className="form-actions">
            <button className="btn btn-glass" type="button" disabled={submitting}
              onClick={() => this.setState({ txtID: '', txtName: '', errors: {} })}>Danh mục mới</button>
            {!txtID
              ? <button className="btn btn-primary" type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? 'Đang lưu...' : 'Thêm danh mục'}</button>
              : <>
                <button className="btn btn-primary" type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? 'Đang lưu...' : 'Cập nhật'}</button>
                <button className="btn btn-glass" type="button" disabled={submitting} onClick={() => this.setState({ confirmDelete: true })}>Xóa danh mục</button>
              </>}
          </div>
        </form>
        <ConfirmDialog open={confirmDelete} title="Xóa danh mục" message={`Bạn có chắc muốn xóa "${txtName}"?`}
          confirmLabel="Xóa danh mục" danger onConfirm={this.deleteCategory}
          onCancel={() => this.setState({ confirmDelete: false })} />
      </section>
    );
  }
}

export default CategoryDetailComponent;
