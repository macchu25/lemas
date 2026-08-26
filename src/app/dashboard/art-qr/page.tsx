'use client';

import React, { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, ImageUp, LoaderCircle, QrCode, RefreshCw, ScanLine, ShieldCheck, Sparkles, UploadCloud, X, XCircle } from 'lucide-react';
import { ArtQRJob, ArtQRStyle, createArtQRJob, fetchArtQRJob } from '@/lib/api';

const STYLES: { id: ArtQRStyle; name: string; description: string; colors: string[]; hint: string }[] = [
  { id: 'starry-night', name: 'Starry Night', description: 'Sơn dầu xanh cobalt, bầu trời xoáy và ánh sao vàng.', colors: ['#172554', '#1d4ed8', '#facc15'], hint: 'Oil impasto · Cobalt · Golden stars' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Khối QR hóa thành cửa sổ và biển neon thành phố đêm.', colors: ['#07131f', '#06b6d4', '#ec4899'], hint: 'Neon city · Cinematic · Future' },
  { id: 'watercolor', name: 'Watercolor', description: 'Lá, cành và sắc màu nước mềm trên nền giấy ấm.', colors: ['#f5f0e8', '#047857', '#6366f1'], hint: 'Botanical · Soft pigment · Handmade' },
];

const terminal = new Set(['succeeded', 'failed', 'canceled']);

export default function ArtQrPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<ArtQRStyle>('starry-night');
  const [dragging, setDragging] = useState(false);
  const [job, setJob] = useState<ArtQRJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!job?.job_id || terminal.has(job.status)) return;
    let stopped = false;
    const timer = window.setInterval(async () => {
      try {
        const next = await fetchArtQRJob(job.job_id);
        if (!stopped) setJob(next);
        if (terminal.has(next.status)) window.clearInterval(timer);
      } catch (err) {
        if (!stopped) setError(err instanceof Error ? err.message : 'Mất kết nối khi kiểm tra tiến trình');
      }
    }, 3500);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [job?.job_id, job?.status]);

  useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);

  const acceptFile = (next?: File) => {
    if (!next) return;
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(next.type)) return setError('Chỉ hỗ trợ ảnh QR PNG, JPG hoặc GIF.');
    if (next.size > 5 * 1024 * 1024) return setError('Ảnh QR phải nhỏ hơn 5 MB.');
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(next);
    objectUrlRef.current = url;
    setFile(next); setPreview(url); setJob(null); setError(null);
  };

  const clearFile = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setFile(null); setPreview(null); setJob(null); setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const generate = async () => {
    if (!file || submitting) return;
    setSubmitting(true); setJob(null); setError(null);
    try { setJob(await createArtQRJob(file, style)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể bắt đầu tạo Art QR'); }
    finally { setSubmitting(false); }
  };

  const working = submitting || (!!job && !terminal.has(job.status));
  const validImages = job?.images?.filter((image) => image.scannable) || [];

  return (
    <div className="h-full w-full overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#090b10] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
        <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex items-center gap-2"><QrCode className="size-5 text-emerald-300" /><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">QR ControlNet</span></div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">AI Art QR Studio</h1>
            <p className="mt-1.5 max-w-[70ch] text-sm leading-6 text-slate-400">Tải QR có sẵn, chọn phong cách và nhận tác phẩm đã được hệ thống quét xác minh. Ảnh không giải mã đúng QR gốc sẽ tự động bị loại.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-[11px] font-medium text-emerald-200"><ShieldCheck className="size-4" /> Chỉ trả mẫu quét đúng</div>
        </header>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(400px,1.05fr)]">
          <section className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#0e1118] p-4 sm:p-6">
            <div>
              <div className="mb-2 flex items-center justify-between"><label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><ImageUp className="size-3.5 text-cyan-300" /> 1. Tải QR gốc</label><span className="text-[10px] text-slate-600">PNG, JPG, GIF · tối đa 5 MB</span></div>
              <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files?.[0]); }} onClick={() => !file && inputRef.current?.click()} className={`relative flex min-h-56 items-center justify-center overflow-hidden rounded-2xl border border-dashed transition-colors ${file ? 'border-white/10 bg-[#090c12]' : dragging ? 'cursor-copy border-emerald-400/60 bg-emerald-400/[0.07]' : 'cursor-pointer border-white/15 bg-white/[0.02] hover:border-emerald-400/40'}`}>
                <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/gif" onChange={(e: ChangeEvent<HTMLInputElement>) => acceptFile(e.target.files?.[0])} className="sr-only" />
                {preview ? <><img src={preview} alt="QR gốc" className="max-h-52 max-w-full object-contain p-4" /><button type="button" onClick={(e) => { e.stopPropagation(); clearFile(); }} className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg border border-white/10 bg-[#090c12]/90 text-slate-400 hover:text-white" aria-label="Xóa QR"><X className="size-4" /></button></> : <div className="px-6 text-center"><span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"><UploadCloud className="size-5 text-emerald-300" /></span><p className="text-sm font-semibold text-slate-200">Thả ảnh QR vào đây</p><p className="mt-1 text-xs text-slate-500">hoặc bấm để chọn từ thiết bị</p></div>}
              </div>
            </div>

            <div className="space-y-3 border-t border-white/[0.07] pt-5">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><Sparkles className="size-3.5 text-violet-300" /> 2. Chọn phong cách</label>
              <div className="grid gap-2 sm:grid-cols-3">{STYLES.map((item) => { const selected = style === item.id; return <button key={item.id} type="button" onClick={() => { setStyle(item.id); setJob(null); }} aria-pressed={selected} className={`relative min-h-36 rounded-xl border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/50 ${selected ? 'border-emerald-400/55 bg-emerald-400/[0.07]' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'}`}><span className="mb-4 flex gap-1.5">{item.colors.map((color) => <i key={color} className="size-5 rounded-full border border-white/10" style={{ background: color }} />)}</span><strong className="block text-sm text-slate-100">{item.name}</strong><span className="mt-1.5 block text-[11px] leading-4 text-slate-500">{item.description}</span><span className="mt-3 block font-mono text-[9px] uppercase text-slate-600">{item.hint}</span>{selected && <CheckCircle2 className="absolute right-3 top-3 size-4 text-emerald-300" />}</button>; })}</div>
            </div>

            <button type="button" onClick={generate} disabled={!file || working} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-extrabold text-[#06110d] transition-colors hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-40">{working ? <><LoaderCircle className="size-4 animate-spin" /> Đang tạo và kiểm tra QR...</> : <><Sparkles className="size-4" /> Tạo 4 mẫu Art QR</>}</button>
            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-3.5 py-3 text-xs leading-5 text-rose-200"><XCircle className="mt-0.5 size-4 shrink-0" />{error}</div>}
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-[#0e1118]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5 sm:px-5"><div><h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Kết quả đã xác minh</h2><p className="mt-1 text-[10px] text-slate-600">ZXing so sánh dữ liệu decode với QR gốc</p></div>{job && <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${job.status === 'succeeded' ? 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-300' : job.status === 'failed' ? 'border-rose-400/25 bg-rose-400/[0.07] text-rose-300' : 'border-cyan-400/25 bg-cyan-400/[0.07] text-cyan-300'}`}>{job.status === 'succeeded' ? 'Hoàn tất' : job.status === 'failed' ? 'Không đạt' : `Lần ${job.attempt}/${job.max_attempts}`}</span>}</div>
            <div className="min-h-[520px] p-4 sm:p-5">
              {!job && !working && <EmptyResults />}
              {working && <div className="flex min-h-[470px] flex-col items-center justify-center text-center"><span className="relative mb-5 flex size-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05]"><QrCode className="size-7 text-cyan-300" /><LoaderCircle className="absolute -right-2 -top-2 size-5 animate-spin text-emerald-300" /></span><p className="text-sm font-semibold text-slate-200">GPU đang tạo Art QR</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">ControlNet giữ cấu trúc QR, sau đó ZXing quét từng ảnh. Nếu tất cả thất bại, hệ thống tự tăng conditioning và thử lại.</p>{job && <div className="mt-5 flex gap-2 text-[10px] text-slate-500"><span className="rounded-lg bg-white/[0.04] px-2.5 py-1.5">Lần {job.attempt}/{job.max_attempts}</span><span className="rounded-lg bg-white/[0.04] px-2.5 py-1.5">Đã loại {job.rejected_count || 0}</span></div>}</div>}
              {job?.status === 'failed' && <div className="flex min-h-[470px] flex-col items-center justify-center text-center"><XCircle className="mb-3 size-9 text-rose-300" /><p className="text-sm font-semibold text-slate-200">Chưa tạo được mẫu quét đúng</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{job.error || 'Đã thử tối đa nhưng ảnh chưa giải mã đúng QR gốc.'}</p><button type="button" onClick={generate} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"><RefreshCw className="size-3.5" /> Thử lại</button></div>}
              {job?.status === 'succeeded' && validImages.length > 0 && <Results images={validImages} rejected={job.rejected_count || 0} />}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function EmptyResults() {
  return <div className="flex min-h-[470px] flex-col items-center justify-center text-center"><span className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]"><ScanLine className="size-5 text-slate-500" /></span><p className="text-sm font-semibold text-slate-300">Chưa có kết quả</p><p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">Tải QR và chọn phong cách. Hệ thống tạo 4 ảnh, tự quét và loại những mẫu không đạt.</p></div>;
}

function Results({ images, rejected }: { images: { url: string }[]; rejected: number }) {
  return <div className="space-y-4"><div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-3 text-xs text-emerald-200"><CheckCircle2 className="size-4 shrink-0" /><span><strong>{images.length} mẫu quét đúng</strong>, đã loại {rejected} mẫu không khớp QR gốc.</span></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{images.map((image, index) => <article key={image.url} className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090c12]"><div className="relative aspect-square overflow-hidden"><img src={image.url} alt={`Art QR hợp lệ ${index + 1}`} className="h-full w-full object-cover" /><span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-lg bg-[#07130e]/90 px-2 py-1 text-[10px] font-bold text-emerald-300"><ShieldCheck className="size-3" /> Quét được</span></div><div className="flex items-center justify-between px-3 py-2.5"><span className="text-[11px] font-medium text-slate-400">Mẫu {index + 1}</span><a href={image.url} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.06] hover:text-white"><Download className="size-3.5" /> Tải ảnh</a></div></article>)}</div></div>;
}
