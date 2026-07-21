import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { motion as motionFramer, AnimatePresence as AnimatePresenceFramer } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  User, 
  HeartHandshake, 
  Award, 
  FileText, 
  Bookmark, 
  Calendar, 
  TrendingUp, 
  BarChart2, 
  Database, 
  Download, 
  Eye, 
  Linkedin,
  BookMarked,
  Activity,
  ArrowUpDown
} from 'lucide-react';

import profileService from '../../../services/profile.service';
import publicationService from '../../../services/publication.service';
import { updateProfileState, updateUserState } from '../../../redux/slices/authSlice';

const PUB_CATEGORIES = ['Journal Paper', 'Conference Paper', 'Patent', 'Book Chapter', 'Book'];

const getPublicationCategory = (pub) => {
  const explicitType = (pub.publicationType || '').trim().toLowerCase();
  const normalizedMatch = PUB_CATEGORIES.find((c) => c.toLowerCase() === explicitType);
  if (normalizedMatch) return normalizedMatch;

  const haystack = [pub.publication, pub.journal, pub.conference, pub.publisher]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (explicitType === 'patent' || haystack.includes('patent')) return 'Patent';
  if (explicitType === 'book chapter' || haystack.includes('book chapter') || haystack.includes('chapter in')) return 'Book Chapter';
  if (explicitType === 'book' || pub.isbn || (haystack.includes('book') && !haystack.includes('chapter'))) return 'Book';
  if (pub.issn && !haystack.includes('proceedings') && !pub.conference) return 'Journal Paper';
  if (
    explicitType === 'conference' ||
    pub.conference ||
    haystack.includes('proceedings') ||
    haystack.includes('conference') ||
    haystack.includes('symposium') ||
    haystack.includes('workshop')
  ) {
    return 'Conference Paper';
  }
  if (explicitType === 'journal' || explicitType === 'article' || explicitType === 'research paper') return 'Journal Paper';
  if (explicitType) return explicitType.replace(/\b\w/g, (c) => c.toUpperCase());
  return 'Journal Paper';
};
import { 
  GoogleScholarIcon, 
  OrcidIcon, 
  ScopusIcon, 
  LinkedinIcon 
} from '../components/BrandIcons';
import { compressImage, compressBanner } from '../../../utils/imageCompressor';
import ImageUploadModal from '../components/ImageUploadModal';

// Subcomponents
import ProfileHeader from '../components/ProfileHeader';
import EducationTimeline from '../components/EducationTimeline';
import ExperienceTimeline from '../components/ExperienceTimeline';
import SkillsList from '../components/SkillsList';
import ProfileCompletion from '../components/ProfileCompletion';
import EditProfileModal from '../components/EditProfileModal';
import ShareProfileModal from '../components/ShareProfileModal';
import Avatar from '../../../components/ui/Avatar';

const ProfileOverview = () => {
  const { profile, refetch, isOwnProfile, username } = useOutletContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);

  const [saveLoading, setSaveLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [showAllCoAuthors, setShowAllCoAuthors] = useState(false);

  // Upload modal state
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [pubsList, setPubsList] = useState([]);
  const [pubsPage, setPubsPage] = useState(1);
  const [hasMorePubs, setHasMorePubs] = useState(false);
  const [loadingPubs, setLoadingPubs] = useState(false);
  const [pubTypeFilter, setPubTypeFilter] = useState('All');
  const [yearSort, setYearSort] = useState('desc');
  const [pubTypeCounts, setPubTypeCounts] = useState({ All: 0 });

  // Reset publications page and list on profile updates (e.g., after sync)
  useEffect(() => {
    setPubsPage(1);
    setPubsList([]);
  }, [profile]);

  useEffect(() => {
    const fetchPubs = async () => {
      if (!username) return;
      setLoadingPubs(true);
      try {
        const res = await publicationService.getPublicationsByUsername(username, {
          page: pubsPage,
          limit: 1000,
          sort: '-createdAt'
        });
        if (res.success) {
          const docs = res.data.docs;
          setPubsList((prev) => {
            if (pubsPage === 1) return docs;
            const existingIds = new Set(prev.map(p => p._id || p.id));
            const uniqueNew = docs.filter(p => !existingIds.has(p._id || p.id));
            return [...prev, ...uniqueNew];
          });
          setHasMorePubs(res.data.hasNextPage || (res.data.page < res.data.totalPages));
        }
      } catch (err) {
        if (err?.isCanceled) {
          // A newer identical request superseded this one — not a real failure.
          return;
        }
        console.error('Error fetching publications for overview:', err);
      } finally {
        setLoadingPubs(false);
      }
    };
    fetchPubs();
  }, [username, pubsPage, profile]);

  // Fetch total counts per category independently of the paginated/"load more" list
  useEffect(() => {
    const fetchPubTypeCounts = async () => {
      if (!username) return;
      try {
        const res = await publicationService.getPublicationsByUsername(username, {
          page: 1,
          limit: 0,
          sort: '-createdAt'
        });
        if (res.success) {
          const allDocs = res.data.docs;
          const counts = { All: allDocs.length };
          PUB_CATEGORIES.forEach((c) => {
            counts[c] = allDocs.filter((p) => getPublicationCategory(p) === c).length;
          });
          setPubTypeCounts(counts);
        }
      } catch (err) {
        if (err?.isCanceled) {
          // A newer identical request superseded this one — not a real failure.
          return;
        }
        console.error('Error fetching publication counts:', err);
      }
    };
    fetchPubTypeCounts();
  }, [username, profile]);

  const tabs = [
    { id: 'about', name: 'About', icon: User },
    { id: 'timeline', name: 'Education & Experience', icon: Layers },
    { id: 'skills', name: 'Skills', icon: HeartHandshake },
    { id: 'patents', name: 'Patents', icon: ShieldCheck },
    { id: 'books', name: 'Books', icon: BookOpen }
  ];

  const handleSaveProfile = async (formData) => {
    setSaveLoading(true);
    try {
      const res = await profileService.updateProfile(formData);
      if (res.success) {
        toast.success('Researcher profile updated successfully!');
        
        // 1. Update Redux Auth state (if it is own profile)
        if (isOwnProfile) {
          dispatch(updateProfileState(res.data));
          dispatch(updateUserState({
            firstName: formData.firstName,
            lastName: formData.lastName,
            fullName: `${formData.firstName} ${formData.lastName}`,
            profileImage: formData.profileImage,
            username: res.data.username,
            profileSlug: res.data.profileSlug,
            profileUrl: res.data.profileUrl
          }));
        }

        // 2. Update React Query Cache
        queryClient.setQueryData(['profile', username], (old) => {
          if (!old) return old;
          return {
            ...old,
            data: res.data
          };
        });

        setIsEditOpen(false);
        refetch();
      }
    } catch (err) {
      if (err?.isCanceled) {
          // A newer identical request superseded this one — not a real failure.
          return;
        }
      console.error(err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUploadAvatar = useCallback(async (file) => {
    setUploading(true);
    setUploadProgress(0);
    const loadingToast = toast.loading('Compressing profile image…');
    try {
      // Compress to 512×512 WebP with center-crop (avatar preset)
      const compressedFile = await compressImage(file, 'avatar');
      toast.loading('Uploading to Cloudflare R2…', { id: loadingToast });

      const res = await profileService.updateAvatar(compressedFile, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setUploadProgress(pct);
      });

      if (res.success) {
        toast.success('Profile photo updated!', { id: loadingToast });
        const updatedProfile = res.data;
        const imageUrl = updatedProfile.profileImage;

        // Optimistic: update React Query cache immediately
        queryClient.setQueryData(['profile', username], (old) => {
          if (!old) return old;
          return { ...old, data: updatedProfile };
        });

        // Update Redux state so Navbar + all components reflect instantly
        if (isOwnProfile) {
          dispatch(updateProfileState(updatedProfile));
          dispatch(updateUserState({ ...currentUser, profileImage: imageUrl }));
        }

        setAvatarModalOpen(false);
        refetch();
      } else {
        toast.error('Upload failed. Please retry.', { id: loadingToast });
      }
    } catch (err) {
      console.error('[ProfileOverview] Avatar upload error:', err);
      toast.error(err.message || 'Failed to upload profile photo', { id: loadingToast });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [username, isOwnProfile, currentUser, dispatch, queryClient, refetch]);

  const handleUploadCover = useCallback(async (file) => {
    setUploading(true);
    setUploadProgress(0);
    const loadingToast = toast.loading('Compressing banner…');
    try {
      // Compress to 1920×480 WebP (banner preset)
      const compressedFile = await compressImage(file, 'banner');
      toast.loading('Uploading banner to Cloudflare R2…', { id: loadingToast });

      const res = await profileService.updateBanner(compressedFile, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setUploadProgress(pct);
      });

      if (res.success) {
        toast.success('Cover banner updated!', { id: loadingToast });
        const updatedProfile = res.data;

        // Optimistic: update React Query cache
        queryClient.setQueryData(['profile', username], (old) => {
          if (!old) return old;
          return { ...old, data: updatedProfile };
        });

        if (isOwnProfile) dispatch(updateProfileState(updatedProfile));
        setBannerModalOpen(false);
        refetch();
      } else {
        toast.error('Banner upload failed. Please retry.', { id: loadingToast });
      }
    } catch (err) {
      console.error('[ProfileOverview] Banner upload error:', err);
      toast.error(err.message || 'Failed to upload cover banner', { id: loadingToast });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [username, isOwnProfile, dispatch, queryClient, refetch]);

  const handleFollow = () => {
    toast.success('Successfully followed researcher!');
  };

  const handleConnect = () => {
    toast.success('Connection request sent!');
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        user={profile}
        onEdit={() => setIsEditOpen(true)}
        onShare={() => setIsShareOpen(true)}
        onFollow={() => toast.success('Successfully followed researcher!')}
        onConnect={() => toast.success('Connection request sent!')}
        onAvatarChange={() => setAvatarModalOpen(true)}
        onCoverChange={() => setBannerModalOpen(true)}
        isOwnProfile={isOwnProfile}
        onSync={() => navigate(`/profile/${username}/research-identity`)}
      />

      {/* Avatar Upload Modal */}
      <ImageUploadModal
        isOpen={avatarModalOpen}
        onClose={() => !uploading && setAvatarModalOpen(false)}
        onUpload={handleUploadAvatar}
        title="Update Profile Photo"
        hint="Drag & drop your photo here or click to browse"
        aspectHint="Square (1:1) · Will be cropped to 512×512"
        uploading={uploading}
        progress={uploadProgress}
      />

      {/* Banner Upload Modal */}
      <ImageUploadModal
        isOpen={bannerModalOpen}
        onClose={() => !uploading && setBannerModalOpen(false)}
        onUpload={handleUploadCover}
        title="Update Cover Banner"
        hint="Drag & drop your banner image here or click to browse"
        aspectHint="Wide (16:3) · Recommended 1920×480px"
        uploading={uploading}
        progress={uploadProgress}
      />


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Center Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="relative">
            <div
              role="tablist"
              aria-label="Profile sections"
              className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-wrap gap-1 shadow-[0_4px_20px_rgba(15,23,42,0.015)]"
            >
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tabpanel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white shadow-md shadow-[#2563EB]/15'
                        : 'text-[#475569] hover:bg-[#EDE9FE]/55 hover:text-[#4F46E5]'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Panel */}
          <div className="min-h-[400px]">
            <AnimatePresenceFramer mode="wait">
              <motionFramer.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'about' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-black text-[#0F172A] tracking-tight">Professional Biography</h3>
                        <span className="text-[10px] bg-[#EDE9FE] text-[#4F46E5] border border-[#EDE9FE] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                          Researcher (academic) at Research Connect
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed font-medium whitespace-pre-line bg-[#F8FAFC] p-4.5 rounded-2xl border border-slate-100/60">
                        {profile?.researchSummary || profile?.bio || 'No professional biography added yet.'}
                      </p>
                    </div>

                    {/* Academic & Personal Information section */}
                    <div className="space-y-4 pt-6 border-t border-slate-200">
                      <h3 className="text-base font-black text-[#0F172A] tracking-tight">Academic & Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-1.5 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          {[
                            { label: 'Full Name', value: profile?.displayName || profile?.fullName || `${profile?.firstName || ''} ${profile?.lastName || ''}`, bulletColor: 'bg-[#2563EB]' },
                            { label: 'Date of Birth', value: profile?.dateOfBirth || 'N/A', bulletColor: 'bg-[#22C55E]' },
                            { label: 'Nationality', value: profile?.nationality || 'N/A', bulletColor: 'bg-[#F59E0B]' },
                            { label: 'Designation', value: profile?.designation || 'Academic Researcher', bulletColor: 'bg-[#4F46E5]' },
                            { label: 'Department', value: profile?.department || 'N/A', bulletColor: 'bg-[#EF4444]' },
                            { label: 'Institution', value: profile?.institution || 'N/A', bulletColor: 'bg-[#00CCBB]' },
                            { label: 'Email ID', value: profile?.email || 'N/A', bulletColor: 'bg-[#2563EB]', isEmail: true }
                          ].map((item, idx) => (
                            <div key={item.label} className={`flex justify-between items-center text-xs p-2.5 rounded-xl border border-transparent transition-all hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-[#F1F5F9]/50' : 'bg-white'}`}>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${item.bulletColor}`} />
                                <span className="font-extrabold text-[#334155]">{item.label}</span>
                              </div>
                              <span className={`font-black text-[#0F172A] truncate max-w-[180px] sm:max-w-xs ${item.isEmail ? 'text-[#2563EB] hover:underline cursor-pointer' : ''}`}>
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Right Column (With Icons) */}
                        <div className="space-y-3 p-5 bg-white rounded-2xl border border-slate-200">
                          {[
                            { label: 'Google Scholar ID', key: 'googleScholar', icon: GoogleScholarIcon, color: 'bg-blue-50/50 border border-blue-100/30' },
                            { label: 'ORCID', key: 'orcid', icon: OrcidIcon, color: 'bg-green-50/50 border border-green-100/30' },
                            { label: 'SCOPUS AUTHOR ID', key: 'scopus', icon: ScopusIcon, color: 'bg-orange-50/50 border border-orange-100/30' },
                            { label: 'LinkedIn', key: 'linkedin', icon: LinkedinIcon, color: 'bg-blue-50/50 border border-blue-100/30' }
                          ].map((network) => {
                            const rawValue = profile?.socialLinks?.[network.key] || '';
                            let valDisplay = rawValue;
                            if (rawValue && rawValue.startsWith('http')) {
                              try {
                                const urlObj = new URL(rawValue);
                                if (network.key === 'googleScholar') {
                                  valDisplay = urlObj.searchParams.get('user') || rawValue;
                                } else {
                                  valDisplay = urlObj.pathname.split('/').filter(Boolean).pop() || rawValue;
                                }
                              } catch (e) {
                                valDisplay = rawValue;
                              }
                            }
                            
                            const Icon = network.icon;
                            return (
                              <div key={network.key} className="flex items-center justify-between gap-3 text-xs py-2 border-b border-slate-100 last:border-0">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg border border-slate-300 flex items-center justify-center ${network.color}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-extrabold text-[#475569]">{network.label}</span>
                                </div>
                                {rawValue ? (
                                  <a href={rawValue} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline truncate max-w-[150px] sm:max-w-xs transition-colors">
                                    {valDisplay}
                                  </a>
                                ) : (
                                  <span className="text-slate-400 font-bold italic">Not Connected</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Education & Experience Section */}
                    <div className="space-y-4 pt-6 border-t border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Education Column */}
                        <div className="space-y-3">
                          <h3 className="text-base font-black text-[#0F172A] tracking-tight">Education</h3>
                          <EducationTimeline education={profile?.education} />
                        </div>
                        
                        {/* Experience Column */}
                        <div className="space-y-3">
                          <h3 className="text-base font-black text-[#0F172A] tracking-tight">Experience</h3>
                          <ExperienceTimeline experience={profile?.experience} />
                        </div>
                      </div>
                    </div>

                    {/* Availability Card */}
                    {profile?.availability && (
                      <div className="pt-6 border-t border-slate-200">
                        <div className="flex items-start gap-2.5 p-4 border border-slate-200 rounded-2xl bg-[#F8FAFC]">
                          <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Availability</h4>
                            <p className="text-xs text-[#475569] mt-0.5 font-medium">{profile.availability}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Publications Card */}
                    {/* Dynamic Publications Card */}
<div className="space-y-4 pt-6 border-t border-slate-200">
  <div className="flex items-center justify-between gap-3 flex-wrap">
    <h3 className="text-base font-black text-[#0F172A] tracking-tight">Publications Portfolio</h3>
    <div className="flex items-center gap-2">
      <button
        onClick={() => setYearSort((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
        className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[#475569] hover:bg-slate-50 transition-colors"
      >
        <ArrowUpDown className="w-3 h-3" />
        Year: {yearSort === 'desc' ? 'Newest' : 'Oldest'}
      </button>
    </div>
  </div>

  {/* Category counts */}
  <div className="flex flex-wrap gap-1.5">
    {['All', ...PUB_CATEGORIES].map((c) => {
      const count = pubTypeCounts[c] || 0;
      const isActive = pubTypeFilter === c;
      return (
        <button
          key={c}
          onClick={() => setPubTypeFilter(c)}
          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
            isActive
              ? 'bg-[#2563EB] border-[#2563EB] text-white'
              : 'bg-white border-slate-200 text-[#475569] hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          {c}
          <span className={`px-1.5 rounded-full text-[9px] ${isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
            {count}
          </span>
        </button>
      );
    })}
  </div>
  
  {(() => {
    const filteredPubs = (pubTypeFilter === 'All'
      ? [...pubsList]
      : pubsList.filter((p) => getPublicationCategory(p) === pubTypeFilter)
    ).sort((a, b) => 
      yearSort === 'desc' 
        ? (b.year || 0) - (a.year || 0) 
        : (a.year || 0) - (b.year || 0)
    );

    return filteredPubs.length > 0 ? (
      <div className="space-y-3.5">
        {filteredPubs.map((pub) => {
          const id = pub.id || pub._id;
          const isScholarImport = !!pub.googleScholarPublicationId;
          const hasPDF = !!pub.pdfUrl;

          return (
            <div key={id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-grow text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-black bg-blue-50 text-[#2563EB] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    {getPublicationCategory(pub)}
                  </span>
                  {isScholarImport && (
                    <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md">Scholar</span>
                  )}
                  {hasPDF && (
                    <span className="text-[8px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md">PDF</span>
                  )}
                  {/* Prominent Year Display */}
                  {pub.year && (
                    <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {pub.year}
                    </span>
                  )}
                </div>

                <h4 
                  className="text-sm font-extrabold text-[#0F172A] leading-snug hover:text-[#2563EB] cursor-pointer transition-colors"
                  onClick={() => navigate(`/publication/${pub.slug || pub._id}`)}
                >
                  {pub.title}
                </h4>

                <p className="text-[11px] text-[#475569] font-semibold">
                  By {pub.authors}
                </p>

                {/* Journal/Conference info */}
                {(pub.publication || pub.journal || pub.conference) && (
                  <p className="text-[10px] text-slate-400 font-medium italic">
                    {pub.publication || pub.journal || pub.conference}
                  </p>
                )}

                {pub.doi && (
                  <span className="text-[9px] bg-slate-50 border border-slate-150 text-slate-500 font-bold px-2 py-0.5 rounded inline-block">
                    DOI: {pub.doi}
                  </span>
                )}
              </div>

              {/* Stats & Actions */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0">
                <div className="flex items-center gap-2.5 text-[10px] font-bold text-[#475569]">
                  <span className="flex items-center gap-0.5"><Eye className="w-3.5 h-3.5 text-slate-400" /> {pub.views || 0} Reads</span>
                  <span className="flex items-center gap-0.5"><Download className="w-3.5 h-3.5 text-slate-400" /> {pub.downloads || 0} Downloads</span>
                  {pub.citations > 0 && <span className="flex items-center gap-0.5"><Award className="w-3.5 h-3.5 text-amber-500" /> {pub.citations} Citations</span>}
                </div>
                <button
                  onClick={() => navigate(`/publication/${pub.slug || pub._id}`)}
                  className="text-xs font-bold text-[#2563EB] bg-[#DBEAFE] hover:bg-[#DBEAFE]/80 px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
                >
                  Read Output
                </button>
              </div>
            </div>
          );
        })}
        
        {hasMorePubs && (
          <button
            onClick={() => setPubsPage((prev) => prev + 1)}
            disabled={loadingPubs}
            className="w-full text-center py-2.5 border border-slate-200 bg-slate-50 hover:bg-[#EDE9FE]/40 text-xs font-black text-[#475569] hover:text-[#4F46E5] uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-[0.98] mt-4 flex items-center justify-center gap-1.5"
          >
            {loadingPubs ? 'Loading...' : 'Load More Publications'}
          </button>
        )}
      </div>
    ) : (
      <div className="text-center py-12 bg-[#F8FAFC] border border-slate-200 rounded-2xl shadow-sm">
        <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
        <p className="text-xs font-bold text-slate-500 uppercase">
          {pubTypeFilter === 'All' ? 'No publications published yet' : `No ${pubTypeFilter} found`}
        </p>
      </div>
    );
  })()}
</div>
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                    <div className="space-y-4">
                      <h3 className="text-base font-black text-slate-900 tracking-tight">Education History</h3>
                      <EducationTimeline education={profile?.education} />
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-200">
                      <h3 className="text-base font-black text-slate-900 tracking-tight">Professional Work Experience</h3>
                      <ExperienceTimeline experience={profile?.experience} />
                    </div>
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Skills & Expertise</h3>
                    <SkillsList skills={profile?.skills} />
                  </div>
                )}

                {activeTab === 'patents' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Patents Portfolio</h3>
                    {profile?.patents && profile.patents.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {profile.patents.map((pat, i) => (
                          <div key={i} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="text-sm font-extrabold text-slate-900">{pat.title}</h4>
                              {pat.patentNumber && (
                                <span className="text-[10px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-lg border border-slate-200">
                                  No: {pat.patentNumber}
                                </span>
                              )}
                            </div>
                            {pat.inventors && (
                              <p className="text-xs text-indigo-600 font-bold">Inventors: {pat.inventors}</p>
                            )}
                            {pat.description && (
                              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{pat.description}</p>
                            )}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-400 font-medium">Issued: {pat.issueDate || 'N/A'}</span>
                              {pat.url && (
                                <a href={pat.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline">
                                  View Patent Document &rarr;
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-bold text-slate-400">No patents registered yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'books' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Published Books & Chapters</h3>
                    {profile?.books && profile.books.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {profile.books.map((bk, i) => (
                          <div key={i} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <h4 className="text-sm font-extrabold text-slate-900">{bk.title}</h4>
                            {bk.authors && (
                              <p className="text-xs text-slate-500 font-semibold">By: {bk.authors}</p>
                            )}
                            {bk.publisher && (
                              <p className="text-xs text-indigo-600 font-bold">Publisher: {bk.publisher} ({bk.year || 'N/A'})</p>
                            )}
                            {bk.description && (
                              <p className="text-xs text-slate-500 leading-relaxed font-medium">{bk.description}</p>
                            )}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-400 font-medium">ISBN: {bk.isbn || 'N/A'}</span>
                              {bk.url && (
                                <a href={bk.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline">
                                  Publisher Link &rarr;
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Bookmark className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-bold text-slate-400">No books added yet</p>
                      </div>
                    )}
                  </div>
                )}
              </motionFramer.div>
            </AnimatePresenceFramer>
          </div>
        </div>
        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Research Analytics & Metrics Sidebar Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] space-y-4">
            <div>
              <h4 className="text-xs font-black text-[#0F172A] tracking-tight uppercase">Research Analytics & Metrics</h4>
              <p className="text-[10px] text-[#475569] mt-0.5 font-bold uppercase tracking-wider">Academic Performance Indicators</p>
            </div>
            
            {(() => {
              const activeMetrics = [
                { label: 'Publications', value: profile?.metrics?.publicationsCount ?? 0, icon: FileText, cardBg: 'bg-[#DBEAFE] border-[#DBEAFE] hover:shadow-[0_8px_30px_rgb(219,234,254,0.5)]', textColor: 'text-[#2563EB]', labelColor: 'text-[#475569]', iconColor: 'text-[#2563EB]', iconBg: 'bg-white' },
                { label: 'Citations', value: profile?.metrics?.citationsCount ?? profile?.metrics?.totalCitations ?? 0, icon: TrendingUp, cardBg: 'bg-[#DCFCE7] border-[#DCFCE7] hover:shadow-[0_8px_30px_rgb(220,252,231,0.5)]', textColor: 'text-[#22C55E]', labelColor: 'text-[#475569]', iconColor: 'text-[#22C55E]', iconBg: 'bg-white' },
                { label: 'h-index', value: profile?.metrics?.hIndex ?? 0, icon: Award, cardBg: 'bg-[#EDE9FE] border-[#EDE9FE] hover:shadow-[0_8px_30px_rgb(237,233,254,0.5)]', textColor: 'text-[#4F46E5]', labelColor: 'text-[#475569]', iconColor: 'text-[#4F46E5]', iconBg: 'bg-white' },
                { label: 'i10-index', value: profile?.metrics?.i10Index ?? 0, icon: BarChart2, cardBg: 'bg-[#FEF3C7] border-[#FEF3C7] hover:shadow-[0_8px_30px_rgb(254,243,199,0.5)]', textColor: 'text-[#F59E0B]', labelColor: 'text-[#475569]', iconColor: 'text-[#F59E0B]', iconBg: 'bg-white' },
                { label: 'Experience (Y)', value: profile?.metrics?.experienceYears ?? profile?.metrics?.researchExperience ?? 0, icon: Calendar, cardBg: 'bg-slate-50 border-slate-200 hover:shadow-[0_8px_30px_rgb(241,245,249,0.5)]', textColor: 'text-slate-800', labelColor: 'text-[#475569]', iconColor: 'text-slate-600', iconBg: 'bg-white' },
                { label: 'Projects', value: profile?.metrics?.projectsCount ?? 0, icon: BookMarked, cardBg: 'bg-pink-50 border-pink-100 hover:shadow-[0_8px_30px_rgb(253,242,248,0.5)]', textColor: 'text-pink-600', labelColor: 'text-[#475569]', iconColor: 'text-pink-600', iconBg: 'bg-white' },
                { label: 'Patents', value: profile?.metrics?.patentsCount ?? 0, icon: ShieldCheck, cardBg: 'bg-teal-50 border-teal-100 hover:shadow-[0_8px_30px_rgb(240,253,250,0.5)]', textColor: 'text-teal-600', labelColor: 'text-[#475569]', iconColor: 'text-teal-600', iconBg: 'bg-white' },
                { label: 'Books', value: profile?.metrics?.booksCount ?? 0, icon: BookOpen, cardBg: 'bg-rose-50 border-rose-100 hover:shadow-[0_8px_30px_rgb(255,241,242,0.5)]', textColor: 'text-rose-600', labelColor: 'text-[#475569]', iconColor: 'text-rose-600', iconBg: 'bg-white' },
                { label: 'Datasets', value: profile?.metrics?.datasetsCount ?? 0, icon: Database, cardBg: 'bg-amber-50 border-amber-100 hover:shadow-[0_8px_30px_rgb(254,243,199,0.5)]', textColor: 'text-amber-700', labelColor: 'text-[#475569]', iconColor: 'text-amber-700', iconBg: 'bg-white' },
                { label: 'Downloads', value: profile?.metrics?.downloadsCount ?? 0, icon: Download, cardBg: 'bg-cyan-50 border-cyan-100 hover:shadow-[0_8px_30px_rgb(236,254,255,0.5)]', textColor: 'text-cyan-600', labelColor: 'text-[#475569]', iconColor: 'text-cyan-600', iconBg: 'bg-white' },
                { label: 'Views', value: profile?.metrics?.viewsCount ?? 0, icon: Eye, cardBg: 'bg-emerald-50 border-emerald-100 hover:shadow-[0_8px_30px_rgb(236,253,245,0.5)]', textColor: 'text-emerald-700', labelColor: 'text-[#475569]', iconColor: 'text-emerald-700', iconBg: 'bg-white' },
                { label: 'Research Score', value: profile?.metrics?.researchScore ?? 0, icon: Activity, cardBg: 'bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE] border-[#EDE9FE] hover:shadow-[0_8px_30px_rgb(237,233,254,0.7)]', textColor: 'text-[#4F46E5]', labelColor: 'text-[#475569]', iconColor: 'text-[#4F46E5]', iconBg: 'bg-white' }
              ];

              if (activeMetrics.length === 0) {
                return (
                  <p className="text-[11px] text-slate-400 italic text-center py-2">
                    No active academic metrics synced.
                  </p>
                );
              }

              return (
                <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {activeMetrics.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className={`p-3.5 rounded-2xl border transition-all duration-350 flex flex-col justify-between hover:-translate-y-0.5 shadow-[0_2px_4px_rgba(15,23,42,0.01)] ${item.cardBg}`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className={`text-[9px] uppercase font-extrabold tracking-wider truncate ${item.labelColor}`}>
                            {item.label}
                          </span>
                          <div className={`p-1.5 rounded-xl flex-shrink-0 shadow-sm flex items-center justify-center ${item.iconBg} ${item.iconColor}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <h5 className={`text-xl font-black tracking-tight leading-none ${item.textColor}`}>
                            {item.value}
                          </h5>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Profile Completion Card */}
          <ProfileCompletion profile={profile} user={profile} />

          {/* Research Areas / Tags */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] space-y-3.5">
            <div>
              <h4 className="text-xs font-black text-[#0F172A] tracking-tight uppercase">Research Areas</h4>
              <p className="text-[9px] text-[#475569] mt-0.5 font-bold uppercase tracking-wider">Primary Research Interests</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile?.researchAreas && profile.researchAreas.length > 0 ? (
                (() => {
                  const tagColors = [
                    { bg: 'bg-[#DBEAFE]/80', text: 'text-[#2563EB]', border: 'border-[#DBEAFE]' },
                    { bg: 'bg-[#DCFCE7]/85', text: 'text-[#22C55E]', border: 'border-[#DCFCE7]' },
                    { bg: 'bg-[#EDE9FE]/85', text: 'text-[#4F46E5]', border: 'border-[#EDE9FE]' },
                    { bg: 'bg-[#FEF3C7]/80', text: 'text-[#F59E0B]', border: 'border-[#FEF3C7]' },
                    { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' },
                    { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100' }
                  ];
                  return profile.researchAreas.map((area, idx) => {
                    const color = tagColors[idx % tagColors.length];
                    return (
                      <span
                        key={area._id || area.name}
                        className={`text-[10px] ${color.bg} ${color.text} border ${color.border} px-3 py-1.5 rounded-xl font-extrabold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm`}
                      >
                        {area.name}
                      </span>
                    );
                  });
                })()
              ) : (
                <p className="text-[11px] text-slate-400 italic">No research areas defined</p>
              )}
            </div>
          </div>

          {/* Keywords / Chips */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] space-y-3">
            <h4 className="text-xs font-black text-[#0F172A] tracking-tight uppercase">Top Keywords</h4>
            <div className="flex flex-wrap gap-1.5">
              {profile?.keywords && profile.keywords.length > 0 ? (
                (() => {
                  const tagColors = [
                    { bg: 'bg-[#DBEAFE]/50', text: 'text-[#2563EB]', border: 'border-blue-100/40', countBg: 'bg-[#2563EB]/10' },
                    { bg: 'bg-[#DCFCE7]/55', text: 'text-[#22C55E]', border: 'border-green-100/40', countBg: 'bg-[#22C55E]/10' },
                    { bg: 'bg-[#EDE9FE]/55', text: 'text-[#4F46E5]', border: 'border-purple-100/40', countBg: 'bg-[#4F46E5]/10' },
                    { bg: 'bg-[#FEF3C7]/50', text: 'text-[#F59E0B]', border: 'border-amber-100/40', countBg: 'bg-[#F59E0B]/10' }
                  ];
                  return profile.keywords.slice(0, 15).map((key, idx) => {
                    const color = tagColors[idx % tagColors.length];
                    return (
                      <span
                        key={key._id || key.name}
                        className={`inline-flex items-center gap-1.5 text-[10px] ${color.bg} ${color.text} border ${color.border} px-2.5 py-1 rounded-lg font-bold`}
                      >
                        <span>{key.name}</span>
                        <span className={`px-1.5 py-0.2 rounded-md font-black ${color.countBg}`}>
                          {key.count}
                        </span>
                      </span>
                    );
                  });
                })()
              ) : (
                <p className="text-[11px] text-slate-400 italic">No keywords synced</p>
              )}
            </div>
          </div>

          {/* Co-Authors Network Sidebar Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] space-y-4">
            <div>
              <h4 className="text-xs font-black text-[#0F172A] tracking-tight uppercase">Co-Authors</h4>
              <p className="text-[10px] text-[#475569] mt-0.5 font-bold uppercase tracking-wider">Academic Collaboration Network</p>
            </div>
            
            {profile?.coAuthors && profile.coAuthors.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2.5">
                  {(showAllCoAuthors ? profile.coAuthors : profile.coAuthors.slice(0, 5)).map((co, idx) => {
                    const borderColors = [
                      'border-blue-100 hover:border-blue-300 bg-blue-50/10',
                      'border-green-100 hover:border-green-300 bg-green-50/10',
                      'border-purple-100 hover:border-purple-300 bg-purple-50/10',
                      'border-amber-100 hover:border-amber-300 bg-amber-50/10'
                    ];
                    const selectedBorder = borderColors[idx % borderColors.length];
                    return (
                      <div key={co._id || co.name} className={`p-3 border rounded-xl hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 flex items-start gap-2.5 ${selectedBorder}`}>
                        <Avatar
                          src={co.photo}
                          name={co.name}
                          size="sm"
                          showBorder
                        />
                        <div className="min-w-0 flex-grow">
                          <h5 className="text-xs font-black text-[#0F172A] truncate">{co.name}</h5>
                          <p className="text-[9px] text-[#475569] truncate font-bold uppercase tracking-wide">{co.affiliation || 'Academic Researcher'}</p>
                          {co.profileURL && (
                            <a href={co.profileURL} target="_blank" rel="noopener noreferrer" className="text-[9px] text-[#2563EB] font-black hover:text-[#1D4ED8] hover:underline block mt-1 transition-colors">
                              Scholar Profile &rarr;
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {profile.coAuthors.length > 5 && (
                  <button
                    onClick={() => setShowAllCoAuthors(!showAllCoAuthors)}
                    className="w-full text-center py-2.5 border border-slate-200 bg-slate-50 hover:bg-[#EDE9FE]/40 text-[10px] font-black text-[#475569] hover:text-[#4F46E5] uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-[0.98]"
                  >
                    {showAllCoAuthors ? 'Show Less' : `View All (${profile.coAuthors.length})`}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No co-authors indexed yet.</p>
            )}
          </div>
        </div>
      </div>

      {isEditOpen && (
        <EditProfileModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          profile={profile}
          onSave={handleSaveProfile}
          loading={saveLoading}
        />
      )}

      {isShareOpen && (
        <ShareProfileModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          profile={profile}
        />
      )}
    </div>
  );
};

export default ProfileOverview;