export const fadeUp = (reduce, delay = 0) => ({
  hidden: { opacity: 0, y: reduce ? 0 : 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, delay } }
});
export const staggerContainer = (reduce, staggerChildren = 0.1) => ({
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren } }
});
export const staggerItem = (reduce) => ({
  hidden: { opacity: 0, y: reduce ? 0 : 10 },
  show: { opacity: 1, y: 0 }
});
export const fadeIn = (reduce, delay = 0) => ({
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, delay } }
});
