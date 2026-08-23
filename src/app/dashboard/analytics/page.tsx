'use client';

import React from 'react';
import {
  TrendingUp,
} from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardContext';

export default function DashboardAnalyticsPage() {
  const { analytics, t } = useDashboard();

  return (
    <div className="h-full w-full rounded-2xl border border-white/[0.08] overflow-y-auto bg-[#0a0c12] shadow-2xl p-3 sm:p-5 lg:p-6 relative">
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t.analyticsMetrics}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.analyticsSub}
          </p>
        </div>

        {/* 15-Day Spending Trend Chart */}
        <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0e111a] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-400" />
              <span>{t.chartTitle}</span>
            </h3>
            <span className="text-xs text-cyan-400 font-mono">
              {analytics?.total_requests_30d || 0} {t.totalRequestsLabel}
            </span>
          </div>

          <div className="h-48 rounded-xl border border-white/5 bg-[#0a0c12] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t.edgeDistributed}</span>
              <span className="text-emerald-400 font-mono">
                ${(analytics?.total_spend_30d || 0).toFixed(4)} {t.totalSpent}
              </span>
            </div>

            <div className="flex items-end justify-between gap-2 h-32 pt-4">
              {(analytics?.daily_chart || Array.from({ length: 15 }, (_, i) => ({ date: `${i+1}`, height: 10, cost: 0, requests: 0 }))).map((pt, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  <div
                    title={`${pt.date}: $${pt.cost.toFixed(4)} (${pt.requests} reqs)`}
                    style={{ height: `${pt.height}%` }}
                    className="w-full rounded-t bg-gradient-to-t from-indigo-600 via-cyan-500 to-emerald-400 opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">{pt.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.08] text-center">
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
              <span className="text-xs text-slate-400">{t.peakDaily}</span>
              <div className="text-lg font-bold text-white mt-1">
                ${(analytics?.max_daily_spend_30d || 0).toFixed(4)}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
              <span className="text-xs text-slate-400">{t.statAvgSpend}</span>
              <div className="text-lg font-bold text-white mt-1">
                ${(analytics?.avg_daily_spend_7d || 0).toFixed(4)}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
              <span className="text-xs text-slate-400">{t.totalTokensProcessed}</span>
              <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                {(analytics?.total_tokens_30d || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
