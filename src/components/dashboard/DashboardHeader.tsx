'use client';

import React from 'react';
import {
  PanelLeft,
  Wallet,
  LogOut,
  Search,
} from 'lucide-react';
import { useDashboard } from './DashboardContext';

export default function DashboardHeader() {
  const {
    user,
    lang,
    toggleLanguage,
    t,
    sidebarOpen,
    setSidebarOpen,
    setTopupModalOpen,
    handleLogout,
  } = useDashboard();

  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#0b0d13] flex items-center justify-between px-4 sm:px-6 shrink-0">
      {/* Left controls */}
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-white/[0.08] transition-all flex items-center gap-2"
            title="Mở rộng thanh bên"
          >
            <img src="/logo.png" alt="Lemas Logo" className="size-4.5 object-contain" />
            <span className="text-xs font-semibold text-white hidden sm:inline">{t.brand}</span>
          </button>
        )}

        {/* Global Quick Search Bar */}
        <div className="relative hidden md:block">
          <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search models, keys, docs..."
            className="w-56 lg:w-72 h-8 pl-8 pr-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Balance Pill */}
        <button
          onClick={() => setTopupModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
          title="Nạp tiền qua SePay VietQR"
        >
          <Wallet className="size-3.5" />
          <span>${(user?.balance || 0).toFixed(2)}</span>
          <span className="size-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[11px] font-bold ml-0.5">
            +
          </span>
        </button>

        {/* Daily Token Limit Pill (1000 tokens/day) */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-xs font-mono font-bold text-cyan-300"
          title="Hạn mức sử dụng Token trong ngày hôm nay (Tối đa 1,000 tokens/ngày)"
        >
          <span className="size-1.5 rounded-full bg-cyan-400" />
          <span>{user?.daily_tokens_used || 0}/{user?.daily_tokens_limit || 1000} tokens/ngày</span>
        </div>

        {/* API Online Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{t.apiOnline}</span>
        </div>

        {/* Trilingual Switcher (Flag Logo Only) & Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-center size-8 rounded-lg border border-white/[0.08] bg-white/[0.04] text-base hover:bg-white/[0.08] hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm"
            title={lang === 'vi' ? '🇻🇳 Tiếng Việt' : lang === 'en' ? '🇺🇸 English' : '🇨🇳 简体中文'}
          >
            <span>{lang === 'vi' ? '🇻🇳' : lang === 'en' ? '🇺🇸' : '🇨🇳'}</span>
          </button>

          <div className="flex items-center gap-2 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.08]">
            <span className="size-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-black text-[10px] font-extrabold flex items-center justify-center">
              {(user?.name || user?.email || 'L').slice(0, 1).toUpperCase()}
            </span>
            <span className="text-xs font-semibold text-white max-w-[120px] truncate">
              {user?.name || user?.email}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.04] transition-colors"
            title={t.logout}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
