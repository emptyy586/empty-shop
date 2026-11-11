import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteTransition({ children }) {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (previousPath.current === pathname) return undefined;
    previousPath.current = pathname;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const root = document.querySelector('.body-admin');
    root?.classList.add('is-route-changing');
    const timer = window.setTimeout(() => root?.classList.remove('is-route-changing'), 250);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return <>{children}</>;
}
