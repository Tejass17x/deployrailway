import { useState, useEffect, useRef } from 'react';

/**
 * Animate a number counting up from 0 to a target value.
 * @param {number} end - The target value
 * @param {object} options
 * @param {number} options.duration - Animation duration in ms (default: 2000)
 * @param {number} options.startOnMount - Start immediately (default: true)
 * @returns {{ count: number, start: () => void }}
 */
export const useCountUp = (end, { duration = 2000, startOnMount = true } = {}) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);

  const start = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    startTimeRef.current = null;
    setCount(0);

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      // easeOutQuart for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (startOnMount && end > 0) {
      start();
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, startOnMount]);

  return { count, start };
};
