import React from 'react';
import { Calendar, Filter } from 'lucide-react';

const TABS = [
  { id: 'all', name: 'All' },
  { id: 'unread', name: 'Unread' },
  { id: 'mention', name: 'Mentions' },
  { id: 'connection', name: 'Connections' },
  { id: 'publication', name: 'Publications' },
  { id: 'system', name: 'System' }
];

const DATE_FILTERS = [
  { id: 'all', name: 'All Time' },
  { id: 'today', name: 'Today' },
  { id: 'yesterday', name: 'Yesterday' },
  { id: 'week', name: 'Last 7 Days' },
  { id: 'month', name: 'Last 30 Days' }
];

const NotificationFilters = ({
  activeTab,
  setActiveTab,
  activeDateFilter,
  setActiveDateFilter
}) => {
  return (
    <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] space-y-4 text-left">
      {/* Category Tabs */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Filter by Category</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10'
                  : 'bg-slate-50 border-slate-250 text-[#475569] hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Date Filters */}
      <div className="space-y-2 border-t border-slate-100 pt-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Filter by Date</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DATE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveDateFilter(filter.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeDateFilter === filter.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10'
                  : 'bg-slate-50 border-slate-250 text-[#475569] hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationFilters;
export { TABS, DATE_FILTERS };
