import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';
import FilterSidebar from './FilterSidebar';

export const FilterDrawerTrigger = ({ onClick, activeCount = 0 }) => (
  <button
    type="button"
    onClick={onClick}
    className="lg:hidden flex items-center gap-1.5 sm:gap-2 bg-blue-50 border border-blue-100 rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 text-[11px] sm:text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-100 transition-colors whitespace-nowrap"
  >
    <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    Filters
    {activeCount > 0 && (
      <span className="bg-[#2563EB] text-white text-[9px] sm:text-[10px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
        {activeCount}
      </span>
    )}
  </button>
);

const FilterDrawer = ({ open, onClose, ...sidebarProps }) => {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && open && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: reduce ? 0.01 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 bottom-4 mx-auto w-[92%] sm:max-w-[400px] bg-[#F8FAFC] p-5 rounded-2xl shadow-2xl h-fit z-50"
          >
            <FilterSidebar {...sidebarProps} isMobile={true} onClose={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FilterDrawer;
