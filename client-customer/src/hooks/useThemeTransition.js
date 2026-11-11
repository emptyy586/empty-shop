import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'es-theme';

function getInitialTheme() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Theme remains usable when browser storage is unavailable.
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export default function useThemeTransition() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [transitioning, setTransitioning] = useState(false);
  const lockRef = useRef(false);
  const timerRef = useRef(0);

  const applyTheme = useCallback((nextTheme, persist) => {
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
    if (persist) {
      try {
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch {
        // The selected theme still applies for this session.
      }
    }
  }, []);

  const transitionTo = useCallback((nextTheme, persist = false) => {
    if (lockRef.current || nextTheme === document.documentElement.dataset.theme) return;
    const root = document.documentElement;
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.visibilityState !== 'visible'
    ) {
      applyTheme(nextTheme, persist);
      return;
    }

    lockRef.current = true;
    setTransitioning(true);
    const release = () => {
      lockRef.current = false;
      setTransitioning(false);
    };

    if (typeof document.startViewTransition === 'function') {
      try {
        const transition = document.startViewTransition(() => applyTheme(nextTheme, persist));
        Promise.resolve(transition.finished).then(release, release);
      } catch {
        applyTheme(nextTheme, persist);
        release();
      }
      return;
    }

    root.classList.add('theme-fading');
    applyTheme(nextTheme, persist);
    timerRef.current = window.setTimeout(() => {
      root.classList.remove('theme-fading');
      release();
    }, 650);
  }, [applyTheme]);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const syncSystemTheme = (event) => {
      let hasSavedTheme = false;
      try {
        hasSavedTheme = window.localStorage.getItem(STORAGE_KEY) === 'light' ||
          window.localStorage.getItem(STORAGE_KEY) === 'dark';
      } catch {
        hasSavedTheme = false;
      }
      if (!hasSavedTheme) transitionTo(event.matches ? 'light' : 'dark');
    };
    media.addEventListener?.('change', syncSystemTheme);
    return () => {
      media.removeEventListener?.('change', syncSystemTheme);
      window.clearTimeout(timerRef.current);
      document.documentElement.classList.remove('theme-fading');
    };
  }, [transitionTo]);

  const toggleTheme = useCallback(() => {
    transitionTo(theme === 'dark' ? 'light' : 'dark', true);
  }, [theme, transitionTo]);

  return { theme, transitioning, toggleTheme };
}
