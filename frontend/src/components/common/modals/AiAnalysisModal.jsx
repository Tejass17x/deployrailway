import React, { useState } from 'react';
import { X, Sparkles, BookOpen, GitBranch, Lightbulb, Compass, Award, ShieldAlert } from 'lucide-react';

const AiAnalysisModal = ({ isOpen, onClose, publication }) => {
  const [activeTab, setActiveTab] = useState('summary');

  if (!isOpen || !publication) return null;
  const ai = publication.aiAnalysis || {};

  const tabs = [
    { id: 'summary', label: 'AI Summary', icon: BookOpen },
    { id: 'gap', label: 'Research Gap', icon: ShieldAlert },
    { id: 'future', label: 'Future Work', icon: Compass },
    { id: 'methodology', label: 'Methodology', icon: GitBranch },
    { id: 'findings', label: 'Key Findings', icon: Lightbulb }
  ];

  const getNoveltyColor = (score) => {
    if (score >= 8) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 6) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'Advanced':
      case 'Hard':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'Intermediate':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[550px] transition-colors duration-300">
        
        {/* Left side: Navigation / Metrics */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">AI Research Insights</h3>
            </div>

            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* AI Metrics summary at bottom */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 block mb-1">Novelty Score</span>
              <div className="flex items-center gap-2">
                <div className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${getNoveltyColor(ai.noveltyScore || 5)}`}>
                  {ai.noveltyScore || 5} / 10
                </div>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 block mb-1">Difficulty Level</span>
              <div className="flex items-center gap-2">
                <div className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${getDifficultyColor(ai.difficultyLevel || 'Intermediate')}`}>
                  {ai.difficultyLevel || 'Intermediate'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Active Tab content */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4">
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                {publication.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                AI analysis of {publication.authors} ({publication.year})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                  <BookOpen className="w-4 h-4" />
                  Executive Abstract Summary
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  {ai.summary || 'Summary unavailable.'}
                </p>
              </div>
            )}

            {activeTab === 'gap' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  Identified Research Gap
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-500/5 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-500/10">
                  {ai.researchGap || 'Research gap details not indexed.'}
                </p>
              </div>
            )}

            {activeTab === 'future' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-sm">
                  <Compass className="w-4 h-4" />
                  Recommendations for Future Work
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-sky-500/5 dark:bg-sky-950/10 p-4 rounded-xl border border-sky-500/10">
                  {ai.futureWork || 'Future recommendations are not specified.'}
                </p>
              </div>
            )}

            {activeTab === 'methodology' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  <GitBranch className="w-4 h-4" />
                  Methodology Overview
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-emerald-500/5 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-500/10">
                  {ai.methodology || 'Methodology description unavailable.'}
                </p>
              </div>
            )}

            {activeTab === 'findings' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-semibold text-sm">
                  <Lightbulb className="w-4 h-4" />
                  Key Research Findings
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-violet-500/5 dark:bg-violet-950/10 p-4 rounded-xl border border-violet-500/10">
                  {ai.keyFindings || 'Key findings overview not available.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900/30">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close Insights
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AiAnalysisModal;
