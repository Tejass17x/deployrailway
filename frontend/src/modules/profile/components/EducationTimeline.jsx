import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

const EducationTimeline = ({ education }) => {
  if (!education || education.length === 0) {
    return (
      <div className="text-center py-10 bg-[#F8FAFC]/50 border border-slate-200 rounded-2xl">
        <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No education details added yet</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 border-l-2 border-slate-200 space-y-8 py-2">
      {education.map((edu, idx) => (
        <motion.div
          key={edu._id || idx}
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
                  {edu.degree}
                </h4>
                <p className="text-xs text-[#475569] font-bold">
                  {edu.university}
                </p>
              </div>
              <span className="text-[10px] font-extrabold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-full border border-[#DBEAFE]">
                {edu.duration}
              </span>
            </div>

            {(edu.specialization || edu.cgpa) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                {edu.specialization && (
                  <p className="text-xs text-[#475569]">
                    <span className="font-bold">Specialization:</span> {edu.specialization}
                  </p>
                )}
                {edu.cgpa && (
                  <p className="text-xs text-[#475569]">
                    <span className="font-bold">CGPA/Grade:</span> {edu.cgpa}
                  </p>
                )}
              </div>
            )}

            {edu.description && (
              <p className="text-xs text-[#475569] leading-relaxed pt-2 border-t border-slate-100">
                {edu.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default EducationTimeline;
