import React, { useEffect, useRef, useState } from 'react';

export default function CountUp({ value, duration = 600 }) {
  const target = Number(value) || 0;
  const [count, setCount] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return undefined;
    }
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      setCount(Math.round(target * progress));
      if (progress < 1) frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameRef.current);
  }, [duration, target]);

  return <>{count}</>;
}
