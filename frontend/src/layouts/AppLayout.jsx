import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AuthenticatedNavbar from './Navbar/AuthenticatedNavbar';
import ProfileSidebar from '../modules/profile/components/ProfileSidebar';

const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen min-h-screen overflow-hidden bg-bg-page text-text-primary">
      <AuthenticatedNavbar
        onMenuClick={() => setIsMobileOpen(!isMobileOpen)}
        isMobileMenuOpen={isMobileOpen}
      />

      <div className="flex flex-1 flex-grow min-h-0 relative">
        <ProfileSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <main className="flex-1 flex-grow min-w-0 overflow-y-auto overflow-x-hidden p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;