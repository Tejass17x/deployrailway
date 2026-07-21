import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Weekly performance bar chart ──────────────────────────────────────────────
const WeeklyBarChart = ({ bars = [] }) => {
  const ref      = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  const maxVal = Math.max(...bars.map((b) => b.value), 1);

  // Fixed chart area height in px
  const CHART_H = 48;
  const MIN_BAR = 3; // minimum visible bar height

  return (
    <div ref={ref} className="mt-4">
      <div
        className="flex items-end gap-[3px]"
        style={{ height: `${CHART_H}px` }}
        aria-label="Weekly notification activity chart"
      >
        {bars.map(({ day, value }, i) => {
          const barH = value > 0
            ? Math.max((value / maxVal) * (CHART_H - 8), MIN_BAR)
            : MIN_BAR;

          return (
            <div
              key={`${day}-${i}`}
              className="flex-1 flex flex-col items-center justify-end gap-[3px]"
              style={{ height: `${CHART_H}px` }}
            >
              <motion.div
                style={{
                  height:          `${barH}px`,
                  width:           '100%',
                  borderRadius:    '3px 3px 0 0',
                  background:      value > 0
                    ? 'linear-gradient(to top, #2563EB, #818CF8)'
                    : '#E9EEF4',
                  transformOrigin: 'bottom center',
                  flexShrink:      0,
                }}
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{
                  delay:     0.15 + i * 0.06,
                  type:      'spring',
                  stiffness: 300,
                  damping:   22,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Day labels */}
      <div className="flex gap-[3px] mt-1">
        {bars.map(({ day }, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[8px] text-[#CBD5E1] font-medium">
              {day[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Default fallback bar data (all zero) ──────────────────────────────────────
const EMPTY_BARS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => ({
  day,
  value: 0,
}));

// ── BentoCards component ──────────────────────────────────────────────────────
const BentoCards = ({ weeklyStats = {} }) => {
  const { weeklyReads = 0, weeklyCitations = 0, weeklyBars = EMPTY_BARS } = weeklyStats;
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-[#F1F5F9]">

      {/* Card A — Weekly Digest */}
      <motion.div
        className="group relative bg-gradient-to-br from-[#EFF6FF] via-[#F0F7FF] to-[#EDE9FE] border border-[#BFDBFE] rounded-2xl p-6 overflow-hidden cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{
          y: -5,
          boxShadow: '0 16px 40px rgba(37,99,235,0.14)',
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        }}
        style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.06)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#2563EB] opacity-[0.04]" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-[#4F46E5] opacity-[0.05]" />

        <div className="relative">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4 group-hover:shadow-md transition-shadow duration-200">
            <TrendingUp className="w-5 h-5 text-[#2563EB]" />
          </div>

          <h3 className="font-bold text-[#0F172A] text-[17px] mb-3">Weekly Digest</h3>

          {/* Stats row */}
          <div className="flex gap-5 mb-2">
            <div className="flex flex-col">
              <motion.span
                key={weeklyReads}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-2xl font-black text-[#2563EB] leading-none"
              >
                {weeklyReads}
              </motion.span>
              <span className="text-[12px] text-[#94A3B8] mt-0.5 font-medium">new reads</span>
            </div>
            <div className="w-px bg-[#E2E8F0]" />
            <div className="flex flex-col">
              <motion.span
                key={weeklyCitations}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="text-2xl font-black text-[#4F46E5] leading-none"
              >
                {weeklyCitations}
              </motion.span>
              <span className="text-[12px] text-[#94A3B8] mt-0.5 font-medium">citations</span>
            </div>
          </div>

          {/* Animated bar chart */}
          <WeeklyBarChart bars={weeklyBars.length > 0 ? weeklyBars : EMPTY_BARS} />

          {/* CTA link */}
          <button 
            onClick={() => navigate('/analytics')}
            className="mt-4 flex items-center gap-1.5 font-semibold text-[#2563EB] text-[13px] group/link relative"
          >
            Full Report
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-[5px]" />
            <span className="absolute -bottom-0.5 left-0 right-6 h-[1.5px] bg-[#2563EB] scale-x-0 origin-left group-hover/link:scale-x-100 transition-transform duration-200" />
          </button>
        </div>
      </motion.div>

      {/* Card B — Join Community */}
      <motion.div
        className="group relative bg-white border border-[#E2E8F0] rounded-2xl p-6 overflow-hidden cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{
          y: -5,
          borderColor: '#BFDBFE',
          boxShadow: '0 16px 40px rgba(37,99,235,0.10)',
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        }}
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <div className="flex gap-4 mb-4">
          {/* Icon square */}
          <motion.div
            className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)' }}
            whileHover={{ scale: 1.08, rotate: 6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Users className="w-7 h-7 text-white" />
          </motion.div>

          {/* Title + description */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#0F172A] text-[16px] mb-1.5">Join Community</h3>
            <p className="text-[13px] text-[#475569] leading-relaxed">
              Recommended based on your interest in{' '}
              <span className="inline-block px-1.5 py-0.5 rounded-md bg-[#EDE9FE] text-[#4F46E5] font-semibold text-[12px]">
                Bio-Informatics
              </span>
            </p>
          </div>
        </div>

        {/* Members row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {['#2563EB', '#4F46E5', '#22C55E'].map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ background: color, zIndex: 3 - i }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-[11px] text-[#94A3B8] font-medium">+2.4k members</span>
          </div>

          <button 
            onClick={() => navigate('/network')}
            className="flex items-center gap-1 font-bold text-[#2563EB] text-[13px] relative group/btn ml-auto"
          >
            Explore Groups
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-[4px]" />
            <span className="absolute -bottom-0.5 left-0 right-5 h-[1.5px] bg-[#2563EB] scale-x-0 origin-left group-hover/btn:scale-x-100 transition-transform duration-200" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BentoCards;
