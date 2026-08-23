'use client';

import React, { useState } from 'react';
import {
  Wallet,
  LayoutDashboard,
  Zap,
  Gift,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardContext';
import { redeemGiftcode } from '@/lib/api';
import SepayPaymentBox from '@/components/dashboard/SepayPaymentBox';
import FinancialLedger from '@/components/dashboard/FinancialLedger';

export default function DashboardBillingPage() {
  const { user, refreshData, t } = useDashboard();
  const [billingSubTab, setBillingSubTab] = useState<'overview' | 'topup'>('overview');
  const [giftCode, setGiftCode] = useState('');
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [giftError, setGiftError] = useState('');

  const handleRedeemGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCode.trim()) return;
    setGiftLoading(true);
    setGiftMessage('');
    setGiftError('');

    const res = await redeemGiftcode(giftCode.trim());
    if (res.success) {
      setGiftMessage(res.message || 'Nhận Giftcode thành công!');
      setGiftCode('');
      refreshData();
    } else {
      setGiftError(res.error || 'Mã Giftcode không hợp lệ hoặc đã hết lượt!');
    }
    setGiftLoading(false);
  };

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

            <div className="flex items-center gap-3">
              {/* Gift Tokens Balance */}
              {Boolean(user?.gift_tokens && user.gift_tokens > 0) && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-500/10 border border-purple-500/25">
                  <Gift className="size-4 text-purple-400" />
                  <span className="text-xs text-slate-400">Token Quà Tặng:</span>
                  <span className="text-base font-black text-purple-300">
                    +{(user?.gift_tokens || 0).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 self-start sm:self-auto">
                <Wallet className="size-4 text-emerald-400" />
                <span className="text-xs text-slate-400">{t.statBalance}:</span>
                <span className="text-base font-black text-emerald-300">
                  ${(user?.balance || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Giftcode Redemption Box */}
          <div className="p-4 sm:p-5 rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-500/10 via-[#0d0f18] to-[#090b12] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <Sparkles className="size-4 text-purple-400" />
                <span>Nhập Giftcode Nhận Token Vĩnh Viễn</span>
              </div>
              <p className="text-xs text-slate-400">
                Token từ Giftcode là lượng Token riêng biệt, <strong className="text-white">không bị reset theo ngày</strong> và dùng mãi mãi khi hết hạn ngạch 1,000 tokens/ngày.
              </p>
            </div>

            <form onSubmit={handleRedeemGift} className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <input
                type="text"
                required
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value)}
                placeholder="Nhập mã GIFTCODE..."
                className="w-full md:w-56 h-10 px-3.5 rounded-xl border border-purple-500/30 bg-[#07090f] text-xs font-mono text-white placeholder-slate-500 uppercase focus:border-purple-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={giftLoading || !giftCode.trim()}
                className="h-10 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold hover:opacity-90 transition-all shrink-0 cursor-pointer disabled:opacity-40 shadow-lg shadow-purple-950/40 flex items-center gap-1.5"
              >
                <Gift className="size-3.5" />
                <span>{giftLoading ? 'Đang nhận...' : 'Nhận Quà'}</span>
              </button>
            </form>
          </div>

          {giftMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{giftMessage}</span>
            </div>
          )}

          {giftError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{giftError}</span>
            </div>
          )}

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
