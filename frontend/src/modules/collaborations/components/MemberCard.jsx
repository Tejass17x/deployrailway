import React from 'react';
import Avatar from '../../../components/ui/Avatar';

const ROLE_COLORS = {
  Owner: 'bg-yellow-500/20 text-yellow-300',
  PI: 'bg-purple-500/20 text-purple-300',
  'Co-PI': 'bg-blue-500/20 text-blue-300',
  RA: 'bg-cyan-500/20 text-cyan-300',
  Collaborator: 'bg-emerald-500/20 text-emerald-300',
  Student: 'bg-orange-500/20 text-orange-300',
  Viewer: 'bg-gray-500/20 text-gray-400',
};

export default function MemberCard({ member, role }) {
  if (!member) return null;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-700 transition-colors">
      {/* Avatar */}
      <Avatar
        src={member.avatar}
        name={`${member.firstName} ${member.lastName}`}
        size="md"
        showBorder
      />
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {member.firstName} {member.lastName}
        </p>
        {member.headline && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{member.headline}</p>
        )}
      </div>
      {/* Role Badge */}
      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${ROLE_COLORS[role] || 'bg-gray-700 text-gray-400'}`}>
        {role}
      </span>
    </div>
  );
}
