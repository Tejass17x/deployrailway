import React from 'react';

export default function ActivityTimeline({ activities = [] }) {
  if (!activities.length) {
    return (
      <div className="text-center py-12 text-gray-500">No recent activity.</div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, idx) => (
        <div key={activity._id || idx} className="relative flex gap-4 pl-4">
          {/* Line */}
          {idx < activities.length - 1 && (
            <div className="absolute left-[1.1rem] top-8 bottom-0 w-px bg-gray-800" />
          )}
          {/* Dot */}
          <div className="mt-1 w-4 h-4 rounded-full bg-violet-600 border-2 border-gray-950 flex-shrink-0 z-10" />
          {/* Content */}
          <div className="pb-4 min-w-0">
            <p className="text-sm text-gray-200">{activity.details}</p>
            <p className="text-xs text-gray-500 mt-1">
              {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
