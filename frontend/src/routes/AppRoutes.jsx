import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import ComingSoon from '../components/common/ComingSoon';
import ProjectsPage from "../modules/project/pages/ProjectsPage";
import HomeFeed from '../modules/home/pages/HomeFeed';
import AboutUs from '../pages/AboutUs/AboutUs';
import MessagesView from '../modules/message/components/MessagesView';
const HomeHub = React.lazy(() => import('./HomeHub'));

// Guards
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Lazy-loaded Pages
const LoginPage = React.lazy(() => import('../modules/authentication/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('../modules/authentication/pages/RegisterPage'));
const OtpVerificationPage = React.lazy(() => import('../modules/authentication/pages/OtpVerificationPage'));
const ForgotPasswordPage = React.lazy(() => import('../modules/authentication/pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('../modules/authentication/pages/ResetPasswordPage'));
const SuccessPage = React.lazy(() => import('../modules/authentication/pages/SuccessPage'));
const ResearchIdentityPage = React.lazy(() => import('../modules/profile/pages/ResearchIdentityPage'));
const ProfileRedirect = React.lazy(() => import('../modules/profile/components/ProfileRedirect'));
const PublicationCreatePage = React.lazy(() => import('../modules/publication/pages/PublicationCreatePage'));
const PublicationDetailPage = React.lazy(() => import('../modules/publication/pages/PublicationDetailPage'));
const PublicationsLibraryPage = React.lazy(() => import('../modules/publication/pages/PublicationsLibraryPage'));
const PublicationEditPage = React.lazy(() => import('../modules/publication/pages/PublicationEditPage'));
const PublicationReader = React.lazy(() => import('../modules/publication/pages/PublicationReader'));
const PublicationAnalyticsPage = React.lazy(() => import('../modules/publication/pages/PublicationAnalyticsPage'));
const GlobalSearch = React.lazy(() => import('../pages/Search/GlobalSearch'));
const MessagesPage = React.lazy(() => import('../modules/messaging/pages/MessagesPage'));
const CreateProject = React.lazy(() => import('../modules/project/pages/CreateProject'));
const ProjectDetails = React.lazy(() => import('../modules/project/pages/ProjectDetails'));
const ProjectDashboard = React.lazy(() => import('../modules/project/pages/ProjectDashboard'));
const EditProject = React.lazy(() => import('../modules/project/pages/EditProject'));


// Social Collaboration Modules
const NetworkPage = React.lazy(() => import('../modules/connections/pages/NetworkPage'));
const ConnectionsPage = React.lazy(() => import('../modules/connections/pages/ConnectionsPage'));
const InvitationsPage = React.lazy(() => import('../modules/connections/pages/InvitationsPage'));
const DiscoverResearchersPage = React.lazy(() => import('../modules/follow/pages/DiscoverResearchersPage'));
const NotificationCenter = React.lazy(() => import('../modules/notifications/pages/NotificationCenter'));

// Phase 6 — Collaboration Workspaces
const MyWorkspaces = React.lazy(() => import('../modules/collaborations/pages/MyWorkspaces'));
const WorkspaceOverview = React.lazy(() => import('../modules/collaborations/pages/WorkspaceOverview'));
const CreateWorkspace = React.lazy(() => import('../modules/collaborations/pages/CreateWorkspace'));



// Phase 8 — Activity Feed & Academic Timeline
const HomeFeedV2 = React.lazy(() => import('../modules/feed/pages/HomeFeedV2'));
const TrendingFeed = React.lazy(() => import('../modules/feed/pages/TrendingFeed'));
const LatestFeed = React.lazy(() => import('../modules/feed/pages/LatestFeed'));
const BookmarksFeed = React.lazy(() => import('../modules/feed/pages/BookmarksFeed'));

// Profile module routes nested
import profileRoutes from '../modules/profile/routes/profile.routes';

// Legal pages
const TermsOfServicePage = React.lazy(() => import('../modules/legal/pages/TermsOfServicePage'));
const PrivacyPolicyPage = React.lazy(() => import('../modules/legal/pages/PrivacyPolicyPage'));

// Help Center Module
const HelpCenterPage = React.lazy(() => import('../pages/HelpCenter/HelpCenterPage'));

const AppRoutes = () => {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <Routes>
        {/* Authentication Layout */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />
          <Route path="otp" element={
            <PublicRoute>
              <OtpVerificationPage />
            </PublicRoute>
          } />
          <Route path="forgot-password" element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } />
          <Route path="reset-password" element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          } />
          <Route path="success" element={
            <SuccessPage />
          } />
        </Route>

        {/* Public Root Route — handles guest landing page or auth redirect to /home */}
        <Route path="/" element={<HomeHub />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/about" element={<AboutUs />} />

        {/* Dashboard & Modules Layout (No Sidebar) */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          {/* /home — Authenticated Home Feed */}
          <Route path="home" element={
            <>
              <HomeFeed />
              <MessagesView />
            </>
          } />
          <Route path="profile" element={<ProfileRedirect />} />
          <Route path="research-identity" element={<ResearchIdentityPage />} />
          <Route path="publications/create" element={<PublicationCreatePage />} />
          <Route path="publications" element={<PublicationsLibraryPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="publications/drafts" element={<PublicationsLibraryPage />} />
          <Route path="publications/published" element={<PublicationsLibraryPage />} />
          <Route path="publications/trash" element={<PublicationsLibraryPage />} />
          <Route path="publications/bookmarks" element={<PublicationsLibraryPage />} />
          <Route path="projects/create" element={<CreateProject />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="projects/:id/edit" element={<EditProject />} />
          <Route path="projects/:projectId/dashboard" element={<ProjectDashboard />} />
          <Route path="datasets/create" element={<ComingSoon title="Share Dataset Coming Soon" />} />
          <Route path="questions/create" element={<ComingSoon title="Ask Question Coming Soon" />} />
          <Route path="collaborations/create" element={<CreateWorkspace />} />
          <Route path="collaborations" element={<MyWorkspaces />} />
          <Route path="collaborations/:slug" element={<WorkspaceOverview />} />
          <Route path="patents/create" element={<ComingSoon title="Upload Patent Coming Soon" />} />
          <Route path="articles/create" element={<ComingSoon title="Write Article Coming Soon" />} />
          <Route path="events/create" element={<ComingSoon title="Create Event Coming Soon" />} />
          <Route path="publication/:slug/edit" element={<PublicationEditPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:conversationId" element={<MessagesPage />} />
          <Route path="messages/new" element={<MessagesPage />} />
          <Route path="search" element={<GlobalSearch />} />
          <Route path="help" element={<HelpCenterPage />} />
          {/* Social Collaboration Module Routes */}
          <Route path="network" element={<NetworkPage />} />
          <Route path="network/connections" element={<ConnectionsPage />} />
          <Route path="network/invitations" element={<InvitationsPage />} />
          <Route path="discover/researchers" element={<DiscoverResearchersPage />} />

          <Route path="settings" element={<ComingSoon title="System Settings Coming Soon" />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="admin" element={<ComingSoon title="Administration Panel Coming Soon" />} />
          <Route path="analytics" element={<ComingSoon title="System Analytics Coming Soon" />} />


          {/* Phase 8 — Activity Feed Routes */}
          <Route path="feed" element={<HomeFeedV2 />} />
          <Route path="trending" element={<TrendingFeed />} />
          <Route path="latest" element={<LatestFeed />} />
          <Route path="bookmarks" element={<BookmarksFeed />} />
          <Route path="discover" element={<DiscoverResearchersPage />} />
        </Route>

        {/* Profile Module Nested Routes (ProfileLayout handles sidebar) */}
        {profileRoutes}

        {/* Non-Profile Detail Routes (Uses normal AppLayout without sidebar) */}
        <Route element={<AppLayout />}>
          <Route path="/publication/:publicationSlug" element={<PublicationDetailPage />} />
          {/* SEO-friendly canonical route — Phase 3 Publication Reader */}
          <Route path="/publications/:slug" element={<PublicationReader />} />
          {/* Phase 7 — Publication Analytics */}
          <Route path="/publication/:slug/analytics" element={<PublicationAnalyticsPage />} />
          {/* Phase 5 — Global Search (also accessible without auth) */}
          <Route path="/search" element={<GlobalSearch />} />
        </Route>

        {/* 404 & Wildcard Fallback */}
        <Route path="/404" element={<ComingSoon title="Page Not Found (404)" />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default AppRoutes;