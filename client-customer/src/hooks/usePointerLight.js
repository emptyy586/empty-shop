import { useEffect } from 'react';

export default function usePointerLight(elementRef) {
  useEffect(() => {
    const node = elementRef.current;
    if (!node ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    let frame = 0;
    let point = null;
    const handleMove = (event) => {
      point = event;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty('--mx', `${((point.clientX - rect.left) / rect.width) * 100}%`);
        node.style.setProperty('--my', `${((point.clientY - rect.top) / rect.height) * 100}%`);
        frame = 0;
      });
    };
    const handleLeave = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };
    node.addEventListener('pointermove', handleMove);
    node.addEventListener('pointerleave', handleLeave);
    return () => {
      node.removeEventListener('pointermove', handleMove);
      node.removeEventListener('pointerleave', handleLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [elementRef]);
}
