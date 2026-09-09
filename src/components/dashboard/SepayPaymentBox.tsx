'use client';

import React, { useState } from 'react';
import {
  Zap,
  Check,
  Copy,
  CheckCircle2,
  Crown,
  Sparkles,
  ShieldCheck,
  Flame,
  Coins,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useDashboard } from './DashboardContext';

interface SepayPaymentBoxProps {
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export type PlanKey = 'pro' | 'vip' | 'extra';

export const SUBSCRIPTION_PLANS: Record<
  PlanKey,
  {
    id: PlanKey;
    name: string;
    badge: string;
    badgeColor: string;
    priceUSD: number;
    tokensMonth: string;
    features: string[];
    isPopular?: boolean;
  }
> = {
  pro: {
    id: 'pro',
    name: 'Gói PRO',
    badge: 'Phổ biến',
    badgeColor: 'bg-emerald-500 text-black',
    priceUSD: 10,
    tokensMonth: '100,000 Tokens / tháng',
    features: [
      '✨ Tạo ảnh MachGen AI 4K không giới hạn',
      '⚡ 100,000 Tokens AI tốc độ cao',
      '🚀 Hỗ trợ 20+ Models (GPT-4o mini, DeepSeek R1)',
      '🔑 Tạo tối đa 10 API Keys',
    ],
  },
  vip: {
    id: 'vip',
    name: 'Gói VIP',
    badge: 'Khuyên Dùng',
    badgeColor: 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/20',
    priceUSD: 25,
    tokensMonth: '300,000 Tokens / tháng',
    isPopular: true,
    features: [
      '👑 Tất cả quyền lợi gói PRO',
      '⚡ 300,000 Tokens AI cao cấp / tháng',
      '🔥 Ưu tiên băng thông GPU cao nhất cho MachGen',
      '🧠 Mở khóa toàn bộ Flagship Models (Claude 3.7, GPT-4.5)',
      '🔑 Tạo không giới hạn API Keys',
    ],
  },
  extra: {
    id: 'extra',
    name: 'Gói EXTRA',
    badge: 'Doanh Nghiệp / Studio',
    badgeColor: 'bg-purple-500 text-white',
    priceUSD: 50,
    tokensMonth: '800,000 Tokens / tháng',
    features: [
      '💎 Tất cả quyền lợi gói VIP',
      '⚡ 800,000 Tokens AI không giới hạn',
      '🏢 Dedicated GPU Queue tốc độ phản hồi < 20ms',
      '🛡️ Hỗ trợ kỹ thuật 24/7 riêng biệt',
    ],
  },
};

export default function SepayPaymentBox({ onSuccess, title, subtitle }: SepayPaymentBoxProps) {
  const { user, t, handleTopup } = useDashboard();
  const [paymentMode, setPaymentMode] = useState<'plan' | 'topup'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('vip');
  const [topupAmount, setTopupAmount] = useState(20);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Calculate USD and VND based on selected mode
  let currentUSD = 10;
  let planPrefix = '';

  if (paymentMode === 'plan') {
    const planObj = SUBSCRIPTION_PLANS[selectedPlan];
    currentUSD = planObj.priceUSD;
    planPrefix = `${selectedPlan.toUpperCase()} `;
  } else {
    currentUSD = isCustomAmount ? parseFloat(customAmountInput) || 10 : topupAmount;
  }

  const amountVND = Math.round(currentUSD * 25400);
  const userCode = user?.id ? user.id.replace('user-', '').slice(-6).toUpperCase() : 'TOPUP88';
  const transferMemo = `LEMAS ${planPrefix}${userCode}`.trim();
  const qrImageUrl = `https://qr.sepay.vn/img?acc=0905304143&bank=MBBank&amount=${amountVND}&des=${encodeURIComponent(
    transferMemo
  )}`;

  const onConfirm = async () => {
    setIsVerifyingPayment(true);
    const ok = await handleTopup(currentUSD);
    setIsVerifyingPayment(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="p-3.5 sm:p-7 rounded-3xl border border-white/[0.08] bg-[#0e111a] space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <Zap className="size-5 text-emerald-400" />
            <span>{title || 'Cổng Thanh Toán & Nâng Cấp Gói SePay'}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {subtitle || 'Thanh toán tự động qua VietQR 24/7. Kích hoạt gói và số dư sau 2-5 giây.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-[#090b12] border border-white/[0.08] shrink-0">
          <button
            type="button"
            onClick={() => setPaymentMode('plan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              paymentMode === 'plan'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="size-3.5" />
            <span>Gói Đăng Ký (Tháng)</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode('topup')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              paymentMode === 'topup'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="size-3.5" />
            <span>Nạp Tiền Lẻ ($)</span>
          </button>
        </div>
      </div>

      {/* 1. Subscription Plans Selector */}
      {paymentMode === 'plan' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Crown className="size-4 text-amber-400" />
              Chọn Gói Cước Bạn Muốn Đăng Ký:
            </label>
            <span className="text-[11px] text-emerald-400 font-semibold">Tự động kích hoạt ngay</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {(Object.keys(SUBSCRIPTION_PLANS) as PlanKey[]).map((pKey) => {
              const p = SUBSCRIPTION_PLANS[pKey];
              const isSelected = selectedPlan === pKey;
              return (
                <div
                  key={pKey}
                  onClick={() => setSelectedPlan(pKey)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-400 bg-gradient-to-b from-emerald-500/15 via-[#121824] to-[#0c0f17] shadow-xl shadow-emerald-950/30'
                      : 'border-white/[0.08] bg-[#10131d] hover:border-white/20 hover:bg-[#131724]'
                  }`}
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-black text-white">{p.name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="my-2">
                    <div className="text-xl font-black text-white font-mono">
                      ${p.priceUSD}.00
                      <span className="text-[11px] font-normal text-slate-400 ml-1">/ tháng</span>
                    </div>
                    <div className="text-xs text-emerald-400 font-bold font-mono">
                      ~ {Math.round(p.priceUSD * 25400).toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-1.5 my-3 text-[11px] text-slate-300">
                    {p.features.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-1.5 leading-tight">
                        <Check className="size-3 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Selection Radio Indicator */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {isSelected ? 'Đang chọn thanh toán' : 'Bấm để chọn gói này'}
                    </span>
                    <div
                      className={`size-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="size-1.5 rounded-full bg-black" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 2. A-la-carte Topup Selector */
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Coins className="size-4 text-emerald-400" />
            Chọn Số Tiền USD Bạn Muốn Nạp Lẻ:
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {[5, 10, 20, 50, 100, 200, 500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setTopupAmount(amt);
                  setIsCustomAmount(false);
                }}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  !isCustomAmount && topupAmount === amt
                    ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300 shadow-md shadow-emerald-950/30'
                    : 'border-white/[0.08] bg-[#121520] text-slate-300 hover:border-white/20 hover:text-white'
                }`}
              >
                ${amt}.00
                <span className="block text-[9px] font-mono text-slate-400">
                  ~ {Math.round(amt * 25400).toLocaleString('vi-VN')} đ
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsCustomAmount(true)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                isCustomAmount
                  ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300 shadow-md shadow-emerald-950/30'
                  : 'border-white/[0.08] bg-[#121520] text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              Tùy chọn số tiền
            </button>
          </div>

          {isCustomAmount && (
            <div className="flex items-center gap-3 pt-2 max-w-sm">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customAmountInput}
                  onChange={(e) => setCustomAmountInput(e.target.value)}
                  placeholder="Nhập số USD (ví dụ: 15)"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-emerald-500/40 bg-[#121520] text-white text-xs font-mono focus:outline-none"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                ~ {amountVND.toLocaleString('vi-VN')} đ
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. SePay VietQR Dynamic Payment Frame */}
      <div className="pt-4 border-t border-white/[0.08] grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic QR Box */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between p-5 rounded-2xl border border-white/[0.08] bg-[#090b12] space-y-4 text-center">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              VietQR · SePay Gateway
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Quét mã bằng App Ngân hàng bất kỳ
            </h4>
          </div>

          {/* QR Image Frame */}
          <div className="p-3 bg-white rounded-2xl shadow-2xl border border-white/20 relative group">
            <img
              src={qrImageUrl}
              alt="SePay VietQR Code"
              className="size-52 sm:size-56 object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.vietqr.io/image/MB-0905304143-compact2.png?amount=${amountVND}&addInfo=${encodeURIComponent(
                  transferMemo
                )}&accountName=MAC%20NHU%20HUU`;
              }}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Đang chờ giao dịch từ ngân hàng...</span>
          </div>
        </div>

        {/* Right: Bank Details & Action */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            {/* Bank Name */}
            <div className="p-3 rounded-xl border border-white/[0.08] bg-[#121520] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500">Ngân hàng thụ hưởng</span>
                <div className="text-xs font-bold text-white">MB Bank (Ngân hàng TMCP Quân Đội)</div>
              </div>
              <span className="px-2 py-1 rounded bg-white/[0.04] text-[10px] font-bold text-slate-400">
                MB
              </span>
            </div>

            {/* Account Number */}
            <div className="p-3 rounded-xl border border-white/[0.08] bg-[#121520] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500">Số tài khoản</span>
                <div className="text-sm font-mono font-bold text-emerald-300">0905304143</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('stk', '0905304143')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-semibold text-white hover:border-emerald-400 transition-colors"
              >
                {copiedKeyId === 'stk' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                <span>{copiedKeyId === 'stk' ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            {/* Account Holder */}
            <div className="p-3 rounded-xl border border-white/[0.08] bg-[#121520] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500">Chủ tài khoản</span>
                <div className="text-xs font-bold text-white">MẠC NHƯ HỮU</div>
              </div>
            </div>

            {/* Amount to Pay */}
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-300">
                  Số tiền cần thanh toán ({paymentMode === 'plan' ? SUBSCRIPTION_PLANS[selectedPlan].name : 'Nạp lẻ'})
                </span>
                <div className="text-base font-extrabold text-emerald-400 font-mono">
                  {amountVND.toLocaleString('vi-VN')} đ
                  <span className="text-xs font-normal text-slate-400 ml-2">(${currentUSD}.00 USD)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('amount', amountVND.toString())}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                {copiedKeyId === 'amount' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                <span>{copiedKeyId === 'amount' ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            {/* Transfer Memo (Mandatory) */}
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-300">Nội dung chuyển khoản (Bắt buộc giữ nguyên)</span>
                <div className="text-sm font-mono font-extrabold text-amber-400">{transferMemo}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('memo', transferMemo)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                {copiedKeyId === 'memo' ? <Check className="size-3.5 text-amber-400" /> : <Copy className="size-3.5" />}
                <span>{copiedKeyId === 'memo' ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            {/* Warning Alert */}
            <p className="text-[11px] text-slate-400 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              ⚠️ Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống SePay tự động nhận diện và kích hoạt ngay sau 2-5 giây.
            </p>
          </div>

          {/* Confirm Transferred Button */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isVerifyingPayment}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black text-sm font-extrabold hover:opacity-95 transition-all shadow-xl shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
          >
            {isVerifyingPayment ? (
              <span className="size-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <CheckCircle2 className="size-4 text-black" />
            )}
            <span>{isVerifyingPayment ? 'Đang kiểm tra giao dịch...' : 'Tôi đã chuyển khoản thành công'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
