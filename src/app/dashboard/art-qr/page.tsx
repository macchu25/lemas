'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Clock,
  Cpu,
  Layers,
  Palette,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function ArtQRComingSoonPage() {
  return (
    <div className="relative min-h-[85vh] w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[#07090e] p-6 sm:p-10 lg:p-14 flex items-center justify-center">
      {/* Background Glows */}
      <div className="pointer-events-none absolute -left-20 -top-20 size-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 size-96 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-cyan-500/5 blur-[160px]" />

      <div className="relative z-10 mx-auto max-w-3xl text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 backdrop-blur-md shadow-lg shadow-amber-500/10">
          <Clock className="size-3.5 animate-pulse" />
          <span>Coming Soon</span>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-xl shadow-emerald-500/20">
              <QrCode className="size-8" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            AI Art QR Studio
          </h1>
          <p className="mx-auto max-w-xl text-sm sm:text-base leading-relaxed text-slate-400">
            Tính năng đang được bảo trì để nâng cấp lên mô hình thế hệ mới với độ phân giải <strong className="text-emerald-400">1024x1024</strong>, 
            công nghệ phối màu điện ảnh và tỷ lệ quét mã chuẩn xác 100%.
          </p>
        </div>

        {/* Highlight Feature Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 backdrop-blur-sm">
            <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Cpu className="size-4" />
            </div>
            <h2 className="text-xs font-bold text-slate-200">Model AI Thế Hệ Mới</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Nâng cấp nền tảng SDXL & FLUX cho chi tiết phong cảnh và nhân vật sắc nét, chân thực.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 backdrop-blur-sm">
            <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Palette className="size-4" />
            </div>
            <h2 className="text-xs font-bold text-slate-200">Color Harmony Engine</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Phối màu theo bánh xe màu mỹ thuật và ánh sáng điện ảnh Hollywood 3D.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 backdrop-blur-sm">
            <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <ShieldCheck className="size-4" />
            </div>
            <h2 className="text-xs font-bold text-slate-200">100% Scan Verified</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Hệ thống xác thực đa tầng đảm bảo camera và Zalo quét tức thì.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-xs font-bold text-[#05110d] shadow-lg shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <ArrowLeft className="size-4" />
            Quay về Dashboard
          </Link>
          <Link
            href="/dashboard/ai-image"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] active:scale-95 transition-all"
          >
            <Sparkles className="size-4 text-cyan-400" />
            Khám phá Tạo Ảnh AI
          </Link>
        </div>
      </div>
    </div>
  );
}
