import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import UnreadBadge from './UnreadBadge';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-555 transition-all relative cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-500 hover:text-[#2563EB] transition-colors" />
        <UnreadBadge />
      </button>

      {isOpen && (
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default NotificationBell;
