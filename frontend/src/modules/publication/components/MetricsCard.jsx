import React from 'react';
import {
  Eye, Download, Bookmark, ThumbsUp, Quote, BarChart3, Star, Clock
} from 'lucide-react';

const formatNumber = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

const MetricItem = ({ icon: Icon, label, value, colorClass = 'text-slate-600', bgClass = 'bg-slate-50' }) => (
  <div className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl ${bgClass}`}>
    <Icon className={`w-4 h-4 mb-1 ${colorClass}`} />
    <span className="text-[11px] font-black text-slate-900">{formatNumber(value)}</span>
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</span>
  </div>
);

const MetricsCard = ({ publication, bookmarked = false, recommended = false }) => {
  if (!publication) return null;

  const {
    views = 0,
    downloads = 0,
    citations = 0,
    recommendations = 0,
    researchScore = 0,
    readingTime = 5,
    comments = 0,
  } = publication;

  const bookmarkCount = publication?.bookmarkCount || 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
        Impact Metrics
      </h3>

      <div className="grid grid-cols-3 gap-2">
        <MetricItem icon={Eye} label="Reads" value={views} bgClass="bg-blue-50/60" colorClass="text-blue-500" />
        <MetricItem icon={Download} label="Downloads" value={downloads} bgClass="bg-emerald-50/60" colorClass="text-emerald-500" />
        <MetricItem icon={Quote} label="Citations" value={citations} bgClass="bg-amber-50/60" colorClass="text-amber-500" />
        <MetricItem icon={Bookmark} label="Saved" value={bookmarkCount} bgClass={bookmarked ? 'bg-blue-50' : 'bg-slate-50'} colorClass={bookmarked ? 'text-blue-600' : 'text-slate-400'} />
        <MetricItem icon={ThumbsUp} label="Recs" value={recommendations} bgClass={recommended ? 'bg-purple-50' : 'bg-slate-50'} colorClass={recommended ? 'text-purple-600' : 'text-slate-400'} />
        <MetricItem icon={BarChart3} label="Score" value={researchScore} bgClass="bg-slate-50" colorClass="text-slate-500" />
      </div>

      {/* Reading Time */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-600 font-semibold">
          ~{readingTime} min read
        </span>
      </div>

      {/* Research Score Bar */}
      {researchScore > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
            <span>Research Score</span>
            <span>{researchScore}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
              style={{ width: `${Math.min(100, researchScore)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsCard;
