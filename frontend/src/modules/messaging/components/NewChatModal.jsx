import React, { useState } from 'react';
import { X, Search, MessageSquare, Users } from 'lucide-react';
import UserAvatar from '../../../components/ui/Avatar';

const NewChatModal = ({ isOpen, onClose, contacts, onSelectContact }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // Merge and deduplicate contacts (connections, followers, following)
  const seen = new Set();
  const allContacts = [
    ...(contacts?.connections || []),
    ...(contacts?.followers || []),
    ...(contacts?.following || [])
  ].filter(p => {
    const id = p._id?.toString();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  // Filter based on search query
  const filtered = allContacts.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.username && c.username.toLowerCase().includes(search.toLowerCase())) ||
    (c.institution && c.institution.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs z-[999] p-4 select-none">
      <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">New Conversation</h3>
            <p className="text-[10px] text-[#475569] font-bold uppercase tracking-wider mt-0.5">Start a direct chat with a researcher</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, username or institution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>

        {/* List of contacts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((person) => (
              <div
                key={person._id}
                onClick={() => {
                  onSelectContact(person._id);
                  onClose();
                }}
                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="relative shrink-0">
                  <UserAvatar user={person} size="md" isOnline={person.isOnline} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="text-xs font-black text-slate-800 truncate">{person.firstName} {person.lastName}</h4>
                  <p className="text-[10px] text-slate-500 font-bold truncate">{person.designation || 'Researcher'}</p>
                  <p className="text-[10px] text-slate-400 font-semibold truncate">{person.institution}</p>
                </div>
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wide">
                  Select
                </span>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <Users className="w-10 h-10 mx-auto opacity-30 animate-pulse" />
              <p className="text-xs font-bold">No matching researchers found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
