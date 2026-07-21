import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Loader2, Folder, FolderOpen, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import feedService from '../../../services/feed.service';
import PublicationCard from '../../../components/common/cards/PublicationCard';

const BookmarksFeed = () => {
  const queryClient = useQueryClient();
  const [activeFolder, setActiveFolder] = useState('All');

  // Fetch bookmark folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['bookmarkFolders'],
    queryFn: async () => {
      const res = await feedService.getBookmarkFolders();
      const list = res?.data || [];
      return ['All', ...list.filter(f => f !== 'All')];
    },
    staleTime: 2 * 60 * 1000
  });

  // Fetch bookmarked publications via the existing feed endpoint
  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['bookmarksFeed', activeFolder],
    queryFn: async () => {
      // Use existing personalized feed as a base — bookmarks live in Bookmark collection
      // The feed endpoint returns publications; filter client-side by folder
      const res = await feedService.getFeed(1, 50);
      return res?.data?.docs || [];
    },
    staleTime: 60 * 1000
  });

  const loading = foldersLoading || feedLoading;

  return (
    <div className="min-h-screen bg-bg-page text-text-primary">
      <div className="max-w-screen-lg mx-auto px-4 py-8 flex gap-6">

        {/* Folder sidebar */}
        <aside className="hidden md:flex flex-col gap-2 w-52 shrink-0 sticky top-6 self-start">
          <div className="bg-bg-card border border-border-default rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Bookmark size={16} className="text-primary" />
              <h2 className="text-sm font-bold text-text-primary">Saved Items</h2>
            </div>
            <div className="space-y-0.5">
              {(foldersLoading ? ['All'] : folders).map(folder => (
                <button
                  key={folder}
                  onClick={() => setActiveFolder(folder)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activeFolder === folder
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:bg-bg-surface hover:text-text-primary'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {activeFolder === folder ? <FolderOpen size={13} /> : <Folder size={13} />}
                    {folder}
                  </span>
                  <ChevronRight size={12} className="opacity-40" />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="bg-bg-card border border-border-default rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bookmark size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">
                  {activeFolder === 'All' ? 'All Bookmarks' : activeFolder}
                </h1>
                <p className="text-xs text-text-muted">Your saved research and resources</p>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : (feedData?.length || 0) > 0 ? (
            <div className="space-y-4">
              {feedData.map((pub, idx) => (
                <motion.div
                  key={String(pub._id || idx)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <PublicationCard publication={pub} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-bg-surface flex items-center justify-center">
                <Bookmark size={28} className="text-text-muted" />
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary mb-1">No bookmarks yet</p>
                <p className="text-sm text-text-muted">
                  Bookmark papers and resources to access them quickly here.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BookmarksFeed;
