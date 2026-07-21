import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

const AbstractCard = ({ abstract }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const SHORT_LIMIT = 400;

  if (!abstract) return null;

  const isLong = abstract.length > SHORT_LIMIT;
  const displayText = expanded || !isLong ? abstract : abstract.slice(0, SHORT_LIMIT) + '…';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(abstract);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silent fail
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
          Abstract
        </h2>
        <button
          onClick={handleCopy}
          title="Copy abstract"
          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Abstract Text */}
      <p className="text-sm text-slate-700 leading-relaxed text-justify">
        {displayText}
      </p>

      {/* Expand / Collapse */}
      {isLong && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors mt-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Read Full Abstract
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default AbstractCard;
