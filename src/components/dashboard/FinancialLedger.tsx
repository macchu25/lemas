'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  Zap,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { useDashboard } from './DashboardContext';

interface FinancialLedgerProps {
  showTopupQuickButton?: boolean;
}

export default function FinancialLedger({ showTopupQuickButton = true }: FinancialLedgerProps) {
  const { user, analytics, t } = useDashboard();

  return (
    <div className="space-y-6 w-full">
      {/* 4 Stat Metrics Cards (100% Real Database Ledger) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Số dư ví */}
        <div className="p-5 rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.08] to-[#0e111a] space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span className="font-semibold">{t.statBalance}</span>
            <Wallet className="size-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">${(user?.balance || 0).toFixed(2)}</div>
          {showTopupQuickButton && (
            <Link
              href="/dashboard/billing"
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>+ {t.topup} SePay</span>
              <ArrowRight className="size-3" />
            </Link>
          )}
        </div>

        {/* 2. Tổng nạp vào */}
        <div className="p-5 rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-cyan-500/[0.08] to-[#0e111a] space-y-2">
          <div className="flex items-center justify-between text-xs text-cyan-400">
            <span className="font-semibold">{t.totalDeposited}</span>
            <TrendingUp className="size-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ${(analytics?.total_deposited || 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">
            {analytics?.topup_history?.length || 0} giao dịch
          </p>
        </div>

        {/* 3. Tổng chi tiêu */}
        <div className="p-5 rounded-2xl border border-indigo-500/25 bg-gradient-to-b from-indigo-500/[0.08] to-[#0e111a] space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-400">
            <span className="font-semibold">{t.totalSpent}</span>
            <Zap className="size-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ${(analytics?.total_spend_30d || 0).toFixed(4)}
          </div>
          <p className="text-[11px] text-slate-500">
            {analytics?.total_requests_30d || 0} requests
          </p>
        </div>

        {/* 4. Tổng token đã dùng */}
        <div className="p-5 rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-500/[0.08] to-[#0e111a] space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span className="font-semibold">{t.totalTokensUsed}</span>
            <CreditCard className="size-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {(analytics?.total_tokens_30d || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">tokens</p>
        </div>
      </div>

      {/* 1. LỊCH SỬ NẠP TIỀN (Top-up History Table) */}
      <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0e111a] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">{t.topupHistory}</h3>
          </div>
          <Link
            href="/dashboard/billing"
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>+ {t.topup} SePay VietQR</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-500">
                <th className="pb-2.5 font-medium">{t.txId}</th>
                <th className="pb-2.5 font-medium">{t.depositMethod}</th>
                <th className="pb-2.5 font-medium">{t.amountUSD}</th>
                <th className="pb-2.5 font-medium">{t.amountVND}</th>
                <th className="pb-2.5 font-medium">Status</th>
                <th className="pb-2.5 font-medium">{t.timeLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!analytics?.topup_history || analytics.topup_history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                    {t.noTopupYet}
                  </td>
                </tr>
              ) : (
                analytics.topup_history.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3 font-mono font-semibold text-emerald-300">
                      {tx.id}
                    </td>
                    <td className="py-3 text-white flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-400" />
                      <span>{tx.method}</span>
                    </td>
                    <td className="py-3 text-emerald-400 font-bold font-mono">
                      +${tx.amount_usd.toFixed(2)}
                    </td>
                    <td className="py-3 text-slate-300 font-mono">
                      {tx.amount_vnd ? tx.amount_vnd.toLocaleString('vi-VN') + ' đ' : '—'}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                        {tx.status === 'completed' ? t.statusSuccess : tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">
                      {tx.created_at || tx.time_ago}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. LỊCH SỬ CHI TIÊU & NHẬT KÝ API (Spending History Table) */}
      <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0e111a] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">{t.spendingHistory}</h3>
          </div>
          <Link
            href="/dashboard/logs"
            className="text-xs text-cyan-400 hover:underline"
          >
            {t.requestLogs}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-500">
                <th className="pb-2.5 font-medium">Model</th>
                <th className="pb-2.5 font-medium">Tokens</th>
                <th className="pb-2.5 font-medium">Chi Phí (USD)</th>
                <th className="pb-2.5 font-medium">Status</th>
                <th className="pb-2.5 font-medium">{t.timeLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!analytics?.recent_requests || analytics.recent_requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                    {t.noChatYet}
                  </td>
                </tr>
              ) : (
                analytics.recent_requests.slice(0, 10).map((req) => (
                  <tr key={req.id}>
                    <td className="py-3 font-semibold text-white flex items-center gap-2">
                      <span className="size-2 rounded-full bg-cyan-400" />
                      <span>{req.model}</span>
                    </td>
                    <td className="py-3 text-slate-300 font-mono">
                      {req.total_tokens.toLocaleString()}
                    </td>
                    <td className="py-3 text-rose-400 font-semibold font-mono">
                      -${req.cost_usd.toFixed(6)}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 font-mono text-[11px]">
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
  );
}
