import React from 'react';
import useThemeTransition from '../../hooks/useThemeTransition';

export default function ThemeToggle() {
  const { theme, transitioning, toggleTheme } = useThemeTransition();

  return (
    <button
      className={`iconbtn theme-toggle${transitioning ? ' is-transitioning' : ''}`}
      type="button"
      aria-label={`Chuyển sang giao diện ${theme === 'dark' ? 'sáng' : 'tối'}`}
      aria-busy={transitioning}
      title={`Giao diện ${theme === 'dark' ? 'tối' : 'sáng'}`}
      onClick={toggleTheme}
      disabled={transitioning}
    >
      <svg className={`theme-icon theme-sun${theme === 'dark' ? ' is-active' : ''}`} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </svg>
      <svg className={`theme-icon theme-moon${theme === 'light' ? ' is-active' : ''}`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.7 8.7 0 1 0 20.2 15.1Z" />
      </svg>
    </button>
  );
}
