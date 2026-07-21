import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronDown, Calendar,
  Filter, ArrowUpDown,
} from 'lucide-react';

const EASE_OUT = [0.22, 1, 0.36, 1];

// ── Dropdown menu component ───────────────────────────────────────────────────
const Dropdown = ({ icon: Icon, options, value, onChange, id }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative" id={id}>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${value !== options[0].value
            ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-blue-200'
            : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#BFDBFE] hover:text-[#2563EB]'
          }`}
        style={{ boxShadow: value !== options[0].value ? '0 4px 12px rgba(37,99,235,0.25)' : '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
        <span>{current.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="absolute top-full mt-2 left-0 z-50 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden"
            style={{
              minWidth: '200px',
              boxShadow: '0 16px 48px rgba(15,23,42,0.12)',
            }}
          >
            <div className="p-1.5 max-h-72 overflow-y-auto">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors duration-150 ${opt.value === value
                      ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                      : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                    }`}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Pill toggle button ─────────────────────────────────────────────────────────
const PillToggle = ({ label, active, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all duration-200 whitespace-nowrap ${active
        ? 'text-white shadow-md'
        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#BFDBFE] hover:text-[#2563EB]'
      }`}
    style={active ? { background: 'linear-gradient(135deg, #2563EB, #4F46E5)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' } : {}}
  >
    {label}
  </motion.button>
);

// ── Filter options ─────────────────────────────────────────────────────────────
const DATE_OPTIONS = [
  { value: 'all', label: 'Any Date' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'priority', label: 'By Priority' },
  { value: 'relevant', label: 'Most Relevant' },
];

const STATUS_PILLS = ['All', 'Unread', 'Read', 'Starred'];

// ── Main filter bar ───────────────────────────────────────────────────────────
const NotificationFilterBar = ({ filters, setFilters, totalResults }) => {
  const activeCount = [
    filters.dateRange !== 'all',
    filters.status !== 'All',
    filters.sort !== 'newest',
    !!filters.search,
  ].filter(Boolean).length;

  const clearAll = () =>
    setFilters({
      search: '',
      dateRange: 'all',
      type: 'all',
      priority: 'All',
      status: 'All',
      sort: 'newest',
    });

  return (
    <motion.div
      className="mb-4 sm:mb-6 space-y-2.5 sm:space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: EASE_OUT }}
    >
      {/* Row 1: search + dropdowns */}
      <div className="flex flex-wrap gap-2.5 items-center">
        {/* Date filter */}
        <Dropdown
          id="notif-date-filter"
          label="Date"
          icon={Calendar}
          options={DATE_OPTIONS}
          value={filters.dateRange}
          onChange={(v) => setFilters((f) => ({ ...f, dateRange: v }))}
        />

        {/* Sort */}
        <Dropdown
          id="notif-sort-filter"
          label="Sort"
          icon={ArrowUpDown}
          options={SORT_OPTIONS}
          value={filters.sort}
          onChange={(v) => setFilters((f) => ({ ...f, sort: v }))}
        />

        {/* Active filters badge + clear */}
        {activeCount > 0 && (
          <motion.button
            onClick={clearAll}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] text-xs font-semibold transition-colors duration-150 hover:bg-[#FEE2E2]"
          >
            <X className="w-3.5 h-3.5" />
            Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
          </motion.button>
        )}

        {/* Results count */}
        {totalResults !== undefined && (
          <span className="ml-auto text-xs text-[#94A3B8] font-medium whitespace-nowrap">
            {totalResults} result{totalResults !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Row 2: status pills */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status label */}
        <div className="flex items-center gap-1.5 mr-1">
          <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="text-xs text-[#94A3B8] font-medium">Status:</span>
        </div>
        {STATUS_PILLS.map((s) => (
          <PillToggle
            key={s}
            label={s}
            active={filters.status === s}
            onClick={() => setFilters((f) => ({ ...f, status: s }))}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default NotificationFilterBar;
