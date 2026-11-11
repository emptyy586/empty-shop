import { Component } from 'react';

/*
 * ConfirmDialog – modal xác nhận.
 * Props:
 *   open     {boolean}
 *   title    {string}
 *   message  {string}
 *   onConfirm {function}
 *   onCancel  {function}
 *   confirmLabel {string} default "Xác nhận"
 *   cancelLabel  {string} default "Hủy"
 *   danger    {boolean}  – nút confirm màu đỏ
 *
 * Hành vi: đóng bằng Esc, khóa focus trong dialog.
 */

class ConfirmDialog extends Component {
  _boxRef = null;
  _prevFocus = null;

  componentDidUpdate(prev) {
    if (!prev.open && this.props.open) {
      this._prevFocus = document.activeElement;
      setTimeout(() => this._boxRef && this._boxRef.focus(), 10);
      document.addEventListener('keydown', this._onKey);
    }
    if (prev.open && !this.props.open) {
      document.removeEventListener('keydown', this._onKey);
      if (this._prevFocus) this._prevFocus.focus();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this._onKey);
  }

  _onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.props.onCancel();
    }
    // Trap Tab focus inside box
    if (e.key === 'Tab' && this._boxRef) {
      const focusable = this._boxRef.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (!this._boxRef.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  render() {
    const {
      open, title, message, onConfirm, onCancel,
      confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', danger = false,
    } = this.props;

    if (!open) return null;

    return (
      <div
        className="confirm-backdrop"
        onClick={(e) => e.target === e.currentTarget && onCancel()}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cdlg-title"
          aria-describedby="cdlg-message"
          tabIndex={-1}
          ref={(el) => { this._boxRef = el; }}
          className="confirm-dialog glass"
        >
          {title && <h3 id="cdlg-title">{title}</h3>}
          {message && <p id="cdlg-message">{message}</p>}
          <div className="confirm-actions">
            <button type="button" className="btn btn-glass" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ConfirmDialog;
