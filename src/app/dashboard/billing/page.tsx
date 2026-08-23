'use client';

import React, { useState } from 'react';
import {
  Wallet,
  LayoutDashboard,
  Zap,
} from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardContext';
import SepayPaymentBox from '@/components/dashboard/SepayPaymentBox';
import FinancialLedger from '@/components/dashboard/FinancialLedger';

export default function DashboardBillingPage() {
  const { user, t } = useDashboard();
  const [billingSubTab, setBillingSubTab] = useState<'overview' | 'topup'>('overview');

  return (
    <div className="h-full w-full rounded-2xl border border-white/[0.08] overflow-y-auto bg-[#0a0c12] shadow-2xl p-3 sm:p-5 lg:p-6 relative">
      <div className="space-y-6 w-full">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {t.billingTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {t.billingSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 self-start sm:self-auto">
              <Wallet className="size-4 text-emerald-400" />
              <span className="text-xs text-slate-400">{t.statBalance}:</span>
              <span className="text-base font-black text-emerald-300">
                ${(user?.balance || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Subtabs: [ 📋 Tổng quan ] [ ⚡ Nạp tiền ] */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0e111a] border border-white/[0.08] w-fit">
            <button
              onClick={() => setBillingSubTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingSubTab === 'overview'
                  ? 'bg-white/[0.08] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="size-3.5" />
              <span>{t.billingTabOverview}</span>
            </button>
            <button
              onClick={() => setBillingSubTab('topup')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingSubTab === 'topup'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="size-3.5" />
              <span>{t.billingTabTopup}</span>
            </button>
          </div>
        </div>

        {/* SUB-VIEW 1: SEPAY QR TOPUP */}
        {billingSubTab === 'topup' && (
          <SepayPaymentBox onSuccess={() => setBillingSubTab('overview')} />
        )}

        {/* SUB-VIEW 2: FINANCIAL OVERVIEW & TRANSACTION LEDGER */}
        {billingSubTab === 'overview' && (
          <FinancialLedger showTopupQuickButton={false} />
        )}
      </div>
    </div>
  );
}
