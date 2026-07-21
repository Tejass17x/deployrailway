import React, { useState } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';

const ConnectionModal = ({ isOpen, onClose, onConfirm, isPending }) => {
  const [note, setNote] = useState('');
  const maxChars = 300;

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(note);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs z-[999] p-4">
      <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Send Connection Request</h3>
            <p className="text-[10px] text-[#475569] font-bold uppercase tracking-wider mt-0.5">Grow your academic network</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Personal Note (Optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.substring(0, maxChars))}
              placeholder="Hi, I would like to connect with you regarding our shared research interests."
              className="w-full h-28 p-3 text-xs border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-slate-900 placeholder-slate-400 font-semibold resize-none"
            />
            <div className="flex justify-end text-[10px] font-bold text-slate-400">
              <span className={note.length >= maxChars ? 'text-red-500' : ''}>
                {note.length} / {maxChars}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-55 hover:bg-slate-100 text-[#475569] rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#2563EB]/15"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPending ? 'Sending...' : 'Send Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectionModal;
