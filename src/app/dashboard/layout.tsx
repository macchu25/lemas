'use client';

import React from 'react';
import { DashboardProvider, useDashboard } from '@/components/dashboard/DashboardContext';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TopupModal from '@/components/dashboard/TopupModal';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { loading } = useDashboard();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Đang tải bảng điều khiển Lemas.AI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#08090d] text-[#f8fafc] flex">
      {/* Left Sidebar (Desktop & Mobile Drawer) */}
      <DashboardSidebar />

      {/* Main Right Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#08090d]">
        {/* Top Header */}
        <DashboardHeader />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-hidden flex flex-col p-2 sm:p-3.5 h-full w-full">
          {children}
        </main>
      </div>

      {/* Standalone SePay Topup Modal */}
      <TopupModal />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
