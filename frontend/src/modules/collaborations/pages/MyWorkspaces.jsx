import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import collaborationsService from '../services/collaborations.service';

export default function MyWorkspaces() {
  const { data: collaborations = [], isLoading } = useQuery({
    queryKey: ['my-collaborations'],
    queryFn: () => collaborationsService.getMyCollaborations(),
    select: (res) => res.data.data || [],
  });

  const getStageColor = (stage) => {
    const colors = {
      'Idea': 'bg-purple-500/20 text-purple-300',
      'Proposal': 'bg-blue-500/20 text-blue-300',
      'Ongoing': 'bg-cyan-500/20 text-cyan-300',
      'Completed': 'bg-emerald-500/20 text-emerald-300',
    };
    return colors[stage] || 'bg-gray-700 text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              My Workspaces
            </h1>
            <p className="text-gray-400 mt-1">Manage your collaborative research environments.</p>
          </div>
          <Link
            to="/collaborations/create"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-all"
          >
            + New Workspace
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 bg-gray-900 animate-pulse rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && collaborations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-4xl mb-4">
              🔬
            </div>
            <h2 className="text-xl font-semibold text-gray-300">No workspaces yet</h2>
            <p className="text-gray-500 mt-2 max-w-sm">
              Create a workspace to start collaborating with fellow researchers.
            </p>
            <Link
              to="/collaborations/create"
              className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition"
            >
              Create Workspace
            </Link>
          </div>
        )}

        {/* Workspace Grid */}
        {!isLoading && collaborations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {collaborations.map((collab) => {
              const ws = collab.workspace || collab;
              return (
                <Link
                  key={ws._id}
                  to={`/collaborations/${ws.slug}`}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 transition-all group"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                      {ws.name?.charAt(0) || 'W'}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStageColor(ws.researchStage)}`}>
                      {ws.researchStage || 'Ongoing'}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors line-clamp-2">
                    {ws.name}
                  </h3>
                  {ws.description && (
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{ws.description}</p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
                    {ws.institution && <span>🏛 {ws.institution}</span>}
                    {ws.researchArea && <span>📌 {ws.researchArea}</span>}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                    <span className="text-xs text-gray-500">
                      {collab.myRole && `Your role: ${collab.myRole}`}
                    </span>
                    <span className="text-xs text-violet-400 group-hover:text-violet-300">Open →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
