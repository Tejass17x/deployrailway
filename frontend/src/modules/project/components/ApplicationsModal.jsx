import React from "react";
import { X, CheckCircle2 } from "lucide-react";
import UserAvatar from '../../../components/ui/Avatar';

// Owner-facing view: everyone who has applied to collaborate on a project,
// with the ability to accept or decline each request.
export default function ApplicationsModal({ project, applications, onClose, onAccept, onDecline }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Collaboration Applications</h3>
            <p className="mt-0.5 text-sm text-slate-500">{project.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {applications.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No applications yet.</p>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {applications.map((app, i) => (
              <div key={app.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={app.applicantPhoto || app.applicantAvatar || app.applicantImage || app.avatar}
                      name={app.applicantName}
                      size="sm"
                      showBorder
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{app.applicantName}</p>
                      <p className="text-xs text-slate-400">{app.appliedAt}</p>
                    </div>
                  </div>
                  {app.status === "accepted" && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 size={11} /> Accepted
                    </span>
                  )}
                  {app.status === "declined" && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      Declined
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-snug text-slate-600">{app.message}</p>
                {app.status === "pending" && (
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => onDecline(app.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => onAccept(app.id)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Accept
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}