'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
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
    <nav className="md:hidden shrink-0 border-t border-white/[0.08] bg-[#07090f]/95 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around z-40 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              item.active
                ? 'text-emerald-400 bg-emerald-500/10 font-bold scale-105'
                : 'text-slate-400 hover:text-white font-medium'
            }`}
          >
            <Icon className={`size-4.5 ${item.active ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
