import React from 'react';
import { Card } from './ui/DesignSystem';

/**
 * Structure-Matched Skeleton Shimmer สำหรับหน้าแดชบอร์ด
 * ออกแบบตามแนวทางของ Skill: accessible-forms-and-print และ thai-ui-design-system
 * มีโครงสร้างตรงกับหน้า DashboardHome 1:1 เพื่อป้องกัน Cumulative Layout Shift (CLS)
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div
      className="space-y-8 animate-fadeIn"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="กำลังโหลดข้อมูลแดชบอร์ด..."
    >
      {/* ส่วนหัวแดชบอร์ด Skeleton */}
      <Card className="overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3.5 w-full">
            <div className="h-8 sm:h-9 w-3/4 max-w-lg rounded-xl skeleton-shimmer" />
            <div className="space-y-2">
              <div className="h-4 w-full max-w-2xl rounded-md skeleton-shimmer" />
              <div className="h-4 w-4/5 max-w-xl rounded-md skeleton-shimmer" />
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="h-6 w-56 rounded-lg skeleton-shimmer" />
              <div className="h-6 w-36 rounded-lg skeleton-shimmer" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="h-11 w-44 rounded-xl skeleton-shimmer" />
            <div className="h-11 w-48 rounded-xl skeleton-shimmer" />
          </div>
        </div>

        {/* 4 หมวดหมู่ Ledger Strip Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="h-3.5 w-28 rounded-md skeleton-shimmer" />
                <div className="h-4 w-4 rounded-md skeleton-shimmer shrink-0" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="h-8 w-12 rounded-lg skeleton-shimmer" />
                <div className="h-3.5 w-16 rounded-md skeleton-shimmer" />
              </div>
              <div className="h-3 w-32 rounded-md skeleton-shimmer" />
            </div>
          ))}
        </div>
      </Card>

      {/* 2 การ์ดหลักด้านล่าง Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-5 w-48 rounded-md skeleton-shimmer" />
              <div className="h-3.5 w-32 rounded-md skeleton-shimmer" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full rounded-md skeleton-shimmer" />
            <div className="h-4 w-5/6 rounded-md skeleton-shimmer" />
          </div>
          <div className="h-10 w-36 rounded-xl skeleton-shimmer mt-4" />
        </Card>

        <Card className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-5 w-56 rounded-md skeleton-shimmer" />
              <div className="h-3.5 w-40 rounded-md skeleton-shimmer" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full rounded-md skeleton-shimmer" />
            <div className="h-4 w-5/6 rounded-md skeleton-shimmer" />
          </div>
          <div className="h-10 w-44 rounded-xl skeleton-shimmer mt-4" />
        </Card>
      </div>
    </div>
  );
};
