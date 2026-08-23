'use client';

import React from 'react';
import KeyManager from '@/components/dashboard/KeyManager';

export default function DashboardKeysPage() {
  return (
    <div className="h-full w-full rounded-2xl border border-white/[0.08] overflow-y-auto bg-[#0a0c12] shadow-2xl p-3 sm:p-5 lg:p-6 relative">
      <KeyManager />
    </div>
  );
}
