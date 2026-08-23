import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="h-full w-full rounded-2xl border border-white/[0.08] bg-[#0a0c12] p-4 sm:p-6 space-y-6 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-white/[0.06] rounded-xl" />
          <div className="h-4 w-72 bg-white/[0.04] rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-white/[0.05] rounded-xl" />
          <div className="h-9 w-32 bg-white/[0.05] rounded-xl" />
        </div>
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-white/[0.05] rounded" />
              <div className="size-6 bg-white/[0.05] rounded-lg" />
            </div>
            <div className="h-7 w-28 bg-white/[0.07] rounded-lg" />
            <div className="h-3 w-36 bg-white/[0.04] rounded" />
          </div>
        ))}
      </div>

      {/* Main Body Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-3xl border border-white/[0.06] bg-white/[0.02] space-y-4">
          <div className="h-5 w-40 bg-white/[0.06] rounded-lg" />
          <div className="h-48 bg-white/[0.03] rounded-2xl" />
        </div>
        <div className="lg:col-span-4 p-6 rounded-3xl border border-white/[0.06] bg-white/[0.02] space-y-4">
          <div className="h-5 w-32 bg-white/[0.06] rounded-lg" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/[0.03] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
