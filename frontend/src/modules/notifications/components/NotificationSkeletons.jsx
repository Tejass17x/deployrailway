import React from 'react';
import { motion } from 'framer-motion';

// ── Base shimmer pulse ─────────────────────────────────────────────────────────
export const SkeletonPulse = ({ className = '' }) => (
  <div
    className={`rounded-lg ${className}`}
    style={{
      background: 'linear-gradient(90deg, #F1F5F9 25%, #E8EDF3 50%, #F1F5F9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmerSweep 1.6s infinite linear',
    }}
  />
);

// ── Stat card skeleton ─────────────────────────────────────────────────────────
export const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 overflow-hidden">
    <div className="flex justify-between items-start mb-4">
      <SkeletonPulse className="w-10 h-10 rounded-xl" />
      <SkeletonPulse className="w-12 h-5 rounded-full" />
    </div>
    <SkeletonPulse className="h-8 w-20 mb-2" />
    <SkeletonPulse className="h-3 w-28 mb-1" />
    <SkeletonPulse className="h-2 w-full mt-3 rounded-full" />
  </div>
);

// ── Notification card skeleton ─────────────────────────────────────────────────
export const NotificationCardSkeleton = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay }}
    className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex gap-4"
  >
    <SkeletonPulse className="w-12 h-12 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2.5 py-1">
      <div className="flex justify-between gap-3">
        <SkeletonPulse className="h-3.5 w-2/3" />
        <SkeletonPulse className="h-3 w-14 flex-shrink-0" />
      </div>
      <SkeletonPulse className="h-3 w-full" />
      <SkeletonPulse className="h-3 w-5/6" />
      <div className="flex gap-3 pt-1">
        <SkeletonPulse className="h-6 w-24 rounded-full" />
        <SkeletonPulse className="h-6 w-16 rounded-full" />
        <SkeletonPulse className="h-6 w-20 rounded-full" />
      </div>
    </div>
  </motion.div>
);

// ── Category bar skeleton ──────────────────────────────────────────────────────
export const CategoryBarSkeleton = () => (
  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-2">
    <SkeletonPulse className="h-3 w-24 mb-5" />
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-2 py-2.5">
        <SkeletonPulse className="w-7 h-7 rounded-lg flex-shrink-0" />
        <SkeletonPulse className="h-3 flex-1" />
        <SkeletonPulse className="h-5 w-7 rounded-full flex-shrink-0" />
      </div>
    ))}
  </div>
);

// ── Right sidebar skeleton ─────────────────────────────────────────────────────
export const SidebarSkeleton = () => (
  <div className="space-y-4">
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
      <SkeletonPulse className="h-3 w-28 mb-4" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <SkeletonPulse className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <SkeletonPulse className="h-3 w-3/4 mb-1.5" />
            <SkeletonPulse className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
      <SkeletonPulse className="h-3 w-36 mb-4" />
      <SkeletonPulse className="h-24 w-full rounded-xl" />
    </div>
  </div>
);

// ── Hero skeleton ──────────────────────────────────────────────────────────────
export const HeroSkeleton = () => (
  <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
    <div className="space-y-3">
      <SkeletonPulse className="h-6 w-40 rounded-full" />
      <SkeletonPulse className="h-10 w-64" />
      <SkeletonPulse className="h-4 w-96 max-w-full" />
    </div>
    <div className="flex gap-2 items-start">
      <SkeletonPulse className="h-10 w-36 rounded-xl" />
      <SkeletonPulse className="h-10 w-10 rounded-xl" />
      <SkeletonPulse className="h-10 w-10 rounded-xl" />
    </div>
  </div>
);
