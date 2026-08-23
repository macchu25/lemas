'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Cpu,
  Key,
  Wallet,
  ListOrdered,
} from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Tổng quan',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      label: 'AI Chat',
      href: '/dashboard/chat',
      icon: MessageSquare,
      active: pathname.startsWith('/dashboard/chat'),
    },
    {
      label: 'Models',
      href: '/dashboard/models',
      icon: Cpu,
      active: pathname.startsWith('/dashboard/models'),
    },
    {
      label: 'API Keys',
      href: '/dashboard/keys',
      icon: Key,
      active: pathname.startsWith('/dashboard/keys'),
    },
    {
      label: 'Nạp Tiền',
      href: '/dashboard/billing',
      icon: Wallet,
      active: pathname.startsWith('/dashboard/billing'),
    },
    {
      label: 'Nhật Ký',
      href: '/dashboard/logs',
      icon: ListOrdered,
      active: pathname.startsWith('/dashboard/logs'),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-[#07090f]/95 backdrop-blur-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.85)]">
      <nav className="grid grid-cols-6 items-center px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all ${
                item.active
                  ? 'text-emerald-400 bg-emerald-500/15 font-bold scale-105 shadow-xs'
                  : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              <Icon className={`size-4.5 ${item.active ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-[9px] tracking-tight leading-none truncate max-w-[52px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
