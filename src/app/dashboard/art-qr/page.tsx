'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function ArtQRRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Seamlessly redirect to Image Studio
    router.replace('/dashboard/image');
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-center p-6">
      <div className="size-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
        <Sparkles className="size-6 animate-pulse" />
      </div>
      <h2 className="text-base font-bold text-white">Đang chuyển hướng sang MachGen AI Studio...</h2>
      <p className="text-xs text-slate-400">
        Nếu trang không tự chuyển hướng, bấm{' '}
        <Link href="/dashboard/image" className="text-cyan-400 font-bold underline">
          vào đây
        </Link>
        .
      </p>
      <RefreshCw className="size-4 animate-spin text-cyan-500 mt-2" />
    </div>
  );
}
