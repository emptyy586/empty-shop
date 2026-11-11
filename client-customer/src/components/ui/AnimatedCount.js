import React, { useEffect, useRef, useState } from 'react';

export default function AnimatedCount({ value, duration = 300 }) {
  const target = Number(value) || 0;
  const [count, setCount] = useState(target);
  const countRef = useRef(target);
  const frameRef = useRef(0);

  useEffect(() => {
    if (countRef.current === target) return undefined;
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.visibilityState !== 'visible'
    ) {
      countRef.current = target;
      setCount(target);
      return undefined;
    }

    const startValue = countRef.current;
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / Math.max(1, duration));
      const nextCount = Math.round(startValue + (target - startValue) * progress);
      countRef.current = nextCount;
      setCount(nextCount);
      if (progress < 1) frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameRef.current);
  }, [duration, target]);

  return <>{count}</>;
}
