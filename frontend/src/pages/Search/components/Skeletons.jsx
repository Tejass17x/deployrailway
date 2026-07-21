import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp } from './animations';

const shimmerStyle = {
  background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
  backgroundSize: '200% 100%',
};

export const ShimmerBlock = ({ className = '' }) => (
  <div
    className={`rounded-lg ${className}`}
    style={{ ...shimmerStyle, animation: 'gs-skeleton-wave 1.5s linear infinite' }}
  />
);

export const ResultCardSkeleton = ({ index = 0 }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={fadeUp(reduce, index * 0.06)}
      initial="hidden"
      animate="show"
      className="bg-white border border-[#E2E8F0] rounded-2xl p-6"
    >
      <div className="flex gap-2">
        <ShimmerBlock className="h-5 w-20" />
        <ShimmerBlock className="h-5 w-16" />
      </div>
      <ShimmerBlock className="h-6 w-3/4 mt-3" />
      <div className="space-y-2 mt-2">
        <ShimmerBlock className="h-4 w-full" />
        <ShimmerBlock className="h-4 w-5/6" />
        <ShimmerBlock className="h-4 w-4/5" />
      </div>
      <div className="flex gap-2 mt-4">
        <ShimmerBlock className="h-4 w-16" />
        <ShimmerBlock className="h-4 w-16" />
        <ShimmerBlock className="h-4 w-16" />
      </div>
    </motion.div>
  );
};

export const ResultsSkeletonList = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <ResultCardSkeleton key={i} index={i} />
    ))}
  </div>
);

export const FilterSidebarSkeleton = () => (
  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-5">
    <ShimmerBlock className="h-4 w-24" />
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <ShimmerBlock className="h-3 w-20" />
        <ShimmerBlock className="h-9 w-full" />
      </div>
    ))}
  </div>
);

export const InsightsPanelSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
        <ShimmerBlock className="h-3 w-28" />
        <ShimmerBlock className="h-4 w-full" />
        <ShimmerBlock className="h-4 w-5/6" />
        <ShimmerBlock className="h-4 w-2/3" />
      </div>
    ))}
  </div>
);

export const SKELETON_KEYFRAMES = `
@keyframes gs-skeleton-wave { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
`;
