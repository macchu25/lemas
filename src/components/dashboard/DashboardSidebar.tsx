'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bell,
  MessageSquare,
  Cpu,
  Key,
  BarChart3,
  ListOrdered,
  Wallet,
  Tag,
  Users,
  ShieldAlert,
  PanelLeftClose,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useDashboard } from './DashboardContext';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { t, sidebarOpen, setSidebarOpen, setTopupModalOpen, models } = useDashboard();

  const isLinkActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside
      className={`border-r border-white/[0.08] bg-[#0b0d13] flex flex-col justify-between overflow-y-auto hidden md:flex shrink-0 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-56 p-3.5 opacity-100' : 'w-0 p-0 border-r-0 opacity-0 pointer-events-none'
      }`}
    >
      <div className="space-y-4">
        {/* Top Brand & Toggle Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <Link href="/" className="flex items-center gap-2 overflow-hidden group">
            <div className="size-7 rounded-lg flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform shrink-0">
              <img src="/logo.png" alt="Lemas Logo" className="size-6 object-contain drop-shadow" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white truncate">
              {t.brand}
            </span>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-white/[0.08] transition-all shrink-0 ml-1"
            title={t.collapseSidebar}
          >
            <PanelLeftClose className="size-4 text-slate-300 hover:text-emerald-400 transition-colors" />
          </button>
        </div>

        {/* WORKSPACE */}
        <div>
          <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-1.5">
            {t.workspace}
          </div>
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isLinkActive('/dashboard')
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <LayoutDashboard className="size-4" />
              <span>{t.overview}</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="size-4" />
                <span>{t.notifications}</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                {t.newBadge}
              </span>
            </Link>
          </div>
        </div>

        {/* AI ENGINE */}
        <div>
          <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-1.5">
            {t.aiEngine}
          </div>
          <div className="space-y-1">
            <Link
              href="/dashboard/chat"
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isLinkActive('/dashboard/chat')
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <MessageSquare className="size-4" />
              <span>{t.aiChat}</span>
            </Link>
            <Link
              href="/dashboard/models"
              className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isLinkActive('/dashboard/models')
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="size-4" />
                <span>{t.modelsCatalog}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {models.length > 0 ? models.length : '22+'}
              </span>
            </Link>
            <Link
              href="/dashboard/keys"
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isLinkActive('/dashboard/keys')
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Key className="size-4" />
              <span>{t.apiKeys}</span>
            </Link>
            <Link
              href="/dashboard/analytics"
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isLinkActive('/dashboard/analytics')
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <BarChart3 className="size-4" />
              <span>{t.analytics}</span>
            </Link>
            <Link
              href="/dashboard/logs"
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isLinkActive('/dashboard/logs')
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <ListOrdered className="size-4" />
              <span>{t.requestLogs}</span>
            </Link>
          </div>
        </div>

        {/* BILLING */}
        <div>
          <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-1.5">
            {t.billingMenu}
          </div>
          <div className="space-y-1">
            <Link
              href="/dashboard/billing"
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isLinkActive('/dashboard/billing')
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Wallet className="size-4" />
              <span>{t.balanceTopup}</span>
            </Link>
          </div>
        </div>

        {/* PROGRAMS */}
        <div>
          <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-1.5">
            {t.programs}
          </div>
          <div className="space-y-1">
            <Link
              href="/dashboard/affiliate"
              className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isLinkActive('/dashboard/affiliate')
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="size-4" />
                <span>{t.affiliate}</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                15%
              </span>
            </Link>

            <Link
              href="/admin"
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="size-4" />
                <span>{t.adminPortal}</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/30 text-emerald-200">
                Host
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Upgrade Box */}
      <div className="mt-6 p-3.5 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
          <Sparkles className="size-3.5" />
          <span>{t.upgradeProTitle}</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          {t.upgradeProSub}
        </p>
        <button
          onClick={() => setTopupModalOpen(true)}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[11px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1 shadow-lg shadow-emerald-950/40"
        >
          <span>{t.topupBtn}</span>
          <ArrowRight className="size-3" />
        </button>
      </div>
    </aside>
  );
}
