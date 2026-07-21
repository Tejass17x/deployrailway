import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Filter, XCircle, X, Clock, Award, Eye,
  FileText, Globe, User, Briefcase, Calendar
} from 'lucide-react';
import { staggerContainer, staggerItem } from './animations';

const SectionTitle = ({ children }) => (
  <h4 className="text-[10px] 2xl:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2.5 ml-1 flex items-center gap-1.5">{children}</h4>
);

const CATEGORY_TABS = [
  { id: 'All', icon: Globe },
  { id: 'Researchers', icon: User },
  { id: 'Publications', icon: FileText },
  { id: 'Projects', icon: Briefcase },
];
const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest Works', icon: Clock },
  { value: 'mostCited', label: 'Most Cited', icon: Award },
  { value: 'trending', label: 'Trending (Views)', icon: Eye },
];

const RadioPill = ({ active, icon: Icon, label, onClick, delay }) => {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      variants={staggerItem(reduce)}
      onClick={onClick}
      className={`w-full group flex items-center justify-start text-left gap-2 2xl:gap-3 px-2.5 2xl:px-3 py-1.5 2xl:py-2 rounded-xl border text-[11px] xl:text-[12px] 2xl:text-[13px] font-bold transition-all duration-300 ${
        active 
          ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-100/50'
          : 'bg-transparent border-slate-200/60 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 hover:shadow-sm'
      }`}
    >
      <Icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 flex-shrink-0 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
      <span className="truncate">{label}</span>
    </motion.button>
  );
};

const FilterSidebar = ({ activeTab, setActiveTab, year, minCitations, sort, onFilterChange, onReset, isMobile, onClose }) => {
  const reduce = useReducedMotion();

  const toggleFromList = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const resetAll = () => {
    onFilterChange('minCitations', '');
    onReset();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={isMobile ? "w-full" : "bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl p-3 2xl:p-4 mb-8"}
    >
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm shadow-blue-500/20">
            <Filter className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-[11px] 2xl:text-xs font-black text-slate-800 uppercase tracking-widest">Filters</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-1.5 text-[11px] 2xl:text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors duration-200 px-2 py-1 hover:bg-rose-50 rounded-md"
          >
            <XCircle className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" /> Reset
          </button>
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2.5 2xl:space-y-3.5">
        <div>
          <SectionTitle>Category</SectionTitle>
          <div className="space-y-1.5">
            {CATEGORY_TABS.map((tab) => (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 2xl:gap-3 px-2.5 2xl:px-3 py-1.5 2xl:py-2 rounded-xl text-[12px] 2xl:text-[13px] font-bold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border border-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent'
                }`}
              >
                <tab.icon className={`w-4 h-4 2xl:w-4 2xl:h-4 transition-colors ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                {tab.id}
              </motion.button>
            ))}
          </div>
        </div>

        {(activeTab === 'Publications' || activeTab === 'All') && (
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        )}

        {(activeTab === 'Publications' || activeTab === 'All') && (
          <div>
            <SectionTitle>Publication Year</SectionTitle>
            <div className="relative group">
              <input
                type="number"
                value={year}
                onChange={(e) => onFilterChange('year', e.target.value)}
                placeholder="e.g. 2024"
                className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 2xl:px-4 py-1.5 2xl:py-2 text-[12px] 2xl:text-[13px] font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder:text-slate-400 group-hover:border-slate-300"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <Calendar className="w-4 h-4 2xl:w-4 2xl:h-4 text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'Publications' || activeTab === 'All') && (
          <div>
            <SectionTitle>Sort By</SectionTitle>
            <motion.div variants={staggerContainer(reduce, 0.06)} initial="hidden" animate="show" className="space-y-1">
              {SORT_OPTIONS.map((opt) => (
                <RadioPill
                  key={opt.value}
                  active={sort === opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  onClick={() => onFilterChange('sort', opt.value)}
                />
              ))}
            </motion.div>
          </div>
        )}

        {(activeTab === 'Publications' || activeTab === 'All' || activeTab === 'Researchers') && (
          <div>
            <SectionTitle>Minimum Citations</SectionTitle>
            <div className="relative group">
              <input
                type="number"
                min={0}
                value={minCitations || ''}
                onChange={(e) => onFilterChange('minCitations', e.target.value)}
                placeholder="e.g. 50"
                className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 2xl:px-4 py-1.5 2xl:py-2 text-[12px] 2xl:text-[13px] font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder:text-slate-400 group-hover:border-slate-300"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <Award className="w-4 h-4 2xl:w-4 2xl:h-4 text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FilterSidebar;
