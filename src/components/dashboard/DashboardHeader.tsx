'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  Wallet,
  LogOut,
  Search,
  Gift,
  ChevronDown,
  CreditCard,
  LifeBuoy,
  Settings,
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
    handleLogout,
  } = useDashboard();

  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Developer';
  const displayEmail = user?.email || 'user@lemas.ai';
  const initial = (user?.name || user?.email || 'L').slice(0, 1).toUpperCase();

  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#0b0d13] flex items-center justify-between px-2.5 sm:px-6 shrink-0 max-w-full relative z-30">
      {/* Left controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-white/[0.08] transition-all flex items-center gap-1.5 cursor-pointer"
            title="Mở menu điều khiển"
          >
            <Menu className="size-4 text-emerald-400" />
            <img src="/logo.png" alt="Lemas Logo" className="size-5 object-contain" />
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
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Balance Pill -> Links directly to /dashboard/billing */}
        <Link
          href="/dashboard/billing"
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer shrink-0"
          title="Nạp tiền qua SePay VietQR"
        >
          <Wallet className="size-3.5 text-emerald-400" />
          <span>${(user?.balance || 0).toFixed(2)}</span>
          <span className="size-3.5 sm:size-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] sm:text-[11px] font-bold ml-0.5">
            +
          </span>
        </Link>

        {/* Permanent Gift Tokens Badge */}
        {Boolean(user?.gift_tokens && user.gift_tokens > 0) && (
          <Link
            href="/dashboard/billing"
            className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-xs font-mono font-bold text-purple-300 hover:bg-purple-500/25 transition-all shrink-0"
            title="Lượng Token quà tặng vĩnh viễn"
          >
            <Gift className="size-3 text-purple-400" />
            <span>+{(user?.gift_tokens || 0).toLocaleString()}</span>
          </Link>
        )}

        {/* Daily Token Limit Pill (1000 tokens/day) */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-xs font-mono font-bold text-cyan-300 shrink-0"
          title="Hạn mức sử dụng Token trong ngày hôm nay"
        >
          <span className="size-1.5 rounded-full bg-cyan-400" />
          <span>{user?.daily_tokens_used || 0}/{user?.daily_tokens_limit || 1000} tokens/ngày</span>
        </div>

        {/* API Online Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400 shrink-0">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{t.apiOnline}</span>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-white/[0.08] shrink-0">
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-center size-7 sm:size-8 rounded-lg border border-white/[0.08] bg-white/[0.04] text-xs sm:text-base hover:bg-white/[0.08] hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm shrink-0"
            title={lang === 'vi' ? '🇻🇳 Tiếng Việt' : lang === 'en' ? '🇺🇸 English' : '🇨🇳 简体中文'}
          >
            <span>{lang === 'vi' ? '🇻🇳' : lang === 'en' ? '🇺🇸' : '🇨🇳'}</span>
          </button>

          {/* User Profile Dropdown Toggle */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] p-1 sm:px-2.5 sm:py-1 rounded-xl border border-white/[0.08] hover:border-emerald-500/40 transition-all cursor-pointer group"
              title="Tài khoản cá nhân"
            >
              <span className="size-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-black text-[10px] font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                {initial}
              </span>
              <div className="text-left hidden xs:block max-w-[120px]">
                <div className="text-xs font-semibold text-white truncate leading-tight">
                  {displayName}
                </div>
                <div className="text-[10px] text-slate-400 truncate leading-tight">
                  {displayEmail}
                </div>
              </div>
              <ChevronDown className={`size-3 text-slate-400 group-hover:text-white transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popup Menu */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 bg-[#0d101a]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-3 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="px-1.5 py-1">
                  <div className="text-sm font-bold text-white truncate">{displayName}</div>
                  <div className="text-xs text-slate-400 truncate">{displayEmail}</div>
                </div>

                {/* Balance Box */}
                <Link
                  href="/dashboard/billing"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <Wallet className="size-4 text-emerald-400" />
                    <span>Balance</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-400">
                    ${(user?.balance || 0).toFixed(2)}
                  </span>
                </Link>

                <div className="h-px bg-white/[0.08] -mx-1" />

                {/* Nav Links */}
                <div className="space-y-1">
                  <Link
                    href="/dashboard/billing"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
                  >
                    <CreditCard className="size-4 text-slate-400" />
                    <span>Top up & Billing</span>
                  </Link>

                  <Link
                    href="/contact"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
                  >
                    <LifeBuoy className="size-4 text-slate-400" />
                    <span>Contact & Support</span>
                  </Link>

                  <Link
                    href="/dashboard/keys"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
                  >
                    <Settings className="size-4 text-slate-400" />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="h-px bg-white/[0.08] -mx-1" />

                {/* Sign out */}
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  <LogOut className="size-4 text-rose-400" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
