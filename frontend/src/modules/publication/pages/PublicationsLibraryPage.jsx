import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  FileText, Eye, Download, Search, Filter, Grid, List, Table,
  Trash2, RotateCcw, Share2, Bookmark, Copy, BarChart2, Plus, 
  RefreshCw, FileDown, BookOpen, Clock, Calendar, Shield, Globe, Award, 
  ChevronLeft, ChevronRight, X, CheckSquare, Square, MoreVertical, Edit3, 
  ExternalLink, FileSpreadsheet, Lock, AlertCircle, CopyCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import publicationService from '../../../services/publication.service';
import profileService from '../../../services/profile.service';
import scholarService from '../../../services/scholar.service';
import { useSocket } from '../../../context/SocketContext';
import PDFReader from '../components/PDFReader';

const PublicationsLibraryPage = () => {
  const { profileSlug: routeSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);

  // Determine if we are on unified dashboard (/publications) or public profile slug
  const isDashboard = !routeSlug || location.pathname.startsWith('/publications');
  const profileSlug = isDashboard ? (currentUser?.profileSlug || currentUser?.username) : routeSlug;

  // States
  const [viewMode, setViewMode] = useState('grid'); // grid | card | table
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all | published | draft | trash | bookmarks
  const [sortBy, setSortBy] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(1000);

  useEffect(() => {
    const handler = setTimeout(() => {
      // Trigger search only if input is empty or has at least 2 characters
      if (searchInput.trim().length === 0 || searchInput.trim().length >= 2) {
        setSearchQuery(searchInput);
        setPage(1);
      }
    }, 450);

    return () => clearTimeout(handler);
  }, [searchInput]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionType, setBulkActionType] = useState('');
  const [bulkVisibility, setBulkVisibility] = useState('Public');

  // Modals / Detail Overlays
  const [selectedPubAnalytics, setSelectedPubAnalytics] = useState(null);
  const [activeReadPub, setActiveReadPub] = useState(null);
  const [isReadingLoading, setIsReadingLoading] = useState(false);
  const [activeScholarNotePub, setActiveScholarNotePub] = useState(null);
  const [scholarNoteText, setScholarNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Socket instance (listener attached further below, after `refetch` is defined)
  const { socket } = useSocket();

  // Sync tab state with URL path for /publications sub-routes
  useEffect(() => {
    if (isDashboard) {
      if (location.pathname.includes('/publications/drafts')) {
        setFilterStatus('draft');
      } else if (location.pathname.includes('/publications/published')) {
        setFilterStatus('published');
      } else if (location.pathname.includes('/publications/trash')) {
        setFilterStatus('trash');
      } else if (location.pathname.includes('/publications/bookmarks')) {
        setFilterStatus('bookmarks');
      } else {
        setFilterStatus('all');
      }
    }
  }, [location.pathname, isDashboard]);

  // Sync state change back to URL route updates
  const handleTabChange = (newStatus) => {
    setFilterStatus(newStatus);
    setSelectedIds([]);
    setPage(1);

    if (isDashboard) {
      if (newStatus === 'all') navigate('/publications');
      else if (newStatus === 'published') navigate('/publications/published');
      else if (newStatus === 'draft') navigate('/publications/drafts');
      else if (newStatus === 'trash') navigate('/publications/trash');
      else if (newStatus === 'bookmarks') navigate('/publications/bookmarks');
    }
  };

  // 1. Fetch Profile
  const { data: profileRes, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', profileSlug],
    queryFn: () => profileService.getPublicProfile(profileSlug),
    enabled: !!profileSlug,
    staleTime: 1000 * 30, // 30 seconds — keeps profile fresh after scholar sync
    refetchOnWindowFocus: true
  });

  const profile = profileRes?.success ? profileRes.data : null;
  const currentUserId = currentUser?._id || currentUser?.id;
  const profileUserId = profile?.userId?._id || profile?.userId?.id || profile?.userId;
  const isOwner = !!(currentUser && profile && (
    (currentUserId && profileUserId && currentUserId.toString() === profileUserId.toString()) || 
    currentUser.profileSlug === profileSlug || 
    currentUser.username === profileSlug
  ));

  // 2. Fetch Publications Portfolio
  const { data: pubsRes, isLoading: isPubsLoading, refetch } = useQuery({
    queryKey: ['publications-portfolio', profileSlug, page, limit, filterYear, filterVisibility, filterStatus, sortBy, searchQuery, isOwner, isDashboard],
    queryFn: async () => {
      const params = {
        page,
        limit,
        sort: sortBy,
        search: searchQuery
      };

      // NOTE: publicationType is intentionally NOT sent to the backend.
      // The backend does a strict match on this field, and stored values
      // are inconsistently cased/formatted ("Conference Paper" vs
      // "conference-paper"), so a strict server-side match returns 0
      // results and there's nothing left for the client filter to work
      // with. We fetch the full list instead and filter by format
      // entirely client-side (see `publications` below).
      if (filterVisibility !== 'all') params.visibility = filterVisibility;
      if (filterYear !== 'all') params.year = filterYear;

      if (isOwner) {
        if (filterStatus === 'trash') {
          params.trash = 'true';
        } else if (filterStatus === 'bookmarks') {
          params.status = 'bookmarks';
        } else {
          if (filterStatus !== 'all') params.status = filterStatus;
        }
        return await publicationService.getMyPublications(params);
      } else {
        // Public list retrieves by username or profile slug
        return await publicationService.getPublicationsByUsername(profileSlug, params);
      }
    },
    enabled: !!profileSlug
  });

  // Listen for Google Scholar sync completion via Socket.IO for real-time updates.
  // Placed here (after the `refetch` above is declared) — it previously sat near the
  // top of the component and referenced `refetch` before its `const` declaration,
  // which threw "Cannot access 'refetch' before initialization" on every render.
  useEffect(() => {
    if (!socket) return;

    const handleScholarSyncComplete = () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['publications-portfolio'] });
    };

    socket.on('scholarSyncCompleted', handleScholarSyncComplete);
    socket.on('profileUpdated', handleScholarSyncComplete);

    return () => {
      socket.off('scholarSyncCompleted', handleScholarSyncComplete);
      socket.off('profileUpdated', handleScholarSyncComplete);
    };
  }, [socket, refetch, queryClient]);

  const rawPublications = pubsRes?.success ? pubsRes.data.docs : [];
  const totalPubs = pubsRes?.success ? pubsRes.data.total : 0;
  const totalPages = pubsRes?.success ? pubsRes.data.totalPages : 1;
  const stats = pubsRes?.success ? pubsRes.data.stats : null;

  // Client-side safety-net filter for Publication Type / Format.
  // The dropdown sends slug-style values ('conference-paper') but stored
  // publicationType values are spaced/mixed-case ('Conference Paper'), so a
  // strict string match (whether done here or on the backend) never hits.
  // Normalizing both sides (lowercase, strip spaces/hyphens/underscores)
  // makes the comparison format-agnostic without needing a backend change.
  const normalizeType = (val) => (val || '').toString().toLowerCase().replace(/[\s_-]/g, '');
  const publications = filterType === 'all'
    ? rawPublications
    : rawPublications.filter((p) => normalizeType(p.publicationType) === normalizeType(filterType));

  // Trash count fetched independently of the active tab/filters, so the
  // "Trash" tab badge reflects the real total instead of only counting
  // trashed items when you happen to already be viewing the Trash tab
  // (every other tab's query excludes trashed docs, so it always read 0).
  const { data: trashCountRes, refetch: refetchTrashCount } = useQuery({
    queryKey: ['publications-trash-count', profileSlug],
    queryFn: () => publicationService.getMyPublications({ page: 1, limit: 1, trash: 'true' }),
    enabled: !!profileSlug && !!isOwner
  });
  const trashCount = trashCountRes?.success ? (trashCountRes.data.total ?? 0) : 0;

  // Sync Google Scholar Profile Handler
  const handleScholarSync = async () => {
    setIsSyncing(true);
    const syncToast = toast.loading('Starting Google Scholar sync...');
    try {
      const res = await profileService.syncGoogleScholar();
      if (!res.success) {
        toast.error('Sync failed. Please check your Scholar ID configuration.', { id: syncToast });
        setIsSyncing(false);
        return;
      }

      const jobId = res.data?.data?._id || res.data?._id;
      if (!jobId) {
        // No job ID returned — treat as inline sync
        toast.success('Google Scholar sync successful!', { id: syncToast });
        refetch();
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        setIsSyncing(false);
        return;
      }

      // Poll for job completion
      toast.loading('Syncing publications from Google Scholar...', { id: syncToast });
      let attempts = 0;
      const maxAttempts = 150; // 5 minutes max (2s intervals)
      const pollInterval = 2000;

      const pollForCompletion = async () => {
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;

          try {
            const statusRes = await scholarService.getImportStatusById(jobId);
            const resData = statusRes?.data?.data || statusRes?.data || statusRes;
            const job = resData?.job || resData;

            if (job?.status === 'completed') {
              toast.success('Google Scholar sync completed! Refreshing data...', { id: syncToast });
              // Invalidate all relevant caches
              await queryClient.invalidateQueries({ queryKey: ['profile'] });
              await queryClient.invalidateQueries({ queryKey: ['publications-portfolio'] });
              await queryClient.invalidateQueries({ queryKey: ['scholarProfile'] });
              refetch();
              return;
            }

            if (job?.status === 'failed') {
              toast.error('Sync failed: ' + (job?.error?.message || 'Unknown error'), { id: syncToast });
              return;
            }

            // Update progress in toast
            const progress = job?.progress || 0;
            if (progress > 0) {
              toast.loading(`Syncing... ${progress}% complete`, { id: syncToast });
            }
          } catch (pollErr) {
            // Continue polling on transient errors
            console.warn('Poll error, retrying...', pollErr);
          }
        }

        // Timeout — still refresh data in case it completed
        toast.success('Sync timed out. Refreshing data...', { id: syncToast });
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        await queryClient.invalidateQueries({ queryKey: ['publications-portfolio'] });
        refetch();
      };

      await pollForCompletion();
    } catch (err) {
      console.error(err);
      toast.error('Sync failed: ' + (err.message || 'Server error'), { id: syncToast });
    } finally {
      setIsSyncing(false);
    }
  };

  // Open PDF Reader
  const handleReadClick = async (pub) => {
    if (isReadingLoading) return;
    setIsReadingLoading(true);
    const readToast = toast.loading('Opening publication reader...');
    try {
      const slugOrId = pub.slug && pub.slug !== 'undefined' ? pub.slug : (pub.id || pub._id);
      const res = await publicationService.getPublicationForReader(slugOrId);
      if (res.success && res.data) {
        setActiveReadPub(res.data);
        toast.dismiss(readToast);
      } else {
        toast.error('Failed to load publication document.', { id: readToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error opening reader: ' + (err.message || 'Unknown error'), { id: readToast });
    } finally {
      setIsReadingLoading(false);
    }
  };

  // Copy Citation link
  const handleCopyLink = (slug) => {
    const url = `${window.location.origin}/publication/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Citation link copied to clipboard!');
  };

  // Copy DOI link
  const handleCopyDOI = (doi) => {
    if (!doi) {
      toast.error('No DOI associated with this publication.');
      return;
    }
    navigator.clipboard.writeText(doi);
    toast.success('DOI copied to clipboard!');
  };

  // Download PDF attachment
  const handleDownload = async (pub) => {
    if (!pub.pdfUrl) {
      toast.error('No attached PDF available for download.');
      return;
    }
    try {
      await publicationService.trackDownload(pub.id || pub._id);
      window.open(pub.pdfUrl, '_blank');
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Failed to register download event.');
    }
  };

  // Bookmark Toggle Handler
  const handleBookmarkToggle = async (pub) => {
    const id = pub.id || pub._id;
    const isBookmarked = pub.bookmarked;
    const bookmarkToast = toast.loading(isBookmarked ? 'Removing bookmark...' : 'Adding bookmark...');
    try {
      const res = await publicationService.toggleBookmark(id);
      if (res.success) {
        toast.success(res.message, { id: bookmarkToast });
        refetch();
      } else {
        toast.error('Bookmark toggle failed.', { id: bookmarkToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Bookmark failed.', { id: bookmarkToast });
    }
  };

  // Duplicate Publication Handler
  const handleDuplicate = async (pub) => {
    const id = pub.id || pub._id;
    const duplicateToast = toast.loading('Duplicating publication as Draft...');
    try {
      const res = await publicationService.duplicatePublication(id);
      if (res.success) {
        toast.success('Publication duplicated successfully! Opened in Drafts.', { id: duplicateToast });
        handleTabChange('draft');
      } else {
        toast.error('Duplication failed.', { id: duplicateToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Duplication failed.', { id: duplicateToast });
    }
  };

  // Soft-Delete / Permanent Delete Handler
  const handleDelete = async (pub, permanent = false) => {
    const id = pub.id || pub._id;
    const isAlreadyDeleted = pub.isDeleted;
    const deleteToast = toast.loading(
      (isAlreadyDeleted || permanent) ? 'Permanently deleting publication...' : 'Moving publication to Trash...'
    );

    try {
      const res = await publicationService.deletePublication(id);
      if (res.success) {
        toast.success(
          (isAlreadyDeleted || permanent) 
            ? 'Publication permanently deleted!' 
            : 'Publication soft-deleted! Moved to Trash.',
          { id: deleteToast }
        );
        refetch();
        refetchTrashCount();
      } else {
        toast.error('Delete operation failed.', { id: deleteToast });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error occurred during deletion.', { id: deleteToast });
    }
  };

  // Restore Handler
  const handleRestore = async (pub) => {
    const id = pub.id || pub._id;
    const restoreToast = toast.loading('Restoring publication from Trash...');
    try {
      const res = await publicationService.restorePublication(id);
      if (res.success) {
        toast.success('Publication restored successfully!', { id: restoreToast });
        refetch();
        refetchTrashCount();
      } else {
        toast.error('Failed to restore.', { id: restoreToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error occurred while restoring.', { id: restoreToast });
    }
  };

  // Scholar Manual Notes Modal handlers
  const handleOpenScholarNoteModal = (pub) => {
    setActiveScholarNotePub(pub);
    setScholarNoteText(pub.abstract || '');
  };

  const handleSaveScholarNote = async () => {
    setIsSavingNote(true);
    const saveToast = toast.loading('Saving manual note...');
    try {
      const id = activeScholarNotePub.id || activeScholarNotePub._id;
      // We pass the new abstract as manual note/summary
      const res = await publicationService.updatePublication(id, {
        abstract: scholarNoteText
      });
      if (res.success) {
        toast.success('Manual notes updated successfully!', { id: saveToast });
        setActiveScholarNotePub(null);
        refetch();
      } else {
        toast.error('Failed to save note.', { id: saveToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving manual note.', { id: saveToast });
    } finally {
      setIsSavingNote(false);
    }
  };

  // Multi-Selection handlers
  const handleSelectToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = () => {
    if (selectedIds.length === publications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(publications.map(p => p.id || p._id));
    }
  };

  // Bulk Actions executor
  const handleBulkActionExecute = async (action, optionValue = null) => {
    if (selectedIds.length === 0) return;
    const bulkToast = toast.loading(`Executing bulk ${action}...`);
    try {
      const payload = {
        action,
        ids: selectedIds
      };
      if (action === 'update-visibility') {
        payload.visibility = optionValue || bulkVisibility;
      }

      const res = await publicationService.bulkAction(payload);
      if (res.success) {
        toast.success(`Successfully updated ${res.data.count} publications!`, { id: bulkToast });
        setSelectedIds([]);
        refetch();
      } else {
        toast.error('Bulk action execution failed.', { id: bulkToast });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error executing bulk action.', { id: bulkToast });
    }
  };

  // Bulk CSV export
  const handleBulkCSVExport = () => {
    const listToExport = selectedIds.length > 0 
      ? publications.filter(p => selectedIds.includes(p.id || p._id))
      : publications;

    if (listToExport.length === 0) {
      toast.error('No publications selected to export.');
      return;
    }

    const headers = ['Title', 'Authors', 'Type', 'Journal/Conference', 'Year', 'DOI', 'Visibility', 'Status', 'Citations', 'Views', 'Downloads'];
    const rows = listToExport.map(pub => [
      `"${pub.title?.replace(/"/g, '""') || ''}"`,
      `"${pub.authors?.replace(/"/g, '""') || ''}"`,
      pub.publicationType || '',
      `"${(pub.publication || pub.journal || pub.conference || '').replace(/"/g, '""')}"`,
      pub.year || '',
      pub.doi || '',
      pub.visibility || '',
      pub.status || '',
      pub.citations || 0,
      pub.views || 0,
      pub.downloads || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${profileSlug}_selected_publications.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${listToExport.length} publications to CSV.`);
  };

  // Stats fallback calculations if stats not returned by backend
  const totalReads = stats?.views ?? publications.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const totalDownloads = stats?.downloads ?? publications.reduce((acc, curr) => acc + (curr.downloads || 0), 0);
  const totalCitations = stats?.citations ?? (profile?.metrics?.citationsCount || profile?.metrics?.totalCitations || 0);

  const displayStats = [
    { label: 'Total Publications', value: stats?.totalPublications ?? totalPubs, icon: FileText, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { label: 'Published', value: stats?.published ?? publications.filter(p => p.status === 'published' && !p.isDeleted).length, icon: Globe, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'Drafts', value: stats?.drafts ?? publications.filter(p => p.status === 'draft' && !p.isDeleted).length, icon: FileSpreadsheet, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { label: 'Private Output', value: stats?.private ?? publications.filter(p => p.visibility === 'Private').length, icon: Lock, color: 'bg-rose-50 text-rose-600 border-rose-100' },
    { label: 'Public Output', value: stats?.public ?? publications.filter(p => p.visibility === 'Public').length, icon: Globe, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { label: 'Total Reads', value: totalReads, icon: Eye, color: 'bg-sky-50 text-sky-600 border-sky-100' },
    { label: 'Downloads', value: totalDownloads, icon: Download, color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
    { label: 'Bookmarks', value: stats?.bookmarks ?? 0, icon: Bookmark, color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { label: 'Citations', value: totalCitations, icon: BookOpen, color: 'bg-teal-50 text-teal-600 border-teal-100' }
  ];

  if (isProfileLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <span className="text-sm font-bold text-slate-500">Loading publication environment...</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F8FAFC] py-5 sm:py-8 px-3 sm:px-6 lg:px-8 text-left text-slate-800 ${selectedIds.length > 0 ? 'pb-28 sm:pb-8' : ''}`}>
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8">
        
        {/* 1. Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5 sm:pb-6">
          <div className="space-y-1">
            {profileSlug && profileSlug !== 'undefined' && (
              <button
                onClick={() => navigate(`/profile/${profileSlug}`)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-1.5 py-1 -ml-1 px-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Profile</span>
              </button>
            )}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {isOwner ? 'Publication Management' : 'Researcher Publications'}
            </h1>
            <p className="text-xs sm:text-sm text-[#475569]">
              {isOwner 
                ? 'Manage all your research outputs, drafts, visibility and Scholar citations in one place.' 
                : `Explore the research outputs published by ${profile?.displayName || profile?.fullName || 'this researcher'}.`
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5">
            {isOwner && (
              <button
                onClick={() => navigate('/publications/create')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all px-4 sm:px-4.5 py-2.5 rounded-[14px] sm:rounded-[16px] shadow-sm active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Upload Research</span>
              </button>
            )}

            {/* Sync + Refresh share a row: Refresh is just an icon button, not its own full-width row */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isOwner && (
                <button
                  disabled={isSyncing}
                  onClick={handleScholarSync}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#475569] bg-white border border-[#E2E8F0] hover:bg-slate-50 transition-all px-4 sm:px-4.5 py-2.5 rounded-[14px] sm:rounded-[16px] active:scale-[0.98] disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="whitespace-nowrap">Sync Google Scholar</span>
                </button>
              )}
              <button
                onClick={() => {
                  refetch();
                  toast.success('Publications refreshed!');
                }}
                className="shrink-0 inline-flex items-center justify-center text-[#475569] bg-white border border-[#E2E8F0] hover:bg-slate-50 hover:text-[#2563EB] transition-all w-[42px] h-[42px] rounded-[14px] sm:rounded-[16px] active:scale-[0.98]"
                title="Refresh List"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Top Statistics Cards */}
        {isOwner && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-2.5 sm:gap-3">
            {displayStats.filter(m => Number(m.value || 0) > 0).map((m, idx) => {
              const Icon = m.icon;
              return (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -1 }}
                  className="bg-white p-3 sm:p-3.5 rounded-[14px] sm:rounded-[16px] border border-[#E2E8F0] flex flex-col justify-between min-h-[85px] sm:min-h-[95px] shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">{m.label}</span>
                    <span className={`p-1 rounded-lg border ${m.color} shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#0F172A] mt-2 truncate">{m.value}</h3>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* 3. Navigation Tabs (Drafts, Published, Bookmarks, Trash) */}
        {isOwner && (
          <div className="pb-1">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Output', count: stats?.totalPublications },
                { id: 'published', label: 'Published', count: stats?.published },
                { id: 'draft', label: 'Drafts', count: stats?.drafts },
                { id: 'bookmarks', label: 'Bookmarks', count: stats?.bookmarks },
                { id: 'trash', label: 'Trash', count: trashCount }
              ].map((tab, idx, arr) => {
                const isLastOdd = arr.length % 2 !== 0 && idx === arr.length - 1;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`whitespace-nowrap rounded-[14px] sm:rounded-full px-3.5 py-2.5 sm:py-1.5 text-xs font-bold transition-all border ${isLastOdd ? 'col-span-2' : ''} sm:w-auto ${
                      filterStatus === tab.id
                        ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-sm'
                        : 'bg-white border-[#E2E8F0] text-[#475569] hover:border-slate-300 hover:text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                          filterStatus === tab.id 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Toolbar: Search, Filters & Toggles */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-3 sm:p-4 shadow-[0_2px_4px_rgba(0,0,0,0.01)] flex flex-col gap-3 md:flex-row md:items-center justify-between">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 flex-grow min-w-0">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto sm:flex-grow sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Title, DOI, Keyword, Author..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 sm:py-2 rounded-[14px] sm:rounded-[16px] border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#0F172A]"
              />
            </div>

            {/* Filters row: wraps on mobile so every filter stays visible without needing to swipe */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Filter: Publication Type */}
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                className="shrink-0 px-3 py-2.5 sm:py-2 rounded-[14px] sm:rounded-[16px] border border-[#E2E8F0] text-xs font-semibold focus:outline-none text-slate-700 bg-white"
              >
                <option value="all">All Formats</option>
                <option value="article">Articles</option>
                <option value="journal-paper">Journal Papers</option>
                <option value="book">Books</option>
                <option value="conference-paper">Conference Papers</option>
                <option value="patent">Patents</option>
                <option value="preprint">Preprints</option>
              </select>

              {/* Filter: Visibility */}
              <select
                value={filterVisibility}
                onChange={(e) => { setFilterVisibility(e.target.value); setPage(1); }}
                className="shrink-0 px-3 py-2.5 sm:py-2 rounded-[14px] sm:rounded-[16px] border border-[#E2E8F0] text-xs font-semibold focus:outline-none text-slate-700 bg-white"
              >
                <option value="all">All Visibility</option>
                <option value="Public">Public</option>
                <option value="Private">Private</option>
                <option value="Institution Only">Institution Only</option>
              </select>

              {/* Year Selector */}
              <select
                value={filterYear}
                onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}
                className="shrink-0 px-3 py-2.5 sm:py-2 rounded-[14px] sm:rounded-[16px] border border-[#E2E8F0] text-xs font-semibold focus:outline-none text-slate-700 bg-white"
              >
                <option value="all">All Years</option>
                {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* View Toggles */}
          <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-3 border-t border-slate-100 md:pt-0 md:border-t-0 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 sm:flex-none flex items-center justify-center p-2.5 sm:p-2 rounded-lg border transition-colors ${
                viewMode === 'grid' ? 'bg-blue-50 border-blue-200 text-[#2563EB]' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex-1 sm:flex-none flex items-center justify-center p-2.5 sm:p-2 rounded-lg border transition-colors ${
                viewMode === 'card' ? 'bg-blue-50 border-blue-200 text-[#2563EB]' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
              title="Card View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 sm:flex-none flex items-center justify-center p-2.5 sm:p-2 rounded-lg border transition-colors ${
                viewMode === 'table' ? 'bg-blue-50 border-blue-200 text-[#2563EB]' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5. Publications List/Grid/Table Rendering */}
        {isPubsLoading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading publications list...</p>
          </div>
        ) : publications.length === 0 ? (
          <div className="py-24 bg-white border border-[#E2E8F0] rounded-[16px] text-center shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3.5" />
            <h3 className="text-base font-extrabold text-[#0F172A]">No Publications Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              We couldn't find any publications matching your current query filters in this tab.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Header select-all for checkbox list */}
            {isOwner && selectedIds.length > 0 && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-blue-700 font-bold">
                <span>{selectedIds.length} publications selected.</span>
                <button onClick={() => setSelectedIds([])} className="underline hover:text-blue-950">Deselect all</button>
              </div>
            )}

            {/* Grid View Mode */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publications.map((pub) => {
                  const id = pub.id || pub._id;
                  const isSelected = selectedIds.includes(id);
                  const isScholarImport = !!pub.googleScholarPublicationId;
                  const hasPDF = !!pub.pdfUrl;
                  
                  return (
                    <motion.div
                      key={id}
                      whileHover={{ y: -2 }}
                      className={`bg-white border rounded-[16px] p-5 shadow-[0_2px_4px_rgba(0,0,0,0.015)] hover:shadow-md transition-all flex flex-col justify-between relative ${
                        isSelected ? 'border-[#2563EB] bg-blue-50/5' : 'border-[#E2E8F0]'
                      }`}
                    >
                      {/* Checkbox Select Option */}
                      {isOwner && (
                        <button
                          onClick={() => handleSelectToggle(id)}
                          className="absolute top-4 left-4 p-1 text-slate-400 hover:text-[#2563EB] bg-white rounded-lg shadow-sm border border-slate-100 z-10"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#2563EB]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <div className={`space-y-4 ${isOwner ? 'pl-6' : ''}`}>
                        
                        {/* Thumbnail / Badges Header */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <span className="text-[9px] font-black bg-blue-50 text-[#2563EB] px-2.5 py-0.5 rounded-[8px] uppercase tracking-wider">
                            {pub.publicationType || 'Article'}
                          </span>
                          
                          {/* Badges System */}
                          <div className="flex items-center gap-1">
                            {isScholarImport && (
                              <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-[8px]" title="Imported from Google Scholar">Scholar</span>
                            )}
                            {hasPDF && (
                              <span className="text-[8px] font-black bg-[#2563EB] text-white px-2 py-0.5 rounded-[8px]" title="Cloudflare R2 Attached PDF">PDF</span>
                            )}
                            {pub.status === 'draft' && (
                              <span className="text-[8px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-[8px]">Draft</span>
                            )}
                            {pub.isDeleted && (
                              <span className="text-[8px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-[8px]">Trash</span>
                            )}
                          </div>
                        </div>

                        {/* Text Metadata */}
                        <div className="space-y-2 text-left">
                          <h3 
                            onClick={() => handleReadClick(pub)}
                            className="text-sm font-bold text-[#0F172A] leading-snug line-clamp-2 hover:text-[#2563EB] cursor-pointer transition-colors"
                          >
                            {pub.title}
                          </h3>
                          
                          <p className="text-[11px] text-[#475569] font-medium line-clamp-1">
                            By {pub.authors}
                          </p>

                          {(pub.publication || pub.journal || pub.conference) && (
                            <p className="text-[10px] text-slate-400 italic line-clamp-1">
                              {pub.publication || pub.journal || pub.conference} {pub.year ? `(${pub.year})` : ''}
                            </p>
                          )}
                          
                          {pub.doi && (
                            <span className="text-[9px] bg-slate-50 border border-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded block max-w-max">
                              DOI: {pub.doi}
                            </span>
                          )}
                        </div>

                        {/* Read-only Scholar Meta notes */}
                        {isScholarImport && (pub.citations > 0 || pub.googleScholarPublicationId) && (
                          <div className="text-[9px] bg-slate-50 border border-slate-100 rounded-xl p-2 text-slate-500 space-y-0.5">
                            <div className="flex justify-between">
                              <span>Scholar ID:</span>
                              <span className="font-mono truncate max-w-[120px]">{pub.googleScholarPublicationId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Scholar Citations:</span>
                              <span className="font-bold">{pub.citations || 0}</span>
                            </div>
                          </div>
                        )}

                        {/* Stats block */}
                        <div className="flex items-center gap-3 text-[10px] font-bold text-[#475569] bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                          <span className="flex items-center gap-0.5"><Eye className="w-3.5 h-3.5 text-slate-400" /> {pub.views || 0} Reads</span>
                          <span className="flex items-center gap-0.5"><Download className="w-3.5 h-3.5 text-slate-400" /> {pub.downloads || 0} Downloads</span>
                          {pub.citations > 0 && <span className="flex items-center gap-0.5"><Award className="w-3.5 h-3.5 text-amber-500" /> {pub.citations} Citations</span>}
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="border-t border-[#E2E8F0] pt-4 mt-5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            onClick={() => handleReadClick(pub)}
                            className="text-xs font-bold text-[#2563EB] bg-blue-50/80 hover:bg-blue-50 px-3.5 py-1.5 rounded-[12px]"
                          >
                            Read
                          </button>
                          {isOwner && (
                            <>
                              <button
                                onClick={() => navigate(`/publication/${pub.slug}/edit`)}
                                className="text-xs font-bold text-[#475569] hover:bg-slate-100 px-3.5 py-1.5 rounded-[12px] transition-all"
                              >
                                Edit
                              </button>
                              
                              {pub.isDeleted ? (
                                <button
                                  onClick={() => handleRestore(pub)}
                                  className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1.5 rounded-[12px]"
                                >
                                  Restore
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDelete(pub)}
                                  className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-[12px]"
                                  title="Soft Delete (Trash)"
                                >
                                  Trash
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {/* Interactive secondary trigger tools */}
                        <div className="flex items-center gap-0.5">
                          {isOwner && isScholarImport && (
                            <button
                              onClick={() => handleOpenScholarNoteModal(pub)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
                              title="Add manual scholar notes"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={() => handleDuplicate(pub)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
                              title="Duplicate Publication"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleBookmarkToggle(pub)}
                            className={`p-2 hover:bg-slate-100 rounded-lg ${pub.bookmarked ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'}`}
                            title={pub.bookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${pub.bookmarked ? 'fill-current' : ''}`} />
                          </button>
                          {pub.doi && (
                            <button
                              onClick={() => handleCopyDOI(pub.doi)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
                              title="Copy DOI"
                            >
                              <CopyCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Card View Mode (List Cards) */}
            {viewMode === 'card' && (
              <div className="flex flex-col gap-4">
                {publications.map((pub) => {
                  const id = pub.id || pub._id;
                  const isSelected = selectedIds.includes(id);
                  const isScholarImport = !!pub.googleScholarPublicationId;
                  const hasPDF = !!pub.pdfUrl;
                  
                  return (
                    <motion.div
                      key={id}
                      whileHover={{ x: 2 }}
                      className={`bg-white border rounded-[16px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        isSelected ? 'border-[#2563EB] bg-blue-50/5' : 'border-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex items-start gap-4 flex-grow text-left">
                        {isOwner && (
                          <button
                            onClick={() => handleSelectToggle(id)}
                            className="mt-1 p-1 text-slate-400 hover:text-[#2563EB]"
                          >
                            {isSelected ? <CheckSquare className="w-4.5 h-4.5 text-[#2563EB]" /> : <Square className="w-4.5 h-4.5" />}
                          </button>
                        )}

                        <div className="space-y-1.5 flex-grow">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[8px] font-black bg-blue-50 text-[#2563EB] px-2 py-0.5 rounded uppercase tracking-wider">
                              {pub.publicationType || 'Article'}
                            </span>
                            {isScholarImport && <span className="text-[8px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded">Scholar</span>}
                            {hasPDF && <span className="text-[8px] bg-blue-600 text-white font-black px-2 py-0.5 rounded">PDF</span>}
                            {pub.status === 'draft' && <span className="text-[8px] bg-amber-500 text-white font-black px-2 py-0.5 rounded">Draft</span>}
                          </div>
                          
                          <h3 onClick={() => handleReadClick(pub)} className="text-base font-bold text-[#0F172A] hover:text-[#2563EB] cursor-pointer leading-snug">
                            {pub.title}
                          </h3>
                          
                          <p className="text-xs text-[#475569] font-medium">
                            By {pub.authors} &bull; <span className="text-slate-400 italic">{pub.publication || pub.journal || pub.conference} ({pub.year || 'N/A'})</span>
                          </p>

                          {pub.abstract && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 pr-4">{pub.abstract}</p>
                          )}
                        </div>
                      </div>

                      {/* Right Hand Actions */}
                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t border-slate-100 md:border-t-0 pt-3 md:pt-0 shrink-0">
                        {/* Stats mini */}
                        <div className="flex gap-2.5 text-[10px] text-[#475569] font-bold">
                          <span>{pub.views || 0} Reads</span>
                          <span>{pub.downloads || 0} DLs</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => handleReadClick(pub)}
                            className="text-xs font-bold text-[#2563EB] bg-blue-50/80 px-3 py-1.5 rounded-[12px] hover:bg-blue-50"
                          >
                            Read
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => navigate(`/publication/${pub.slug}/edit`)}
                              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-[12px] hover:bg-slate-100"
                            >
                              Edit
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleBookmarkToggle(pub)}
                            className={`p-2 rounded-lg border ${pub.bookmarked ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-white border-slate-200 text-slate-400'}`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Trash & Restore */}
                          {isOwner && (
                            pub.isDeleted ? (
                              <button
                                onClick={() => handleRestore(pub)}
                                className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg"
                                title="Restore"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDelete(pub)}
                                className="p-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg"
                                title="Soft Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Table View Mode (Highly Detailed Grid list) */}
            {viewMode === 'table' && (
              <div className="bg-white border border-[#E2E8F0] rounded-[16px] overflow-hidden shadow-xs">
                <p className="sm:hidden text-[10px] font-bold text-slate-400 px-4 pt-3 flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /><ChevronRight className="w-3 h-3 -ml-2" /> Swipe sideways to see all columns
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8FAFC] text-[#475569] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                      <tr>
                        {isOwner && (
                          <th className="px-6 py-4 w-4">
                            <button onClick={handleSelectAllToggle} className="p-1">
                              {selectedIds.length === publications.length ? (
                                <CheckSquare className="w-4.5 h-4.5 text-[#2563EB]" />
                              ) : (
                                <Square className="w-4.5 h-4.5" />
                              )}
                            </button>
                          </th>
                        )}
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Authors</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Visibility</th>
                        <th className="px-6 py-4 text-center">Reads</th>
                        <th className="px-6 py-4 text-center">Downloads</th>
                        <th className="px-6 py-4 text-center">Citations</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {publications.map((pub) => {
                        const id = pub.id || pub._id;
                        const isSelected = selectedIds.includes(id);
                        return (
                          <tr key={id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/5' : ''}`}>
                            {isOwner && (
                              <td className="px-6 py-4">
                                <button onClick={() => handleSelectToggle(id)} className="p-1">
                                  {isSelected ? <CheckSquare className="w-4.5 h-4.5 text-[#2563EB]" /> : <Square className="w-4.5 h-4.5 text-slate-400" />}
                                </button>
                              </td>
                            )}
                            <td className="px-6 py-4 max-w-sm">
                              <div className="font-bold text-[#0F172A] hover:text-[#2563EB] cursor-pointer truncate" onClick={() => handleReadClick(pub)}>
                                {pub.title}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{pub.publication || pub.journal || pub.conference || 'No Journal Venue'}</div>
                            </td>
                            <td className="px-6 py-4 text-[#475569] font-medium truncate max-w-[120px]">{pub.authors}</td>
                            <td className="px-6 py-4 uppercase font-bold text-[9px] text-[#2563EB]">{pub.publicationType || 'Article'}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#475569] font-bold text-[9px]">
                                {pub.visibility || 'Public'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-[#0F172A]">{pub.views || 0}</td>
                            <td className="px-6 py-4 text-center font-bold text-[#0F172A]">{pub.downloads || 0}</td>
                            <td className="px-6 py-4 text-center font-bold text-amber-600">{pub.citations || 0}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => handleReadClick(pub)} className="text-[#2563EB] hover:underline font-bold px-2 py-1">Read</button>
                                {isOwner && (
                                  <>
                                    <button onClick={() => navigate(`/publication/${pub.slug}/edit`)} className="text-[#475569] hover:underline font-bold px-2 py-1">Edit</button>
                                    {pub.isDeleted ? (
                                      <button onClick={() => handleRestore(pub)} className="text-emerald-600 hover:underline font-bold px-2 py-1">Restore</button>
                                    ) : (
                                      <button onClick={() => handleDelete(pub)} className="text-rose-600 hover:underline font-bold px-2 py-1">Trash</button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination Component */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white border border-[#E2E8F0] rounded-[16px] p-4 shadow-xs">
                <span className="text-xs text-[#475569] font-bold text-center sm:text-left">
                  Showing Page {page} of {totalPages} ({totalPubs} Total publications)
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    className="p-2.5 sm:p-2 border border-[#E2E8F0] bg-white rounded-xl hover:bg-slate-50 disabled:opacity-50 text-[#475569]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    className="p-2.5 sm:p-2 border border-[#E2E8F0] bg-white rounded-xl hover:bg-slate-50 disabled:opacity-50 text-[#475569]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 6. Sticky Floating Bulk Actions Drawer */}
        {isOwner && selectedIds.length > 0 && (
          <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white rounded-[16px] shadow-2xl z-40 max-w-4xl w-[95%] sm:w-[90%] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Count + close row (always visible, own row on mobile) */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-0">
              <div className="flex items-center gap-2 shrink-0">
                <CheckSquare className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider">{selectedIds.length} Selected</span>
              </div>
              <button 
                onClick={() => setSelectedIds([])} 
                className="sm:hidden p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Cancel selection"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            {/* Actions row: wraps on mobile so every action button stays visible without needing to swipe */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3.5 px-4 sm:px-6 pb-3 sm:py-4 sm:pt-0 max-h-[45vh] overflow-y-auto">
              <button 
                onClick={() => handleBulkActionExecute('publish')} 
                className="shrink-0 whitespace-nowrap text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3.5 py-2 rounded-xl transition-all active:scale-[0.98]"
              >
                Publish
              </button>
              
              <button 
                onClick={() => handleBulkActionExecute('move-draft')} 
                className="shrink-0 whitespace-nowrap text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl transition-all active:scale-[0.98]"
              >
                Move Draft
              </button>
              
              {filterStatus === 'trash' ? (
                <>
                  <button 
                    onClick={() => handleBulkActionExecute('restore')} 
                    className="shrink-0 whitespace-nowrap text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition-all active:scale-[0.98]"
                  >
                    Restore
                  </button>
                  <button 
                    onClick={() => handleBulkActionExecute('permanent-delete')} 
                    className="shrink-0 whitespace-nowrap text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl transition-all active:scale-[0.98]"
                  >
                    Delete Permanently
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleBulkActionExecute('delete')} 
                  className="shrink-0 whitespace-nowrap text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl transition-all active:scale-[0.98]"
                  title="Move to Trash"
                >
                  Move Trash
                </button>
              )}

              {/* Bulk Visibility Changer */}
              <div className="shrink-0 flex items-center gap-1 border border-slate-700 rounded-xl px-2.5 py-1 bg-slate-850">
                <select 
                  value={bulkVisibility}
                  onChange={(e) => setBulkVisibility(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none border-none cursor-pointer pr-1"
                >
                  <option value="Public" className="bg-slate-900">Public</option>
                  <option value="Private" className="bg-slate-900">Private</option>
                  <option value="Institution Only" className="bg-slate-900">Institution Only</option>
                </select>
                <button 
                  onClick={() => handleBulkActionExecute('update-visibility')}
                  className="text-[10px] bg-slate-800 hover:bg-slate-750 font-black px-2 py-1 rounded whitespace-nowrap"
                >
                  Apply
                </button>
              </div>

              <button 
                onClick={handleBulkCSVExport} 
                className="shrink-0 whitespace-nowrap text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-350 px-3.5 py-2 rounded-xl border border-slate-700"
              >
                Export Selected
              </button>

              <button 
                onClick={() => setSelectedIds([])} 
                className="hidden sm:block shrink-0 p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Cancel selection"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Analytics Engagement Modal */}
      {selectedPubAnalytics && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[24px] shadow-xl w-full max-w-2xl overflow-hidden flex flex-col p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-[#0F172A] text-sm sm:text-base">Research Engagement Analytics</h3>
                <p className="text-[11px] text-[#475569] line-clamp-1">{selectedPubAnalytics.title}</p>
              </div>
              <button
                onClick={() => setSelectedPubAnalytics(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid statistics metrics display */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
              <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Reads (Views)</span>
                <span className="text-xl font-black text-[#0F172A] mt-1 block">{selectedPubAnalytics.views || 0}</span>
              </div>
              <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Downloads</span>
                <span className="text-xl font-black text-[#0F172A] mt-1 block">{selectedPubAnalytics.downloads || 0}</span>
              </div>
              <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Citations</span>
                <span className="text-xl font-black text-amber-600 mt-1 block">{selectedPubAnalytics.citations || 0}</span>
              </div>
              <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Score Contribution</span>
                <span className="text-xl font-black text-[#2563EB] mt-1 block">+{selectedPubAnalytics.researchScore || 0}</span>
              </div>
            </div>

            {/* Interest Trend over 6 months */}
            <div className="space-y-2 border border-slate-100 p-4 rounded-2xl">
              <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Interest Trend over 6 months</h4>
              <div className="h-32 flex items-end justify-between pt-4 px-2">
                {[30, 45, 60, 40, 75, 95].map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 flex-grow">
                    <div className="w-full max-w-[28px] bg-[#2563EB] rounded-t-[4px]" style={{ height: `${val}%` }}></div>
                    <span className="text-[9px] text-slate-400 font-bold">Month {idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-right pt-3">
              <button
                onClick={() => setSelectedPubAnalytics(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Scholar Manual Notes Modal */}
      {activeScholarNotePub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[24px] shadow-xl w-full max-w-lg overflow-hidden flex flex-col p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-[#0F172A] text-sm sm:text-base">Google Scholar - Add Manual Notes</h3>
                <p className="text-[10px] text-slate-500 line-clamp-1">{activeScholarNotePub.title}</p>
              </div>
              <button onClick={() => setActiveScholarNotePub(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Scholar ID:</span>
                <span className="font-bold text-slate-700">{activeScholarNotePub.googleScholarPublicationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Citation Count:</span>
                <span className="font-bold text-slate-700">{activeScholarNotePub.citations || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scholar URL:</span>
                <a href={activeScholarNotePub.paperURL || '#'} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold inline-flex items-center gap-1 hover:underline">
                  View on Scholar <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="text-rose-500 text-[10px] font-semibold flex items-center gap-1 border-t border-slate-200/60 pt-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Note: Primary Google Scholar fields are read-only to ensure indexing integrity.</span>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manual Notes / Abstract Comments</label>
              <textarea
                rows={4}
                value={scholarNoteText}
                onChange={(e) => setScholarNoteText(e.target.value)}
                placeholder="Enter personal research context, research group notes, or manual modifications..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                onClick={() => setActiveScholarNotePub(null)}
                className="bg-slate-100 hover:bg-slate-250 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isSavingNote}
                onClick={handleSaveScholarNote}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSavingNote && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Notes</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reader Modal Overlay */}
      <AnimatePresence>
        {activeReadPub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-0 sm:p-6 lg:p-10">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-slate-50 w-full max-w-7xl h-[100dvh] sm:h-[85vh] rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col border-0 sm:border border-slate-200 relative text-left"
            >
              {/* Reader Header bar */}
              <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <span className="inline-flex items-center text-[9px] font-extrabold tracking-wider uppercase bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded">
                    {activeReadPub.publicationType || 'RESEARCH ARTICLE'}
                  </span>
                  <h2 className="text-xs sm:text-base font-extrabold text-slate-900 truncate max-w-[70vw] sm:max-w-2xl" title={activeReadPub.title}>
                    {activeReadPub.title}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveReadPub(null)}
                  className="shrink-0 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Content Areas */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden lg:grid lg:grid-cols-3 lg:gap-6 lg:p-6 lg:items-start lg:overflow-y-auto">
                <div className="h-[58dvh] sm:h-[62dvh] shrink-0 p-3 sm:p-4 lg:p-0 lg:h-full lg:min-h-[450px] lg:shrink lg:col-span-2">
                  {activeReadPub.pdfUrl ? (
                    <PDFReader
                      title={activeReadPub.title}
                      pdfUrl={activeReadPub.pdfUrl}
                      authors={activeReadPub.authors}
                      journal={activeReadPub.publication || activeReadPub.journal}
                      year={activeReadPub.year}
                      doi={activeReadPub.doi}
                      onDownload={() => handleDownload(activeReadPub)}
                    />
                  ) : (
                    <div className="h-full min-h-[400px] bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-extrabold text-slate-800">No Document File Attached</h3>
                      <p className="text-xs text-slate-400 max-w-xs leading-normal">
                        This publication was published as metadata-only. Full text PDF is not available.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Metadata Details - its own independent scroll region on mobile */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-6 lg:p-0 lg:overflow-visible lg:col-span-1">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                    {/* Authors */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authors</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {activeReadPub.authorsList && activeReadPub.authorsList.length > 0 ? (
                          activeReadPub.authorsList.map((author, index) => (
                            <span
                              key={index}
                              className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1 text-[10px] font-semibold text-slate-700 flex items-center gap-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              <span>{author.name}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-600 font-semibold">{activeReadPub.authors}</span>
                        )}
                      </div>
                    </div>

                    {/* Abstract */}
                    {activeReadPub.abstract && (
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Abstract</h4>
                        <p className="text-xs text-slate-600 leading-relaxed text-justify max-h-[220px] overflow-y-auto pr-1">
                          {activeReadPub.abstract}
                        </p>
                      </div>
                    )}

                    {/* Metadata Table */}
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Metadata Details</h4>
                      <div className="space-y-2 text-xs">
                        {activeReadPub.publicationCode && (
                          <div>
                            <span className="block text-[9px] text-slate-400 uppercase font-bold">Publication ID</span>
                            <span className="font-bold text-slate-800 block mt-0.5">{activeReadPub.publicationCode}</span>
                          </div>
                        )}

                        <div>
                          <span className="block text-[9px] text-slate-400 uppercase font-bold">Visibility</span>
                          <span className="font-bold text-slate-800 block mt-0.5">{activeReadPub.visibility || 'Public'}</span>
                        </div>

                        {(activeReadPub.publication || activeReadPub.journal) && (
                          <div>
                            <span className="block text-[9px] text-slate-400 uppercase font-bold">Journal/Venue</span>
                            <span className="font-bold text-slate-800 block mt-0.5 truncate">{activeReadPub.publication || activeReadPub.journal}</span>
                          </div>
                        )}

                        {activeReadPub.doi && (
                          <div>
                            <span className="block text-[9px] text-slate-400 uppercase font-bold">DOI</span>
                            <span className="font-bold text-blue-600 block mt-0.5 select-all">{activeReadPub.doi}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PublicationsLibraryPage;