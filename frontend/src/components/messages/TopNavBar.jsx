import { useState, useEffect } from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import { CURRENT_USER } from '../../data/mockData';
import Avatar from '../ui/Avatar';

export default function TopNavBar() {
  const [bellRing, setBellRing] = useState(false);

  /* Bell wiggle every 8s */
  useEffect(() => {
    const id = setInterval(() => {
      setBellRing(true);
      setTimeout(() => setBellRing(false), 600);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="anim-nav-bar flex items-center justify-between h-16 px-6 bg-white border-b border-[#E2E8F0] sticky top-0 z-50 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-5">
        <span className="font-bold text-xl text-[#2563EB] tracking-tight select-none">
          ResearchConnect
        </span>
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-[#94A3B8] pointer-events-none" />
          <input
            className="search-input pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
            placeholder="Search conversations..."
            type="text"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="icon-btn p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors">
          <Bell
            size={20}
            className={`text-[#475569] ${bellRing ? 'bell-wiggle' : ''}`}
          />
        </button>
        <button className="icon-btn p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors">
          <Settings size={20} className="text-[#475569]" />
        </button>
        <Avatar
          src={CURRENT_USER.avatarUrl}
          name={CURRENT_USER.fullName}
          size="sm"
          className="cursor-pointer"
          showBorder
        />
      </div>
    </header>
  );
}
