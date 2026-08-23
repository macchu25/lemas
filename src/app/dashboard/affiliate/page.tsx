'use client';

import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardContext';

export default function DashboardAffiliatePage() {
  const { user, t } = useDashboard();
  const [copied, setCopied] = useState(false);

  const refUrl = `https://lemas.ai/register?ref=${user?.id || 'lemas_dev'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(refUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full w-full rounded-2xl border border-white/[0.08] overflow-y-auto bg-[#0a0c12] shadow-2xl p-3 sm:p-5 lg:p-6 relative">
      <div className="space-y-6 w-full">
        <div className="p-8 rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-[#0a1210] via-[#0e1714] to-[#0a1210] space-y-6 w-full">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
              {t.affiliate}
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              {t.affiliateTitle}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.affiliateDesc}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0c0f17] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500">{t.referralLink}:</span>
              <div className="font-mono text-xs text-emerald-300">
                {refUrl}
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-all shrink-0"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              <span>{copied ? t.copiedLink : t.copyLink}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.08]">
            <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
              <span className="text-xs text-slate-400">{t.totalReferred}</span>
              <div className="text-xl font-bold text-white mt-1">0 {t.developersUnit}</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
              <span className="text-xs text-slate-400">{t.commissionRate}</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{t.lifetimeCommission}</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
              <span className="text-xs text-slate-400">{t.pendingPayout}</span>
              <div className="text-xl font-bold text-white mt-1">$0.00 USD</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
