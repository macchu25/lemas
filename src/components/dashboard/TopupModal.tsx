'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useDashboard } from './DashboardContext';
import SepayPaymentBox from './SepayPaymentBox';

export default function TopupModal() {
  const { topupModalOpen, setTopupModalOpen, t } = useDashboard();

  if (!topupModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-emerald-500/30 bg-[#0b0e17] shadow-2xl p-6 my-8">
        <button
          type="button"
          onClick={() => setTopupModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer z-10"
        >
          <X className="size-5" />
        </button>

        <SepayPaymentBox
          onSuccess={() => setTopupModalOpen(false)}
          title={t.modalTitle}
          subtitle={t.modalSub}
        />
      </div>
    </div>
  );
}
