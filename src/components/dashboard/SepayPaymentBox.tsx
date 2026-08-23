'use client';

import React, { useState } from 'react';
import {
  Zap,
  Check,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { useDashboard } from './DashboardContext';

interface SepayPaymentBoxProps {
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export default function SepayPaymentBox({ onSuccess, title, subtitle }: SepayPaymentBoxProps) {
  const { user, t, handleTopup } = useDashboard();
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

  const currentUSD = isCustomAmount ? (parseFloat(customAmountInput) || 10) : topupAmount;
  const amountVND = Math.round(currentUSD * 25400);
  const userCode = user?.id ? user.id.replace('user-', '').slice(-6).toUpperCase() : 'TOPUP88';
  const transferMemo = `LEMAS ${userCode}`;
  const qrImageUrl = `https://qr.sepay.vn/img?acc=0868888999&bank=MBBank&amount=${amountVND}&des=${encodeURIComponent(transferMemo)}`;

  const onConfirm = async () => {
    setIsVerifyingPayment(true);
    const ok = await handleTopup(currentUSD);
    setIsVerifyingPayment(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-[#0e111a] space-y-6 w-full">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="size-4 text-emerald-400" />
          <span>{title || t.topupCardTitle}</span>
        </h2>
        <p className="text-xs text-slate-400">
          {subtitle || t.topupCardSubtitle}
        </p>
      </div>

      {/* 1. Chọn số tiền */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-300">
          {t.chooseAmount}
        </label>
        <div className="flex flex-wrap items-center gap-2.5">
          {[10, 20, 50, 100, 200, 500].map((amt) => (
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
            {t.customAmount}
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
                placeholder={t.customAmountPlaceholder}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-emerald-500/40 bg-[#121520] text-white text-xs font-mono focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              ~ {amountVND.toLocaleString('vi-VN')} đ
            </span>
          </div>
        )}
      </div>

      {/* 2. Phương thức thanh toán duy nhất: SePay VietQR */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-300">
          {t.paymentMethod}
        </label>
        <div className="p-4 rounded-2xl border border-emerald-500/40 bg-[#10141f] flex items-center justify-between shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-black flex items-center justify-center font-extrabold text-sm shadow-md shadow-emerald-950/40">
              <Zap className="size-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">{t.sepayMethodTitle}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-black">
                  VietQR 24/7
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.sepayMethodDesc}
              </p>
            </div>
          </div>

          <div className="size-5 rounded-full border-2 border-emerald-400 flex items-center justify-center shrink-0">
            <div className="size-2.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* 3. SePay VietQR Dynamic Payment Frame */}
      <div className="pt-4 border-t border-white/[0.08] grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic QR Box */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between p-6 rounded-2xl border border-white/[0.08] bg-[#090b12] space-y-4 text-center">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              VietQR · SePay Gateway
            </span>
            <h4 className="text-sm font-bold text-white">
              {t.scanQrTitle}
            </h4>
          </div>

          {/* QR Image Frame */}
          <div className="p-3 bg-white rounded-2xl shadow-xl border border-white/20 relative group">
            <img
              src={qrImageUrl}
              alt="SePay VietQR Code"
              className="size-56 object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.vietqr.io/image/MB-0868888999-compact2.png?amount=${amountVND}&addInfo=${encodeURIComponent(transferMemo)}&accountName=LEMAS%20AI%20GATEWAY`;
              }}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{t.waitingPayment}</span>
          </div>
        </div>

        {/* Right: Bank Details & Action */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            {/* Bank Name */}
            <div className="p-3 rounded-xl border border-white/[0.08] bg-[#121520] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500">{t.bankName}</span>
                <div className="text-xs font-bold text-white">MB Bank (Ngân hàng TMCP Quân Đội)</div>
              </div>
              <span className="px-2 py-1 rounded bg-white/[0.04] text-[10px] font-bold text-slate-400">
                MB
              </span>
            </div>

            {/* Account Number */}
            <div className="p-3 rounded-xl border border-white/[0.08] bg-[#121520] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500">{t.accountNumber}</span>
                <div className="text-sm font-mono font-bold text-emerald-300">0868888999</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('stk', '0868888999')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-semibold text-white hover:border-emerald-400 transition-colors"
              >
                {copiedKeyId === 'stk' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                <span>{copiedKeyId === 'stk' ? t.copied : t.copyKey}</span>
              </button>
            </div>

            {/* Account Holder */}
            <div className="p-3 rounded-xl border border-white/[0.08] bg-[#121520] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500">{t.accountHolder}</span>
                <div className="text-xs font-bold text-white">LEMAS AI GATEWAY</div>
              </div>
            </div>

            {/* Amount to Pay */}
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-300">{t.amountToPay}</span>
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
                <span>{copiedKeyId === 'amount' ? t.copied : t.copyKey}</span>
              </button>
            </div>

            {/* Transfer Memo (Mandatory) */}
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-300">{t.transferSyntax}</span>
                <div className="text-sm font-mono font-extrabold text-amber-400">{transferMemo}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('memo', transferMemo)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                {copiedKeyId === 'memo' ? <Check className="size-3.5 text-amber-400" /> : <Copy className="size-3.5" />}
                <span>{copiedKeyId === 'memo' ? t.copied : t.copyKey}</span>
              </button>
            </div>

            {/* Warning Alert */}
            <p className="text-[11px] text-slate-400 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              ⚠️ {t.syntaxWarning}
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
            <span>{isVerifyingPayment ? t.verifyingPayment : t.confirmTransferred}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
