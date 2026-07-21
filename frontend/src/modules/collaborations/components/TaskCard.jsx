import React from 'react';

const PRIORITY_COLORS = {
  Critical: 'bg-red-500/20 text-red-400',
  High: 'bg-orange-500/20 text-orange-400',
  Medium: 'bg-yellow-500/20 text-yellow-400',
  Low: 'bg-gray-600/30 text-gray-400',
};

const STATUS_COLORS = {
  Todo: 'bg-gray-700 text-gray-300',
  'In Progress': 'bg-blue-500/20 text-blue-300',
  'In Review': 'bg-purple-500/20 text-purple-300',
  Done: 'bg-emerald-500/20 text-emerald-300',
  Blocked: 'bg-red-500/20 text-red-300',
};

export default function TaskCard({ task }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
          )}
          {task.dueDate && (
            <p className="text-xs text-gray-500 mt-2">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] || STATUS_COLORS['Todo']}`}>
            {task.status || 'Todo'}
          </span>
          {task.priority && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
