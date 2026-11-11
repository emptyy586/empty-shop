import { useEffect, useRef, useState } from 'react';

export default function useCountUp(target, elementRef, duration = 600) {
  const numericTarget = Number(target);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!Number.isFinite(numericTarget)) return undefined;
    const node = elementRef.current;
    if (!node) {
      setValue(numericTarget);
      return undefined;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const begin = (animate) => {
      if (startedRef.current) {
        setValue(numericTarget);
        return;
      }
      startedRef.current = true;
      if (!animate || reducedMotion) {
        setValue(numericTarget);
        return;
      }
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        setValue(Math.round(numericTarget * progress));
        if (progress < 1) frameRef.current = window.requestAnimationFrame(tick);
      };
      frameRef.current = window.requestAnimationFrame(tick);
    };

    if (reducedMotion || node.getBoundingClientRect().top <= window.innerHeight) {
      begin(false);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      begin(true);
      observer.disconnect();
    }, { threshold: 0.05 });
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameRef.current);
    };
  }, [duration, elementRef, numericTarget]);

  return value;
}
