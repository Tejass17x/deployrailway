import React from 'react';
import { Award } from 'lucide-react';

const SkillsList = ({ skills }) => {
  if (!skills || skills.length === 0) {
    return (
      <div className="text-center py-8 bg-white border border-border rounded-2xl">
        <Award className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" />
        <p className="text-sm font-semibold text-text-secondary">No skills listed yet</p>
      </div>
    );
  }

  // Group skills by category
  const categories = ['Programming', 'AI', 'ML', 'Cloud', 'Research', 'Writing', 'Statistics', 'Other'];
  
  const groupedSkills = categories.reduce((acc, cat) => {
    const list = skills.filter(s => s.category?.toLowerCase() === cat.toLowerCase());
    if (list.length > 0) acc[cat] = list;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {Object.entries(groupedSkills).map(([cat, list]) => (
        <div key={cat} className="space-y-2">
          <h5 className="text-[11px] font-bold text-primary uppercase tracking-wider">
            {cat}
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {list.map((skill, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold bg-bg-page border border-border px-3 py-1 rounded-xl text-text-primary hover:border-primary/30 transition-colors"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkillsList;
