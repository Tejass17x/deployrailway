import React from 'react';
import { Briefcase, FolderGit, Users, Calendar } from 'lucide-react';

const ProjectCard = ({ project }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'proposed': return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-blue-600 bg-blue-50 border-blue-100'; // Ongoing
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/5 text-primary">
            <FolderGit className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              {project.title}
            </h4>
            <div className="flex items-center gap-1 text-[10px] text-text-secondary font-bold">
              <Calendar className="w-3 h-3" />
              <span>{project.duration || 'Flexible Timeline'}</span>
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full ${getStatusColor(project.status)}`}>
          {project.status || 'Ongoing'}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-text-secondary leading-relaxed font-medium">
          {project.description}
        </p>
      )}

      {/* Footer tags */}
      <div className="pt-3 border-t border-border/50 flex flex-col gap-2">
        {project.technology && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mr-1">Stack:</span>
            {project.technology.split(',').map((tech, i) => (
              <span key={i} className="text-[10px] bg-bg-page text-text-secondary border border-border px-2 py-0.5 rounded-md font-semibold">
                {tech.trim()}
              </span>
            ))}
          </div>
        )}

        {project.collaborators && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-semibold">
            <Users className="w-3.5 h-3.5 text-text-secondary/80" />
            <span className="text-[10px] text-text-secondary">
              <span className="font-bold text-text-primary">Collaborators:</span> {project.collaborators}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
