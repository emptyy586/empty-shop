import React, { Component } from 'react';

class Loading extends Component {
  render() {
    const { text = 'Đang tải...', fullPage = false } = this.props;
    return (
      <>
        <div
          className={`loading-state${fullPage ? ' loading-full-page' : ''}`}
          role="status" aria-label={text}
        >
          <div className="loading-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span>{text}</span>
        </div>
      </>
    );
  }
}

export default Loading;
