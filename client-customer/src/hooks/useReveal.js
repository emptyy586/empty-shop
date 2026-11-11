import { useLayoutEffect, useState } from 'react';

export default function useReveal(elementRef) {
  const [revealed, setRevealed] = useState(true);

  useLayoutEffect(() => {
    const node = elementRef.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      node.getBoundingClientRect().top <= window.innerHeight) return undefined;

    setRevealed(false);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setRevealed(true);
      observer.disconnect();
    }, { threshold: 0.05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [elementRef]);

  return revealed;
}
