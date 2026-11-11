import React, { useState } from 'react';

export default function PasswordInput({ className = '', ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="password-input-wrap">
      <input
        {...inputProps}
        className={`password-input-control${className ? ` ${className}` : ''}`}
        type={visible ? 'text' : 'password'}
      />
      <button
        type="button"
        className="password-input-toggle"
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={visible}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setVisible((current) => !current)}
      >
        <svg className={visible ? 'is-visible' : ''} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.7" />
          <path className="password-eye-slash" d="M4 20 20 4" />
        </svg>
      </button>
    </span>
  );
}
