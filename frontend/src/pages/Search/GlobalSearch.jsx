import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import searchService from '../../services/search.service';
import { Calendar, Sparkles, ArrowUpRight, Eye, Download, Quote, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { SKELETON_KEYFRAMES, ResultsSkeletonList } from './components/Skeletons';
import EmptyState from './components/EmptyState';
import FilterSidebar from './components/FilterSidebar';
import FilterDrawer, { FilterDrawerTrigger } from './components/FilterDrawer';
import Hero from './components/Hero';
import { Chip, GlassPanel } from './components/ui';
import PublicationResultCard from './components/PublicationResultCard';
import ResearcherResultCard from './components/ResearcherResultCard';
import AuthorResultCard from './components/AuthorResultCard';
import InstitutionResultCard from './components/InstitutionResultCard';

const CATEGORY_TABS = ['All', 'Researchers', 'Publications', 'Authors', 'Organizations', 'Projects'];

const GlobalSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sort = searchParams.get('sort') || 'latest';
  const type = searchParams.get('type') || 'All';
  const filter = searchParams.get('filter') || '';
  const year = searchParams.get('year') || '';
  const minCitations = searchParams.get('minCitations') || '';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['search', activeTab, { query, page, sort, type, filter, year, minCitations }],
    queryFn: async () => {
      // We allow empty queries to pass through because the backend has intelligent
      // fallback matching (e.g. Profile-based matching for Researchers)
      // and recent-item fallbacks for Projects/Publications.
      
      const params = { q: query, page, sort, limit: 10 };

      if (activeTab === 'Researchers') return searchService.searchResearchers({
        ...params,
        minCitations: minCitations || undefined
      });
      if (activeTab === 'Authors') return searchService.searchAuthors(params);
      if (activeTab === 'Organizations') return searchService.searchInstitutions(params);
      if (activeTab === 'Projects') return searchService.searchProjects(params);
      if (activeTab === 'Publications') return searchService.searchPublications({
        ...params,
        publicationType: type === 'All' ? undefined : type,
        filter: filter || undefined,
        year: year || undefined,
        minCitations: minCitations || undefined,
      });

      // activeTab === 'All'
      const [resData, projData, pubData] = await Promise.all([
        searchService.searchResearchers({ ...params, limit: 6, minCitations: minCitations || undefined }),
        searchService.searchProjects({ ...params, limit: 6 }),
        searchService.searchPublications({
          ...params, limit: 6, publicationType: type === 'All' ? undefined : type, filter: filter || undefined, year: year || undefined, minCitations: minCitations || undefined
        })
      ]);

      const combinedResults = [
        ...(resData?.results || []).map(r => ({ ...r, resultType: 'Researcher' })),
        ...(projData?.results || []).map(p => ({ ...p, resultType: 'Project' })),
        ...(pubData?.results || []).map(p => ({ ...p, resultType: 'Publication' }))
      ];

      return {
        results: combinedResults,
        totalPages: Math.max(resData?.totalPages || 1, projData?.totalPages || 1, pubData?.totalPages || 1)
      };
    },
  });

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const newParams = { q: query, sort, type, filter, year, minCitations };
    
    // Clean up empty params
    Object.keys(newParams).forEach(k => {
      if (!newParams[k]) delete newParams[k];
    });
    setSearchParams(newParams);

    if (drawerOpen) {
      setDrawerOpen(false);
    }
    
    setTimeout(() => {
      const resultsArea = document.getElementById('results-scroll-area');
      if (resultsArea) {
        resultsArea.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleFilterChange = (key, value) => {
    const newParams = { q: query, page: '1', sort, type, filter, year, minCitations };
    newParams[key] = value;

    // Clean up empty params
    Object.keys(newParams).forEach(k => {
      if (!newParams[k]) delete newParams[k];
    });
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    const newParams = { q: query };
    if (!query) delete newParams.q;
    setSearchParams(newParams);
  };

  React.useEffect(() => {
    const resultsArea = document.getElementById('results-scroll-area');
    if (resultsArea) {
      resultsArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  const results = data?.results || [];
  const totalPages = data?.totalPages || 1;

  // Active filters count for mobile drawer trigger
  const activeCount = [type !== 'All', filter, year, minCitations].filter(Boolean).length;

  return (
    <div className="h-[calc(100vh-112px)] md:h-[calc(100vh-128px)] flex flex-col bg-[#F8FAFC] font-sans selection:bg-[#2563EB] selection:text-white overflow-hidden">
      {/* Inject Keyframes for Skeletons */}
      <style>{SKELETON_KEYFRAMES}</style>

      {/* FIXED HEADER AREA */}
      <div className="flex-shrink-0 z-30 bg-[#F8FAFC]">
        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <Hero />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-20 mt-2 mb-4">
          <GlassPanel className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl w-full flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-xl font-black text-slate-800 tracking-tight">
                {query ? `Search results for "${query}"` : (activeTab === 'All' ? 'Explore Everything' : `Explore ${activeTab}`)}
              </h2>
              <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5 sm:mt-1 font-medium">
                {activeTab === 'Researchers' && 'Find top researchers and authors around the world.'}
                {activeTab === 'Publications' && 'Discover peer-reviewed papers, articles, and datasets.'}
                {activeTab === 'Projects' && 'Explore innovative research projects and collaborations.'}
                {activeTab === 'All' && 'Discover researchers, publications, and projects globally.'}
              </p>
            </div>
            <div className="lg:hidden">
              <FilterDrawerTrigger onClick={() => setDrawerOpen(true)} activeCount={activeCount} />
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 h-full">
            {/* Results Area */}
            <div id="results-scroll-area" className="lg:col-span-8 xl:col-span-9 h-full overflow-y-auto pb-8 lg:pr-2">
              {isLoading ? (
                <ResultsSkeletonList count={5} />
              ) : results.length === 0 ? (
                <EmptyState
                  hasQuery={!!query}
                  onSuggestion={(tip) => {
                    setSearchParams({ q: query ? `${query} ${tip}` : tip });
                  }}
                  onTrending={(topic) => {
                    setSearchParams({ q: topic });
                  }}
                />
              ) : (
                <>
                  <div className="space-y-3 sm:space-y-3.5 2xl:space-y-5 pt-4">
                    {results.map((item, index) => {
                      const key = item._id || index;
                      const cardType = item.resultType || activeTab;

                      if (cardType === 'Researcher' || cardType === 'Researchers') return <ResearcherResultCard key={key} researcher={item} index={index} />;
                      if (cardType === 'Author' || cardType === 'Authors') return <AuthorResultCard key={key} author={item} index={index} />;
                      if (cardType === 'Organization' || cardType === 'Organizations') return <InstitutionResultCard key={key} institution={item} index={index} />;
                      if (cardType === 'Project' || cardType === 'Projects') {
                        return (
                          <div key={key} className="p-3 sm:p-4 2xl:p-6 bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                            {item.resultType && (
                               <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 sm:px-2.5 sm:py-0.5 2xl:py-1 rounded-full mb-1.5 sm:mb-2 2xl:mb-3 inline-block">Project</span>
                            )}
                            <h3 className="font-bold text-sm sm:text-[15px] 2xl:text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title || 'Project'}</h3>
                            <p className="text-[11px] sm:text-[12px] 2xl:text-sm text-slate-500 mt-1 sm:mt-1.5 2xl:mt-2 leading-relaxed">{item.description || 'Project details coming soon'}</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={key} className="relative">
                           {item.resultType === 'Publication' && (
                              <div className="absolute -top-3 left-6 z-10 hidden sm:block">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm">Publication</span>
                              </div>
                           )}
                           <PublicationResultCard publication={item} index={index} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 sm:pt-6 pb-2 border-t border-gray-200 mt-4 sm:mt-6">
                      <button
                        onClick={() => handleFilterChange('page', Math.max(1, parseInt(page) - 1))}
                        disabled={parseInt(page) <= 1}
                        className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-[11px] sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Previous
                      </button>
                      <span className="text-[11px] sm:text-sm text-gray-600 font-medium px-2 text-center leading-tight">
                        Page {page} <br className="sm:hidden" /> of {totalPages}
                      </span>
                      <button
                        onClick={() => handleFilterChange('page', Math.min(totalPages, parseInt(page) + 1))}
                        disabled={parseInt(page) >= totalPages}
                        className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-[11px] sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block lg:col-span-4 xl:col-span-3 h-full overflow-y-auto pb-8 hide-scrollbar lg:pl-2">
              <FilterSidebar
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                year={year}
                minCitations={minCitations}
                sort={sort}
                onFilterChange={handleFilterChange}
                onReset={resetFilters}
              />
            </div>

            {/* Mobile Drawer */}
            <FilterDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              year={year}
              minCitations={minCitations}
              sort={sort}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
            />
          </div>
        </div>
      </div>

      {/* Hide scrollbar styles for tabs */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default GlobalSearch;