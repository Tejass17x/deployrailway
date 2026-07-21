import React, { useState } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { BookMarked } from 'lucide-react';

import profileService from '../../../services/profile.service';

import AuthenticatedNavbar from '../../../layouts/Navbar/AuthenticatedNavbar';
import ProfileSidebar from '../components/ProfileSidebar';
import Button from '../../../components/common/buttons/Button';

const ProfileLayout = () => {
  const { username } = useParams();
  const currentUser = useSelector((state) => state.auth.user);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Determine if viewing own profile
  const isOwnProfile = currentUser && (
    currentUser.slug === username ||
    currentUser.profileSlug === username ||
    currentUser.username === username
  );

  // Query to fetch profile details (hydrated from all collections)
  const { data: profileData, isLoading, error, refetch } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      return await profileService.getPublicProfile(username);
    },
    staleTime: 1000 * 30, // 30 seconds — keeps profile fresh after scholar sync
    refetchOnWindowFocus: true
  });

  const profile = profileData?.data;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-page">
        <AuthenticatedNavbar />
        <div className="flex flex-col items-center justify-center flex-grow gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-page">
        <AuthenticatedNavbar />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
          <div className="p-4 bg-red-50 text-accent-red rounded-full w-fit mx-auto">
            <BookMarked className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-text-primary tracking-tight">Failed to Load Profile</h3>
          <p className="text-xs text-text-secondary leading-relaxed font-semibold">
            {error.message || 'The requested researcher profile does not exist or has been suspended.'}
          </p>
          <Button variant="ghost" onClick={() => refetch()} className="mx-auto">Retry Loading</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-page text-text-primary">
      <AuthenticatedNavbar
        onMenuClick={() => setIsMobileOpen(!isMobileOpen)}
        isMobileMenuOpen={isMobileOpen}
      />
      <div className="flex flex-grow relative">
        <ProfileSidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <main className="flex-grow overflow-x-hidden p-6 md:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {/* The individual sub-pages render here */}
            <Outlet context={{ profile, refetch, isOwnProfile, username }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileLayout;