'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Art QR Studio Page Error:', error);
  }, [error]);

  return (
    <div className="h-full w-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-[#0a0c12] rounded-2xl border border-rose-500/20 shadow-xl">
      <div className="size-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
        <AlertTriangle className="size-7" />
      </div>
      <h2 className="text-base font-bold text-white mb-2">Đã xảy ra sự cố khi tải Art QR Studio</h2>
      <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
        {error?.message || 'Không thể hiển thị giao diện. Vui lòng bấm thử lại để tải mới.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <RefreshCw className="size-3.5" />
          <span>Thử Tải Lại</span>
        </button>
        <button
          type="button"
          onClick={() => { window.location.href = '/dashboard'; }}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
        >
          <span>Về Trang Bảng Điều Khiển</span>
        </button>
      </div>
    </div>
  );
}
