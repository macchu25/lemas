'use client';

import React from 'react';
import { ListOrdered } from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardContext';

export default function DashboardLogsPage() {
  const { analytics, t } = useDashboard();

  return (
    <div className="h-full w-full rounded-2xl border border-white/[0.08] overflow-y-auto bg-[#0a0c12] shadow-2xl p-3 sm:p-5 lg:p-6 relative">
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t.logsTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.logsSub}
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0e111a] space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-500">
                  <th className="pb-3 font-medium">Model</th>
                  <th className="pb-3 font-medium">{t.promptTokens}</th>
                  <th className="pb-3 font-medium">{t.completionTokens}</th>
                  <th className="pb-3 font-medium">{t.totalTokensUsed}</th>
                  <th className="pb-3 font-medium">{t.amountUSD}</th>
                  <th className="pb-3 font-medium">{t.latencyLabel}</th>
                  <th className="pb-3 font-medium">{t.statusSuccess}</th>
                  <th className="pb-3 font-medium">{t.timeLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {!analytics?.recent_requests || analytics.recent_requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                      {t.noChatYet}
                    </td>
                  </tr>
                ) : (
                  analytics.recent_requests.map((req) => (
                    <tr key={req.id}>
                      <td className="py-3.5 font-semibold text-white flex items-center gap-2">
                        <span className="size-2 rounded-full bg-cyan-400" />
                        <span>{req.model}</span>
                      </td>
                      <td className="py-3.5 text-slate-400 font-mono">
                        {req.prompt_tokens?.toLocaleString() || 0}
                      </td>
                      <td className="py-3.5 text-slate-400 font-mono">
                        {req.comp_tokens?.toLocaleString() || 0}
                      </td>
                      <td className="py-3.5 text-slate-300 font-mono font-bold">
                        {req.total_tokens.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-rose-400 font-semibold font-mono">
                        -${req.cost_usd.toFixed(6)}
                      </td>
                      <td className="py-3.5 text-slate-400 font-mono">
                        {req.latency_ms || 12}ms
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                        {req.timestamp || req.time_ago}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
