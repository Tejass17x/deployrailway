import React from 'react';
import { Route } from 'react-router-dom';

const ProfileLayout = React.lazy(() => import('../layouts/ProfileLayout'));
const ProfileOverview = React.lazy(() => import('../pages/ProfileOverview'));
const Publications = React.lazy(() => import('../pages/Publications'));
const Projects = React.lazy(() => import('../pages/Projects'));
const Analytics = React.lazy(() => import('../pages/Analytics'));
const Settings = React.lazy(() => import('../pages/Settings'));
const Followers = React.lazy(() => import('../pages/Followers'));
const Following = React.lazy(() => import('../pages/Following'));
const Connections = React.lazy(() => import('../pages/Connections'));
const Datasets = React.lazy(() => import('../pages/Datasets'));
const Bookmarks = React.lazy(() => import('../pages/Bookmarks'));
const Saved = React.lazy(() => import('../pages/Saved'));
const Messages = React.lazy(() => import('../pages/Messages'));
const ResearchIdentityPage = React.lazy(() => import('../pages/ResearchIdentityPage'));
const Explore = React.lazy(() => import('../pages/Explore'));

const profileRoutes = (
  <Route path="/profile/:username" element={<ProfileLayout />}>
    <Route index element={<ProfileOverview />} />
    <Route path="about" element={<ProfileOverview />} />
    <Route path="research-identity" element={<ResearchIdentityPage />} />
    <Route path="publications" element={<Publications />} />
    <Route path="projects" element={<Projects />} />
    <Route path="datasets" element={<Datasets />} />
    <Route path="followers" element={<Followers />} />
    <Route path="following" element={<Following />} />
    <Route path="connections" element={<Connections />} />
    <Route path="analytics" element={<Analytics />} />
    <Route path="settings" element={<Settings />} />
    <Route path="messages" element={<Messages />} />
    <Route path="bookmarks" element={<Bookmarks />} />
    <Route path="saved" element={<Saved />} />
    <Route path="explore" element={<Explore />} />
  </Route>
);

export default profileRoutes;
