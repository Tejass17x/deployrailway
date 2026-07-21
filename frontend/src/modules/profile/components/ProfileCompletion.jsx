import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const ProfileCompletion = ({ profile, user }) => {
  const score = profile?.profileCompletion || 0;

  const has = (v) => !!(v && String(v).trim().length > 0);

  const checklist = [
    { label: 'Profile Photo', completed: has(profile?.profileImage) || has(user?.profileImage) },
    { label: 'Basic Info & Country', completed: has(user?.firstName) && has(user?.lastName) && has(profile?.country) },
    { label: 'Research Identity (ORCID/Scholar)', completed: has(profile?.socialLinks?.orcid) || has(profile?.socialLinks?.googleScholar) },
    { label: 'Education Details', completed: !!(profile?.education && profile?.education.length > 0) },
    { label: 'Experience Details', completed: !!(profile?.experience && profile?.experience.length > 0) },
    { label: 'Publications Portfolio', completed: !!(profile?.metrics?.publicationsCount > 0) },
    { label: 'Projects & Work', completed: !!(profile?.projects && profile?.projects.length > 0) },
    { label: 'Social Portfolios', completed: has(profile?.socialLinks?.linkedin) }
  ];

  // SVG parameters for circular progress
  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-5">
      {/* Circle display */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              className="stroke-bg-page"
              strokeWidth="5"
              fill="transparent"
            />
            {/* Active Circle */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              className="stroke-primary transition-all duration-500"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-xs font-black text-text-primary">
            {score}%
          </span>
        </div>

        <div>
          <h4 className="text-xs font-bold text-text-primary">Profile Completion</h4>
          <p className="text-[10px] text-text-secondary font-medium leading-relaxed">
            Fill details to reach 100% and boost your visibility in search recommendations.
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="pt-3 border-t border-border/50 space-y-2">
        {checklist.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-[11px] font-semibold">
            <span className={item.completed ? 'text-text-secondary' : 'text-text-primary'}>
              {item.label}
            </span>
            {item.completed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-green fill-accent-green/10 flex-shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-accent-red fill-accent-red/10 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileCompletion;