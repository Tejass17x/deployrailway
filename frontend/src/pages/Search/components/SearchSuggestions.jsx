import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Clock, TrendingUp, User, BookMarked, X } from 'lucide-react';
import { COLORS } from './ui';

const TRENDING_TOPICS = ['Large Language Models', 'CRISPR', 'Quantum Computing', 'Climate AI', 'Protein Folding'];
const POPULAR_AUTHORS = ['Dr. Fei-Fei Li', 'Dr. Yoshua Bengio', 'Dr. Jennifer Doudna'];
const POPULAR_JOURNALS = ['Nature', 'Science', 'Cell', 'NeurIPS'];

const Row = ({ icon: Icon, label, onClick, onRemove }) => (
  <div className="flex items-center group">
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm text-[#334155] hover:bg-[#F1F5F9] transition-colors duration-150"
    >
      <Icon className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
      <span className="truncate">{label}</span>
    </button>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove "${label}" from recent searches`}
        className="opacity-0 group-hover:opacity-100 p-1 mr-1 rounded text-[#94A3B8] hover:text-[#EF4444] transition-opacity duration-150"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

const SearchSuggestions = ({ visible, recentSearches, onSelect, onRemoveRecent }) => {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : -8, scale: reduce ? 1 : 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduce ? 0 : -8, scale: reduce ? 1 : 0.98 }}
          transition={{ duration: reduce ? 0.01 : 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 right-0 top-[calc(100%+10px)] bg-white rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.18)] border border-[#E2E8F0] p-3 z-20 grid grid-cols-1 sm:grid-cols-2 gap-3"
          role="listbox"
        >
          {recentSearches.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider px-3 mb-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Recent Searches
              </p>
              {recentSearches.slice(0, 5).map((term) => (
                <Row
                  key={term}
                  icon={Clock}
                  label={term}
                  onClick={() => onSelect(term)}
                  onRemove={() => onRemoveRecent(term)}
                />
              ))}
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider px-3 mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" style={{ color: COLORS.orange }} /> Trending Topics
            </p>
            {TRENDING_TOPICS.slice(0, 5).map((term) => (
              <Row key={term} icon={TrendingUp} label={term} onClick={() => onSelect(term)} />
            ))}
          </div>

          <div>
            <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider px-3 mb-1 flex items-center gap-1.5">
              <User className="w-3 h-3" /> Popular Authors
            </p>
            {POPULAR_AUTHORS.map((name) => (
              <Row key={name} icon={User} label={name} onClick={() => onSelect(name)} />
            ))}
          </div>

          <div>
            <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider px-3 mb-1 flex items-center gap-1.5">
              <BookMarked className="w-3 h-3" /> Popular Journals
            </p>
            {POPULAR_JOURNALS.map((name) => (
              <Row key={name} icon={BookMarked} label={name} onClick={() => onSelect(name)} />
            ))}
          </div>

          <div className="sm:col-span-2 border-t border-[#F1F5F9] pt-2 px-3 flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>Press <kbd className="px-1.5 py-0.5 bg-[#F1F5F9] rounded border border-[#E2E8F0] font-mono">Enter</kbd> to search</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-[#F1F5F9] rounded border border-[#E2E8F0] font-mono">Esc</kbd> to close</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchSuggestions;
