import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  Download, 
  ExternalLink, 
  Bookmark, 
  BookOpen, 
  List, 
  Grid,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar
} from 'lucide-react';

const PublicationTable = ({ publications }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('year'); // 'year', 'citations'
  const [filterType, setFilterType] = useState('All'); // 'All', 'Journal', 'Conference', 'Article'
  const [viewMode, setViewMode] = useState('table'); // 'table', 'cards'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Bookmarking state (mock)
  const [bookmarks, setBookmarks] = useState({});

  const toggleBookmark = (id) => {
    setBookmarks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered & Sorted publications
  const processedPubs = useMemo(() => {
    let result = [...(publications || [])];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        p => p.title?.toLowerCase().includes(q) || p.authors?.toLowerCase().includes(q)
      );
    }

    // Filter
    if (filterType !== 'All') {
      result = result.filter(p => p.publicationType?.toLowerCase() === filterType.toLowerCase() || p.journal?.toLowerCase().includes(filterType.toLowerCase()));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'citations') {
        return (b.citations || 0) - (a.citations || 0);
      }
      return (b.year || 0) - (a.year || 0);
    });

    return result;
  }, [publications, search, sortBy, filterType]);

  // Pagination
  const totalPages = Math.ceil(processedPubs.length / itemsPerPage);
  const paginatedPubs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedPubs.slice(start, start + itemsPerPage);
  }, [processedPubs, currentPage]);

  const uniqueTypes = ['All', 'Article', 'Journal', 'Conference'];

  return (
    <div className="space-y-4">
      {/* Filters & Actions Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg-page/40 p-4 border border-border rounded-2xl">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search publications..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl focus:outline-none transition-all font-semibold"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs font-bold bg-white border border-border rounded-xl focus:outline-none focus:border-primary cursor-pointer text-text-secondary"
          >
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t} Type</option>
            ))}
          </select>

          {/* Sort By */}
          <button
            onClick={() => setSortBy(prev => prev === 'year' ? 'citations' : 'year')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white border border-border rounded-xl text-text-secondary hover:bg-bg-page transition-colors"
          >
            {sortBy === 'year' ? <Calendar className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
            <span>Sort: {sortBy === 'year' ? 'Latest' : 'Most Citations'}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg-page'}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 transition-colors ${viewMode === 'cards' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg-page'}`}
              title="Card View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Publications List */}
      <AnimatePresence mode="wait">
        {paginatedPubs.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 bg-white border border-border rounded-2xl"
          >
            <BookOpen className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-text-secondary">No matching publications found</p>
          </motion.div>
        ) : viewMode === 'table' ? (
          /* Table Layout */
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hidden md:block"
          >
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-bg-page/40 border-b border-border text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                  <th className="p-4 w-3/5">Title & Authors</th>
                  <th className="p-4">Journal / Publisher</th>
                  <th className="p-4 text-center">Year</th>
                  <th className="p-4 text-center">Citations</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedPubs.map((pub) => (
                  <tr key={pub._id} className="hover:bg-bg-page/20 transition-colors text-xs font-semibold">
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="font-bold text-text-primary text-sm line-clamp-2 leading-snug">
                          {pub.title}
                        </p>
                        <p className="text-xs text-text-secondary font-medium">
                          {pub.authors}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-text-secondary">
                      {pub.journal || pub.conference || pub.publisher || 'N/A'}
                    </td>
                    <td className="p-4 text-center font-bold text-text-secondary">
                      {pub.year || 'N/A'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md font-bold">
                        {pub.citations || 0}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleBookmark(pub._id)}
                          className={`p-2 border rounded-xl transition-all ${bookmarks[pub._id] ? 'bg-primary border-primary text-white' : 'border-border bg-white text-text-secondary hover:bg-bg-page'}`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                        {pub.paperURL && (
                          <a
                            href={pub.paperURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border border-border bg-white rounded-xl text-text-secondary hover:bg-bg-page transition-all"
                            title="View DOI / Web"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {pub.pdfURL && (
                          <a
                            href={pub.pdfURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border border-border bg-white rounded-xl text-text-secondary hover:bg-bg-page transition-all"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : (
          /* Cards Layout */
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {paginatedPubs.map((pub) => (
              <div key={pub._id} className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                    {pub.publicationType || 'Article'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleBookmark(pub._id)}
                      className={`p-1.5 border rounded-lg transition-all ${bookmarks[pub._id] ? 'bg-primary border-primary text-white' : 'border-border bg-white text-text-secondary hover:bg-bg-page'}`}
                    >
                      <Bookmark className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-text-primary line-clamp-2 leading-snug">
                    {pub.title}
                  </h4>
                  <p className="text-[11px] text-text-secondary line-clamp-1">
                    {pub.authors}
                  </p>
                </div>

                <p className="text-[11px] text-text-secondary italic">
                  {pub.journal || pub.conference || pub.publisher || 'N/A'}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-[11px]">
                  <span className="font-bold text-text-secondary">Year: {pub.year || 'N/A'}</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                    Citations: {pub.citations || 0}
                  </span>
                </div>

                {(pub.paperURL || pub.pdfURL) && (
                  <div className="flex gap-2 pt-1.5">
                    {pub.paperURL && (
                      <a
                        href={pub.paperURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-bg-page border border-border text-[10px] font-bold text-text-secondary rounded-xl hover:bg-bg-page/80 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>
                    )}
                    {pub.pdfURL && (
                      <a
                        href={pub.pdfURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary text-white text-[10px] font-bold rounded-xl hover:bg-primary-hover transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-text-secondary font-bold">
            Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, processedPubs.length)} of {processedPubs.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-border rounded-xl bg-white text-text-secondary disabled:opacity-40 enabled:hover:bg-bg-page transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-text-primary px-3">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-border rounded-xl bg-white text-text-secondary disabled:opacity-40 enabled:hover:bg-bg-page transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicationTable;
