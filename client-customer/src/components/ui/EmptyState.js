import { Component } from 'react';

/*
 * EmptyState – màn hình rỗng.
 * Props:
 *   icon    {string}    emoji / icon text
 *   title   {string}
 *   message {string}
 *   action  {string}    nhãn nút hành động
 *   onAction {function}
 */

class EmptyState extends Component {
  render() {
    const {
      title = 'Không có dữ liệu',
      message,
      action,
      onAction,
    } = this.props;

    return (
      <div className="empty-state glass" role="status">
        <svg className="empty-state-icon" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M8 16.5 24 8l16 8.5v16L24 41 8 32.5z" />
          <path d="m8.5 16.5 15.5 9 15.5-9M24 26v14" />
        </svg>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        {action && onAction && (
          <button className="btn btn-primary" type="button" onClick={onAction}>
            {action}
          </button>
        )}
      </div>
    );
  }
}

export default EmptyState;
