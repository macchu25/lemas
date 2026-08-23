'use client';

import React from 'react';
import Link from 'next/link';
import {
  Send,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardContext';
import FinancialLedger from '@/components/dashboard/FinancialLedger';

export default function DashboardOverviewPage() {
  const { user, analytics, t } = useDashboard();

  return (
    <div className="h-full w-full rounded-2xl border border-white/[0.08] overflow-y-auto bg-[#0a0c12] shadow-2xl p-3 sm:p-5 lg:p-6 relative">
      <div className="space-y-6 w-full">
        {/* Header Greeting Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              {t.greeting}, {user?.name || user?.email} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {t.overviewSubtitle}
            </p>
          </div>

          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-xs font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors self-start sm:self-auto"
          >
            <ExternalLink className="size-3.5" />
            <span>{t.docsBtn}</span>
          </Link>
        </div>

        {/* Telegram Bonus Banner */}
        <div className="p-4 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/15 via-[#0b1820] to-[#0c101a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-cyan-400 shrink-0">
              <Send className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t.telegramBannerTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.telegramBannerSub}
              </p>
            </div>
          </div>

          <a
            href="https://t.me/lemasai"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-xs font-bold hover:opacity-90 transition-all shrink-0 self-start sm:self-auto shadow-lg shadow-emerald-950/40"
          >
            <span>{t.verifyBtn}</span>
            <ArrowRight className="size-3.5" />
          </a>
        </div>

        {/* Lemas.AI Enterprise Mesh Status */}
        <div className="p-3.5 rounded-2xl border border-cyan-500/25 bg-cyan-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-cyan-300">
            <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold">{t.routerStatusTitle}</span>
            <span className="text-slate-300">
              {t.routerStatusSub}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
              Sub-12ms Edge
            </span>
            <span className="text-slate-400 text-[11px]">99.99% SLA</span>
          </div>
        </div>

        {/* 4 Metrics & Real Financial Ledger from MongoDB */}
        <FinancialLedger />

        {/* Spending Trend Chart Box & Pro Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pro Upgrade Card */}
          <div className="p-6 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-[#0b141d] to-[#0a0f18] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-base">
                <Sparkles className="size-5 text-cyan-400" />
                <span>{t.proCardTitle}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.proCardSub}
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>60+ frontier models (Claude 3.7, DeepSeek R1, GPT-4o)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-cyan-400 shrink-0" />
                  <span>Smart routing & sub-15ms edge</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-indigo-400 shrink-0" />
                  <span>Automatic failover</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">$5</span>
                <span className="text-xs text-slate-400">/mo</span>
              </div>
              <Link
                href="/dashboard/billing"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-xs font-bold transition-all shadow-md shadow-emerald-950/40"
              >
                {t.viewPlans}
              </Link>
            </div>
          </div>

          {/* 30-Day Spending Chart Box */}
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0e111a] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{t.chartTitle}</h3>
              <Link
                href="/dashboard/analytics"
                className="text-xs text-cyan-400 hover:underline"
              >
                {t.analytics}
              </Link>
            </div>

            {/* Dynamic Line/Bar Graphic */}
            <div className="h-28 rounded-xl border border-white/5 bg-[#0a0c12] p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{t.edgeTrafficLabel}</span>
                <span className="text-cyan-400 font-mono">
                  {analytics?.total_requests_30d || 0} {t.reqsLabel}
                </span>
              </div>
              <div className="flex items-end justify-between gap-1.5 h-14">
                {(analytics?.daily_chart || Array.from({ length: 15 }, (_, i) => ({ date: `${i+1}`, height: 10, cost: 0, requests: 0 }))).map((pt, idx) => (
                  <div
                    key={idx}
                    title={`${pt.date}: $${pt.cost.toFixed(4)} (${pt.requests} reqs)`}
                    style={{ height: `${pt.height}%` }}
                    className="flex-1 rounded-t bg-gradient-to-t from-indigo-600 via-cyan-500 to-emerald-400 opacity-75 hover:opacity-100 transition-all cursor-pointer"
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.08] text-center">
              <div>
                <div className="text-[10px] text-slate-500">{t.peakLabel}</div>
                <div className="text-xs font-bold text-white">
                  ${(analytics?.max_daily_spend_30d || 0).toFixed(4)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">{t.statAvgSpend}</div>
                <div className="text-xs font-bold text-white">
                  ${(analytics?.avg_daily_spend_7d || 0).toFixed(4)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">{t.activeDaysLabel}</div>
                <div className="text-xs font-bold text-emerald-400">
                  {analytics?.days_used_30d || 0}/30
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
