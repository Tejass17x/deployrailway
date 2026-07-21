import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Search, TrendingUp } from 'lucide-react';
import { fadeUp, staggerContainer, staggerItem } from './animations';
import { COLORS } from './ui';

const SUGGESTIONS = ['Try broader keywords', 'Remove year filter', 'Search all document types'];
const TRENDING = ['Large Language Models', 'CRISPR gene editing', 'Quantum Computing', 'Climate AI'];

const EmptyState = ({ onSuggestion, onTrending, hasQuery }) => {
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={fadeUp(reduce)}
      initial="hidden"
      animate="show"
      className="text-center py-20 px-8 bg-white rounded-2xl border border-[#E2E8F0]"
    >
      <motion.div
        animate={reduce ? {} : { y: [0, -8, 0] }}
        transition={reduce ? {} : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full mx-auto mb-6"
        style={{ backgroundColor: COLORS.lightBlue }}
      >
        {hasQuery ? <BookOpen className="w-10 h-10" style={{ color: COLORS.primary }} /> : <Search className="w-10 h-10" style={{ color: COLORS.primary }} />}
      </motion.div>

      <h3 className="text-[20px] font-bold text-[#0F172A]">
        {hasQuery ? 'No publications found' : 'Start your research journey'}
      </h3>
      <p className="text-sm text-[#475569] mt-2 max-w-sm mx-auto">
        {hasQuery
          ? 'Try refining your search keywords or adjusting your sidebar filters.'
          : 'Search millions of papers, or jump into a trending topic below.'}
      </p>

      {hasQuery && (
        <motion.div
          variants={staggerContainer(reduce, 0.08)}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-2 mt-6 max-w-xs mx-auto"
        >
          {SUGGESTIONS.map((tip) => (
            <motion.button
              key={tip}
              variants={staggerItem(reduce)}
              type="button"
              onClick={() => onSuggestion?.(tip)}
              whileHover={reduce ? {} : { y: -2 }}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#475569] hover:border-[#2563EB] hover:text-[#2563EB] transition-all duration-200"
            >
              {tip}
            </motion.button>
          ))}
        </motion.div>
      )}

      <div className="mt-8">
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" /> Trending Right Now
        </p>
        <motion.div
          variants={staggerContainer(reduce, 0.06)}
          initial="hidden"
          animate="show"
          className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto"
        >
          {TRENDING.map((topic) => (
            <motion.button
              key={topic}
              variants={staggerItem(reduce)}
              type="button"
              onClick={() => onTrending?.(topic)}
              whileHover={reduce ? {} : { scale: 1.04 }}
              whileTap={reduce ? {} : { scale: 0.97 }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[#E2E8F0] text-[#475569] hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all duration-200"
            >
              {topic}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EmptyState;
