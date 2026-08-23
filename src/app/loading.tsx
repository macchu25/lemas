import React from 'react';

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090e]/80 backdrop-blur-xs">
      <div className="flex flex-col items-center gap-3">
        <div className="relative size-12">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
          <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-indigo-400 border-b-purple-400 border-l-transparent animate-spin" />
        </div>
        <span className="text-xs font-mono font-medium text-slate-400">Lemas.AI Fast Route...</span>
      </div>
    </div>
  );
}
