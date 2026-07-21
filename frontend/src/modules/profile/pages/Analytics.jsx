import React from 'react';
import Avatar from '../../../components/ui/Avatar';
import { useOutletContext } from 'react-router-dom';
import { 
  FileText, TrendingUp, Award, BarChart2, Calendar, 
  BookMarked, ShieldCheck, BookOpen, Database, Download, Eye, Activity 
} from 'lucide-react';

const Analytics = () => {
  const { profile } = useOutletContext();

  return (
    <div className="space-y-6">
      {/* SVG Citation Graph Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">Citations Over Time</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Google Scholar Citation Index Graph</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{profile?.metrics?.totalCitations || 0}</p>
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total Citations</p>
          </div>
        </div>
        
        <CitationChart citationGraph={profile?.citationGraph || []} />
      </div>

      {/* Derived Analytics Grid Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">Derived Academic Analytics</h3>
        
        {profile?.derivedAnalytics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Publication Distribution</p>
              <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                <span>Journals: {profile.derivedAnalytics.journalPapers || 0}</span>
                <span>Conferences: {profile.derivedAnalytics.conferencePapers || 0}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5 flex">
                <div className="bg-indigo-600 h-full" style={{ width: `${(profile.derivedAnalytics.journalPapers / (profile.derivedAnalytics.totalPublications || 1)) * 100}%` }} />
                <div className="bg-indigo-400 h-full flex-grow" />
              </div>
            </div>

            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg Citations Per Paper</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{profile.derivedAnalytics.averageCitations || 0}</p>
            </div>

            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Most Active Research Year</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{profile.derivedAnalytics.mostActiveResearchYear || 'N/A'}</p>
            </div>

            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Research Experience</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{profile.derivedAnalytics.researchExperience || 0} Years</p>
            </div>

            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Citations Growth Rate</p>
              <p className="text-xl font-black text-emerald-500 mt-1">+{profile.derivedAnalytics.citationGrowthRate || 0}%</p>
            </div>

            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg Papers Per Year</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{profile.derivedAnalytics.averagePublicationsPerYear || 0}</p>
            </div>

            <div className="sm:col-span-2 md:col-span-3 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 space-y-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Most Cited Work</p>
              <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 leading-snug">{profile.derivedAnalytics.mostCitedPublicationTitle || 'N/A'}</p>
              <p className="text-[10px] text-slate-500 font-semibold">Citations: {profile.derivedAnalytics.mostCitedPublicationCitations || 0}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-50/30 dark:bg-slate-950/10 rounded-2xl">
            No derived analytics available. Try syncing your Google Scholar profile.
          </div>
        )}
      </div>

      {/* Co-Authors Network Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">Co-Author Network</h3>
        {profile?.coAuthors && profile.coAuthors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profile.coAuthors.map((co) => (
              <div key={co._id || co.name} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-950/10 flex items-start gap-3">
                <Avatar
                  src={co.photo}
                  name={co.name}
                  size="md"
                  showBorder
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{co.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{co.affiliation || 'Researcher'}</p>
                  {co.profileURL && (
                    <a href={co.profileURL} target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline block mt-1">
                      Scholar Profile &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No co-authors indexed.</p>
        )}
      </div>
    </div>
  );
};

// Citation Chart Component
const CitationChart = ({ citationGraph }) => {
  if (!citationGraph || citationGraph.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-55/30 dark:bg-slate-950/10 text-xs text-slate-400 italic">
        No citation history available.
      </div>
    );
  }

  const maxCitations = Math.max(...citationGraph.map(d => d.citations), 1);
  const minCitations = Math.min(...citationGraph.map(d => d.citations), 0);
  const range = maxCitations - minCitations;
  const buffer = range * 0.1 || 10;
  const chartMax = maxCitations + buffer;

  const width = 600;
  const height = 200;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = citationGraph.map((d, i) => {
    const x = paddingLeft + (i / Math.max(1, citationGraph.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.citations / chartMax) * chartHeight;
    return { x, y, data: d };
  });

  let dPath = '';
  let areaPath = '';
  if (points.length > 0) {
    dPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      dPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    areaPath = `${dPath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <div className="min-w-[600px] h-[200px] relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(79, 70, 229)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="rgb(79, 70, 229)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
            const y = paddingTop + chartHeight * r;
            const val = Math.round(chartMax * (1 - r));
            return (
              <g key={idx} className="opacity-40">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="var(--color-border, #e2e8f0)" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="font-sans font-bold text-[9px] fill-slate-400"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area */}
          {areaPath && (
            <path d={areaPath} fill="url(#chartGrad)" />
          )}

          {/* Curve */}
          {dPath && (
            <path 
              d={dPath} 
              fill="none" 
              stroke="rgb(79, 70, 229)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />
          )}

          {/* Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="4" 
                className="fill-white dark:fill-slate-900 stroke-indigo-600 stroke-2 hover:r-5 hover:fill-indigo-600 transition-all"
              />
              <text 
                x={p.x} 
                y={height - paddingBottom + 16} 
                textAnchor="middle" 
                className="font-sans font-extrabold text-[9px] fill-slate-400 group-hover:fill-indigo-600 transition-colors"
              >
                {p.data.year}
              </text>
              <title>{`${p.data.year}: ${p.data.citations} Citations`}</title>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default Analytics;
