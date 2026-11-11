import { Component } from 'react';
import MyContext from '../../contexts/MyContext';

/*
 * Toast – thông báo nổi, tự ẩn sau 4 s, có nút đóng.
 * Nhận toast state từ MyContext: { message, type }
 * type: 'success' | 'error' | 'warn' | 'info'
 *
 * CSS variables used (với fallback trung tính):
 *   --toast-success, --toast-error, --toast-warn, --toast-info
 *   --toast-fg, --radius, --z-toast
 */

const ICON = {
  success: <path d="m5 12 4 4L19 6" />,
  error: <path d="m6 6 12 12M18 6 6 18" />,
  warn: <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
};

class Toast extends Component {
  static contextType = MyContext;

  render() {
    const { toast, dismissToast } = this.context;
    if (!toast) return null;

    const type = toast.type || 'info';
    const icon = ICON[type] || ICON.info;

    return (
      <>
        <div className="toast-wrapper" aria-live="polite" aria-atomic="true" role="status">
          <div className={`toast toast-${type}`}>
            <svg className="toast-icon" viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={dismissToast}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        </div>
      </>
    );
  }
}

export default Toast;
