import React from "react";
import { X, Calendar, Users, User, Tag } from "lucide-react";

export default function ProjectDetailsDrawer({
  open,
  project,
  onClose,
}) {
  if (!open || !project) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-slide-in">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Project Details
            </h2>
            <p className="text-sm text-slate-500">
              Research Project Information
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">

          <div>
            <h3 className="text-2xl font-bold text-slate-800">
              {project.title}
            </h3>

            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                project.status === "Completed"
                  ? "bg-emerald-100 text-emerald-700"
                  : project.status === "Archived"
                  ? "bg-gray-200 text-gray-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {project.status}
            </span>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-slate-700">
              Description
            </h4>

            <p className="text-sm leading-6 text-slate-600">
              {project.description}
            </p>
          </div>

          <div className="space-y-4">

            {project.pi && (
              <div className="flex items-center gap-3">
                <User className="text-blue-600" size={18} />
                <div>
                  <p className="text-xs text-slate-500">
                    Principal Investigator
                  </p>
                  <p className="font-medium">
                    {project.pi}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Users className="text-blue-600" size={18} />
              <div>
                <p className="text-xs text-slate-500">
                  Members
                </p>
                <p className="font-medium">
                  {project.members ??
                    project.collaborators}
                </p>
              </div>
            </div>

            {project.deadline && (
              <div className="flex items-center gap-3">
                <Calendar className="text-blue-600" size={18} />
                <div>
                  <p className="text-xs text-slate-500">
                    Deadline
                  </p>
                  <p className="font-medium">
                    {project.deadline}
                  </p>
                </div>
              </div>
            )}

          </div>

          {project.tags && (
            <div>
              <h4 className="mb-3 font-semibold text-slate-700">
                Tags
              </h4>

              <div className="flex flex-wrap gap-2">

                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm"
                  >
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}

              </div>
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-4">

            <div className="flex justify-between text-sm">
              <span>Visibility</span>
              <span>
                {project.visibility || "Public"}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-sm">
              <span>Applications</span>
              <span>
                {project.applications ?? 0}
              </span>
            </div>

            {project.progress !== undefined && (
              <>
                <div className="mt-4 mb-2 flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>

                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{
                      width: `${project.progress}%`,
                    }}
                  />
                </div>
              </>
            )}

          </div>

          <button className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
            Apply to Collaborate
          </button>

        </div>
      </div>
    </>
  );
}