import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, ChevronDown, CornerDownLeft } from 'lucide-react';
import SearchSuggestions from './SearchSuggestions';
import { GRADIENT } from './ui';

const DOCUMENT_TYPES = ['All', 'Journal Article', 'Conference Paper', 'Book Chapter', 'Book', 'Technical Report', 'Thesis'];
const POPULAR_TOPICS = ['Large Language Models', 'CRISPR', 'Quantum Computing', 'Climate AI', 'Protein Folding'];
const RECENTS_KEY = 'gs.recentSearches';

const readRecents = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
  } catch {
    return [];
  }
};

const SearchBar = ({ searchVal, setSearchVal, type, onTypeChange, onSubmit }) => {
  const reduce = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [recents, setRecents] = useState([]);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setRecents(readRecents());
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const commitSearch = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recents.filter((r) => r !== trimmed)].slice(0, 8);
    setRecents(next);
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
    }
    setShowSuggestions(false);
    onSubmit(trimmed);
  };

  const removeRecent = (term) => {
    const next = recents.filter((r) => r !== term);
    setRecents(next);
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPressed(true);
    setTimeout(() => setPressed(false), 150);
    commitSearch(searchVal);
  };

  return (
    <form onSubmit={handleFormSubmit} className="relative" ref={wrapperRef}>
      <motion.div
        className="bg-white rounded-2xl p-1.5 flex items-center"
        animate={
          focused && !reduce
            ? { boxShadow: ['0 8px 40px rgba(0,0,0,0.2)', '0 0 0 8px rgba(37,99,235,0.12)', '0 8px 40px rgba(0,0,0,0.2)'] }
            : { boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }
        }
        transition={focused && !reduce ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
      >
        <Search className="text-[#94A3B8] w-5 h-5 ml-3.5 flex-shrink-0" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => setFocused(false)}
          placeholder="Search by title, keywords, DOI, or abstract... (press / to focus)"
          aria-label="Search publications"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          className="flex-1 bg-transparent border-none focus:ring-0 text-[#0F172A] text-[15px] px-3 py-3.5 outline-none min-w-0"
        />
        <div className="relative border-l border-[#E2E8F0] flex-shrink-0">
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            aria-label="Filter by document type"
            className="appearance-none bg-transparent outline-none cursor-pointer text-[#475569] text-sm font-medium pl-4 pr-8 py-3.5"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
        </div>
        <motion.button
          type="submit"
          animate={{ scale: pressed ? 0.96 : 1 }}
          whileHover={reduce ? {} : { y: -1 }}
          transition={{ duration: 0.15 }}
          className="text-white font-bold px-7 py-3 rounded-xl mx-0.5 flex-shrink-0 flex items-center gap-2 shadow-md"
          style={{ background: GRADIENT }}
        >
          Search
          <CornerDownLeft className="w-3.5 h-3.5 opacity-70 hidden sm:inline" aria-hidden />
        </motion.button>
      </motion.div>

      <SearchSuggestions
        visible={showSuggestions}
        recentSearches={recents}
        onSelect={(term) => {
          setSearchVal(term);
          commitSearch(term);
        }}
        onRemoveRecent={removeRecent}
      />

      <div className="mt-4 flex items-center flex-wrap gap-2">
        <span className="text-white/40 text-xs mr-1">Try:</span>
        {POPULAR_TOPICS.map((topic) => (
          <button
            type="button"
            key={topic}
            onClick={() => {
              setSearchVal(topic);
              commitSearch(topic);
            }}
            className="bg-white/10 border border-white/20 text-white text-xs px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/25 transition-all duration-200"
          >
            {topic}
          </button>
        ))}
      </div>
    </form>
  );
};

export default SearchBar;
