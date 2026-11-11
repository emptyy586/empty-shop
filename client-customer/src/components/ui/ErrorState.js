import { Component } from 'react';

/*
 * ErrorState – lỗi mạng / server.
 * Props:
 *   message  {string}
 *   onRetry  {function}
 */

class ErrorState extends Component {
  render() {
    const {
      message = 'Đã xảy ra lỗi. Vui lòng thử lại.',
      onRetry,
    } = this.props;

    return (
      <div className="error-state glass" role="alert">
        <h3>Có lỗi xảy ra</h3>
        <p>{message}</p>
        {onRetry && (
          <button className="btn btn-glass" type="button" onClick={onRetry}>
            Thử lại
          </button>
        )}
      </div>
    );
  }
}

export default ErrorState;
