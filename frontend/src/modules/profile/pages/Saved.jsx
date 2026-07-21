import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ComingSoon from '../../../components/common/ComingSoon';

const Saved = () => {
  const { profile } = useOutletContext();
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
      <ComingSoon title={`${profile?.displayName || 'Researcher'}'s Saved Items Coming Soon`} />
    </div>
  );
};

export default Saved;
