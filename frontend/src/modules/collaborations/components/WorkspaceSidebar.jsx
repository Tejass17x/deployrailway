import React from 'react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'members', label: 'Members', icon: '👥' },
  { id: 'tasks', label: 'Tasks', icon: '✅' },
  { id: 'files', label: 'Files', icon: '📁' },
  { id: 'meetings', label: 'Meetings', icon: '📅' },
  { id: 'activity', label: 'Activity', icon: '⚡' },
  { id: 'messages', label: 'Messages', icon: '💬' },
];

const ROLE_BADGES = {
  Owner: 'bg-yellow-500/20 text-yellow-300',
  PI: 'bg-purple-500/20 text-purple-300',
  Collaborator: 'bg-blue-500/20 text-blue-300',
  Viewer: 'bg-gray-500/20 text-gray-300',
};

export default function WorkspaceSidebar({ workspace, myRole, activeTab, setActiveTab }) {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-950 p-4 flex flex-col">
      {/* Workspace Avatar */}
      <div className="flex items-center gap-3 mb-6 px-2 pt-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {workspace?.name?.charAt(0) || 'W'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{workspace?.name}</p>
          {myRole && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${ROLE_BADGES[myRole] || 'bg-gray-700 text-gray-300'}`}>
              {myRole}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
              activeTab === tab.id
                ? 'bg-violet-600/20 text-violet-300 border border-violet-600/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 pt-4 mt-4">
        {workspace?.institution && (
          <p className="text-xs text-gray-600 truncate">🏛 {workspace.institution}</p>
        )}
        {workspace?.expectedDuration && (
          <p className="text-xs text-gray-600 mt-1">⏱ {workspace.expectedDuration}</p>
        )}
      </div>
    </aside>
  );
}
