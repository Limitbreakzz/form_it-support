import React from 'react';

interface SkeletonLoaderProps {
  rows?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ rows = 4 }) => {
  return (
    <div
      className="w-full space-y-4 py-2 no-print"
      aria-busy="true"
      aria-live="polite"
      aria-label="กำลังโหลดข้อมูลจากระบบ Google Sheets"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-24 rounded-2xl skeleton-shimmer border border-slate-200/50 dark:border-slate-800/50" />
        <div className="h-24 rounded-2xl skeleton-shimmer border border-slate-200/50 dark:border-slate-800/50" />
        <div className="h-24 rounded-2xl skeleton-shimmer border border-slate-200/50 dark:border-slate-800/50" />
      </div>
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 rounded-lg skeleton-shimmer" />
          <div className="h-7 w-28 rounded-lg skeleton-shimmer" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-6 gap-3 items-center">
              <div className="h-6 rounded-md skeleton-shimmer col-span-1" />
              <div className="h-6 rounded-md skeleton-shimmer col-span-2" />
              <div className="h-6 rounded-md skeleton-shimmer col-span-2" />
              <div className="h-6 rounded-md skeleton-shimmer col-span-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
