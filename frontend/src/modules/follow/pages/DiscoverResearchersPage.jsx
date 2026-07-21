import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Compass, AlertCircle, ArrowLeft } from 'lucide-react';
import followService from '../services/follow.service';
import SuggestedResearcherCard from '../components/SuggestedResearcherCard';

const DiscoverResearchersPage = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  // Entry point is always "View All" from the Network page, so going back
  // should return there — falling back to /network if there's no history
  // (e.g. page was opened directly via URL).
  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/network');
    }
  };
  const [suggestions, setSuggestions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['suggestions', page],
    queryFn: async () => {
      const res = await followService.getFollowSuggestions({ limit: 12, page });
      return res.data;
    }
  });

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setSuggestions(data.docs || []);
      } else {
        setSuggestions((prev) => [...prev, ...data.docs]);
      }
      setTotalPages(data.totalPages);
    }
  }, [data, page]);

  const loadMore = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Back navigation — sits above the banner, not inside it */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Network Dashboard
      </button>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 md:p-8 text-left relative overflow-hidden shadow-lg shadow-blue-500/10">
        <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-10 pointer-events-none">
          <Compass className="w-64 h-64" />
        </div>
        <div className="space-y-2 relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 fill-white/10" />
            <span>Recommendations</span>
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none">Discover Suggested Researchers</h2>
          <p className="text-xs text-blue-100 leading-relaxed font-semibold">
            Expand your academic network. These researchers are recommended based on matching keywords, shared research interests, mutual co-authors, and mutual followers.
          </p>
        </div>
      </div>

      {/* Suggested Grid */}
      {isLoading && page === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 h-44 animate-pulse space-y-4">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((suggestion) => (
              <SuggestedResearcherCard
                key={suggestion.user._id}
                suggestion={suggestion}
                currentUserId={currentUser?._id}
              />
            ))}
          </div>

          {/* Load More */}
          {page < totalPages && (
            <button
              onClick={loadMore}
              disabled={isFetchingMore}
              className="w-full py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-black text-[#475569] uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {isFetchingMore ? 'Loading...' : 'Load More Recommendations'}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <h4 className="text-sm font-black text-slate-900 uppercase">No Recommendations Available</h4>
          <p className="text-xs text-[#475569] max-w-xs mx-auto font-semibold">
            We couldn't find any recommendations for you right now. Try completing your profile by adding research areas and co-authors to get better recommendations!
          </p>
        </div>
      )}
    </div>
  );
};

export default DiscoverResearchersPage;