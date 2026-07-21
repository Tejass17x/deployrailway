import React from 'react';

const TypingIndicator = ({ name = 'Researcher' }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl w-fit max-w-[200px] animate-pulse">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce duration-300" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce duration-300" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce duration-300" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        {name} is typing...
      </span>
    </div>
  );
};

export default TypingIndicator;
