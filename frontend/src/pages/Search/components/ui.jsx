import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const COLORS = {
  primary: '#2563EB',
  indigo: '#4F46E5',
  green: '#22C55E',
  orange: '#F59E0B',
  red: '#EF4444',
  pageBg: '#F8FAFC',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#E2E8F0',
  lightBlue: '#DBEAFE',
  lightPurple: '#EDE9FE',
};

export const GRADIENT = 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)';

export const GlassPanel = ({ className = '', children, ...props }) => (
  <div
    className={`backdrop-blur-xl bg-white/80 border border-white/60 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const Badge = ({ icon: Icon, children, bg, color, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${className}`}
    style={{ backgroundColor: bg, color }}
  >
    {Icon && <Icon className="w-3 h-3" />}
    {children}
  </span>
);

export const Chip = ({ active, children, onClick, className = '', ...props }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${className}`}
    style={
      active
        ? { backgroundColor: '#EFF6FF', borderColor: COLORS.primary, color: COLORS.primary }
        : { backgroundColor: '#F8FAFC', borderColor: COLORS.border, color: COLORS.textSecondary }
    }
    {...props}
  >
    {children}
  </button>
);

export const Toggle = ({ checked, onChange, label, id }) => {
  const reduce = useReducedMotion();
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-3 cursor-pointer select-none">
      {label && <span className="text-sm text-[#475569]">{label}</span>}
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        id={id}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className="relative w-11 h-6 rounded-full flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
        style={{ backgroundColor: checked ? COLORS.green : COLORS.border, transition: 'background-color 200ms ease' }}
      >
        <motion.span
          className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
    </label>
  );
};

export const IconButton = ({ icon: Icon, label, onClick, active, className = '' }) => {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      whileHover={reduce ? {} : { y: -2 }}
      whileTap={reduce ? {} : { scale: 0.92 }}
      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${className}`}
      style={
        active
          ? { backgroundColor: '#EFF6FF', borderColor: COLORS.primary, color: COLORS.primary }
          : { backgroundColor: '#fff', borderColor: COLORS.border, color: COLORS.textSecondary }
      }
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  );
};

export const SectionLabel = ({ children }) => (
  <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2.5">{children}</p>
);

export const NotWiredHint = () => (
  <span
    className="text-[10px] font-semibold text-[#94A3B8] bg-[#F1F5F9] px-1.5 py-0.5 rounded"
    title="Visual filter — not yet connected to the search API"
  >
    UI ONLY
  </span>
);
