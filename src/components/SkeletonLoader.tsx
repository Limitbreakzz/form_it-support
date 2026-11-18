import React from 'react';

interface SkeletonLoaderProps {
  rows?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ rows = 5 }) => {
  return (
    <div
      className="w-full space-y-4 py-1 no-print"
      aria-busy="true"
      aria-live="polite"
      aria-label="กำลังโหลดข้อมูลจากระบบ Google Sheets"
    >
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="h-5 w-48 rounded-lg skeleton-shimmer" />
          <div className="h-5 w-28 rounded-lg skeleton-shimmer" />
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="px-6 py-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="h-5 rounded-md skeleton-shimmer sm:col-span-2" />
              <div className="h-5 rounded-md skeleton-shimmer sm:col-span-2" />
              <div className="h-5 rounded-md skeleton-shimmer sm:col-span-3" />
              <div className="h-5 rounded-md skeleton-shimmer sm:col-span-3" />
              <div className="h-7 rounded-lg skeleton-shimmer sm:col-span-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
