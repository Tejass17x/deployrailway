import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';

const ExperienceTimeline = ({ experience }) => {
  if (!experience || experience.length === 0) {
    return (
      <div className="text-center py-10 bg-[#F8FAFC]/50 border border-slate-200 rounded-2xl">
        <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No experience details added yet</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 border-l-2 border-slate-200 space-y-8 py-2">
      {experience.map((exp, idx) => (
        <motion.div
          key={exp._id || idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.1 }}
          className="relative"
        >
          {/* Circular Indicator */}
          <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-white bg-[#2563EB] shadow-sm" />

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-extrabold text-[#0F172A]">
                  {exp.designation}
                </h4>
                <p className="text-xs text-[#475569] font-bold">
                  {exp.institution}
                </p>
              </div>
              <span className="text-[10px] font-extrabold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-full border border-[#DBEAFE]">
                {exp.duration}
              </span>
            </div>

            {exp.researchFocus && (
              <p className="text-xs text-[#475569] pt-1">
                <span className="font-bold text-[#2563EB]/80">Research Focus:</span> {exp.researchFocus}
              </p>
            )}

            {exp.description && (
              <p className="text-xs text-[#475569] leading-relaxed pt-2 border-t border-slate-100">
                {exp.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ExperienceTimeline;
