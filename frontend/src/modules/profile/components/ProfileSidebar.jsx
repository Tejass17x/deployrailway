import React from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Home, User, Compass, FileText, Briefcase,
  Users, MessageSquare, Bookmark, UserCheck,
  UserPlus, Settings, Upload, ChevronLeft,
  ChevronRight, BarChart2, Globe, Database, X, HelpCircle
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    links: [
      { name: 'Home Feed', path: '/home', icon: Home, end: true },
      { name: 'Profile', path: '/profile/:slug', icon: User, end: true },
      { name: 'Research Identity', path: '/profile/:slug/research-identity', icon: Globe },
      {
        name: 'Publications',
        path: '/profile/:slug/publications',
        icon: FileText,
        // Publication flows live outside /profile/:slug/publications too
        // (create form, single-publication detail/edit pages) — keep the
        // tab highlighted while the user is anywhere in that flow.
        matchPrefixes: ['/profile/:slug/publications', '/publications', '/publication/']
      }
    ]
  },
  {
    label: 'Collaborate',
    links: [
      { name: 'Projects', path: '/projects', icon: Briefcase },
      {
        name: 'My Network',
        path: '/network',
        icon: Users,
        matchPrefixes: ['/network']
      },
      { name: 'Messages', path: '/messages', icon: MessageSquare }
    ]
  },
  {
    label: 'Community',
    links: [
      {
        name: 'Followers & Following',
        path: '/profile/:slug/followers',
        icon: UserCheck,
        matchPrefixes: ['/profile/:slug/followers', '/profile/:slug/following']
      },
      { name: 'Analytics', path: '/profile/:slug/analytics', icon: BarChart2 },
      { name: 'Settings', path: '/profile/:slug/settings', icon: Settings },
      { name: 'Help Center', path: '/help', icon: HelpCircle }
    ]
  }
];

const ProfileSidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams();
  const { user } = useSelector((state) => state.auth);

  const ownSlug = user?.slug || user?.profileSlug || user?.username || 'me';

  // Sidebar nav always points to the logged-in user's own pages,
  // never the profile currently being viewed.
  const profileSlug = ownSlug;

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    links: section.links.map((link) => ({
      ...link,
      path: link.path.replace(':slug', profileSlug),
      matchPrefixes: link.matchPrefixes?.map((p) => p.replace(':slug', profileSlug))
    }))
  }));

  // Manual active-state check (instead of relying on NavLink's own matcher)
  // so a link can stay highlighted across a whole flow — e.g. Publications
  // stays active on /publications/create and /publication/:slug too.
  const isLinkActive = (link) => {
    // /discover/researchers is shared: reached from Network's "View All"
    // AND from Home's "Top Researchers" link. Route alone can't tell them
    // apart, so Network only stays highlighted there when the navigation
    // itself was flagged as coming from Network (see NetworkPage's Link).
    if (link.path === '/network' && location.pathname === '/discover/researchers') {
      return location.state?.fromNetwork === true;
    }
    const prefixes = link.matchPrefixes || [link.path];
    return link.end
      ? prefixes.some((p) => location.pathname === p)
      : prefixes.some((p) => location.pathname.startsWith(p));
  };

  const handleUploadPublication = () => {
    setIsMobileOpen(false);
    navigate('/publications/create');
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`bg-white border-r border-slate-200 h-full fixed top-0 left-0 z-[60] flex flex-col transition-transform duration-300 ease-out md:sticky md:top-[65px] md:h-[calc(100vh-65px)] md:z-30 md:translate-x-0 overflow-visible shadow-2xl md:shadow-none
          ${isMobileOpen ? 'translate-x-0 w-[70vw] max-w-64' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-[88px]' : 'md:w-72'}
        `}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-8 bg-white border border-slate-200 rounded-full p-1.5 shadow-md hover:bg-slate-50 hover:border-blue-300 transition-colors text-slate-500 z-20 hidden md:flex items-center justify-center"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center justify-between px-5 h-12 md:hidden border-b border-slate-100 sticky top-0 bg-white z-10 shrink-0">
          <span className="font-bold text-sm text-slate-900">Menu</span>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-2.5 hidden md:block shrink-0" />

        <nav className="flex-1 px-3 pt-1.5 pb-1 overflow-y-auto">
          {sections.map((section, idx) => (
            <div key={section.label} className={idx > 0 ? 'mt-3 pt-3 border-t border-slate-100' : ''}>
              <p className={`px-3 mb-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 ${isCollapsed ? 'md:hidden' : ''}`}>
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const active = isLinkActive(link);
                  return (
                    <li key={link.name}>
                      <NavLink
                        to={link.path}
                        end={link.end}
                        onClick={() => setIsMobileOpen(false)}
                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14.5px] font-semibold transition-colors ${
                          active
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                        } ${isCollapsed ? 'md:justify-center' : ''}`}
                        title={isCollapsed ? link.name : ''}
                      >
                        <span
                          className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-blue-600 transition-all ${
                            active ? 'h-4.5 opacity-100' : 'h-0 opacity-0'
                          }`}
                        />
                        <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
                        <span className={isCollapsed ? 'md:hidden' : ''}>{link.name}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 bg-slate-50/60 shrink-0 p-2.5">
          <button
            onClick={handleUploadPublication}
            className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[14.5px] font-bold py-2.5 rounded-lg shadow-sm transition-all active:scale-[0.98] ${
              isCollapsed ? 'md:px-0' : 'px-4'
            }`}
            title="Upload Publication"
          >
            <Upload className="w-4 h-4 flex-shrink-0" />
            <span className={isCollapsed ? 'md:hidden' : ''}>Upload Publication</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default ProfileSidebar;