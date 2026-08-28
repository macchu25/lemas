'use client';

import React, { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, ImageUp, LoaderCircle, QrCode, RefreshCw, ScanLine, ShieldCheck, Sparkles, UploadCloud, X, XCircle } from 'lucide-react';
import { ArtQRJob, ArtQRStyle, createArtQRJob, fetchArtQRJob } from '@/lib/api';

const STYLES: { id: ArtQRStyle; name: string; description: string; colors: string[] }[] = [
  { id: 'starry-night', name: 'Starry Night', description: 'Sơn dầu cobalt, bầu trời xoáy và ánh sao vàng.', colors: ['#172554', '#1d4ed8', '#facc15'] },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Khối QR hóa thành cửa sổ và biển neon thành phố đêm.', colors: ['#07131f', '#06b6d4', '#ec4899'] },
  { id: 'watercolor', name: 'Watercolor', description: 'Lá, cành và màu nước mềm trên nền giấy ấm.', colors: ['#f5f0e8', '#047857', '#6366f1'] },
];

const terminal = new Set(['completed', 'failed']);

export default function ArtQrPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectURL = useRef<string | null>(null);
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
      } catch (reason) {
        if (!stopped) setError(reason instanceof Error ? reason.message : 'Mất kết nối khi kiểm tra tiến trình');
      }
    }, 3500);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [job?.job_id, job?.status]);

  useEffect(() => () => { if (objectURL.current) URL.revokeObjectURL(objectURL.current); }, []);

  const acceptFile = (next?: File) => {
    if (!next) return;
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(next.type)) return setError('Chỉ hỗ trợ ảnh QR PNG, JPG hoặc GIF.');
    if (next.size > 5 * 1024 * 1024) return setError('Ảnh QR phải nhỏ hơn 5 MB.');
    if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    const url = URL.createObjectURL(next);
    objectURL.current = url;
    setFile(next); setPreview(url); setJob(null); setError(null);
  };

  const clearFile = () => {
    if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    objectURL.current = null;
    setFile(null); setPreview(null); setJob(null); setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const generate = async () => {
    if (!file || submitting) return;
    setSubmitting(true); setJob(null); setError(null);
    try { setJob(await createArtQRJob(file, style)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể bắt đầu tạo Art QR'); }
    finally { setSubmitting(false); }
  };

  const working = submitting || (!!job && !terminal.has(job.status));
  const results = job?.images || [];

  return <div className="h-full w-full overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#090b10] p-3 sm:p-5 lg:p-6"><div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
    <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-3xl"><div className="mb-2 flex items-center gap-2"><QrCode className="size-5 text-emerald-300" /><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Hugging Face QR-ControlNet</span></div><h1 className="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">AI Art QR Studio</h1><p className="mt-1.5 max-w-[70ch] text-sm leading-6 text-slate-400">Tải QR, chọn phong cách và để ZeroGPU tạo tác phẩm. Go backend quét từng ảnh và chỉ trả mẫu có payload trùng khớp QR gốc.</p></div><div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-[11px] font-medium text-emerald-200"><ShieldCheck className="size-4" /> Backend verified</div></header>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(400px,1.05fr)]">
      <section className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#0e1118] p-4 sm:p-6">
        <div><div className="mb-2 flex items-center justify-between"><label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><ImageUp className="size-3.5 text-cyan-300" /> 1. Tải QR gốc</label><span className="text-[10px] text-slate-600">PNG, JPG, GIF · tối đa 5 MB</span></div><div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files?.[0]); }} onClick={() => !file && inputRef.current?.click()} className={`relative flex min-h-56 items-center justify-center overflow-hidden rounded-2xl border border-dashed ${file ? 'border-white/10 bg-[#090c12]' : dragging ? 'cursor-copy border-emerald-400/60 bg-emerald-400/[0.07]' : 'cursor-pointer border-white/15 bg-white/[0.02] hover:border-emerald-400/40'}`}><input ref={inputRef} type="file" accept="image/png,image/jpeg,image/gif" onChange={(event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files?.[0])} className="sr-only" />{preview ? <><img src={preview} alt="QR gốc" className="max-h-52 max-w-full object-contain p-4" /><button type="button" onClick={(event) => { event.stopPropagation(); clearFile(); }} className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg border border-white/10 bg-[#090c12]/90 text-slate-400 hover:text-white" aria-label="Xóa QR"><X className="size-4" /></button></> : <div className="text-center"><span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"><UploadCloud className="size-5 text-emerald-300" /></span><p className="text-sm font-semibold text-slate-200">Thả ảnh QR vào đây</p><p className="mt-1 text-xs text-slate-500">hoặc bấm để chọn từ thiết bị</p></div>}</div></div>
        <div className="space-y-3 border-t border-white/[0.07] pt-5"><label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><Sparkles className="size-3.5 text-violet-300" /> 2. Chọn phong cách</label><div className="grid gap-2 sm:grid-cols-3">{STYLES.map((item) => { const selected = style === item.id; return <button key={item.id} type="button" onClick={() => { setStyle(item.id); setJob(null); }} className={`relative min-h-32 rounded-xl border p-4 text-left ${selected ? 'border-emerald-400/55 bg-emerald-400/[0.07]' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'}`}><span className="mb-4 flex gap-1.5">{item.colors.map((color) => <i key={color} className="size-5 rounded-full border border-white/10" style={{ background: color }} />)}</span><strong className="block text-sm text-slate-100">{item.name}</strong><span className="mt-1.5 block text-[11px] leading-4 text-slate-500">{item.description}</span>{selected && <CheckCircle2 className="absolute right-3 top-3 size-4 text-emerald-300" />}</button>; })}</div></div>
        <button type="button" onClick={generate} disabled={!file || working} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-extrabold text-[#06110d] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40">{working ? <><LoaderCircle className="size-4 animate-spin" /> {job?.status === 'validating' ? 'Đang quét kết quả...' : `ZeroGPU đang xử lý, lần ${job?.attempt || 0}/${job?.max_attempts || 2}...`}</> : <><Sparkles className="size-4" /> Tạo 4 mẫu Art QR</>}</button>{error && <Alert message={error} />}
      </section>
      <section className="rounded-2xl border border-white/[0.08] bg-[#0e1118]"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5"><div><h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Kết quả đã xác minh</h2><p className="mt-1 text-[10px] text-slate-600">ZXing so sánh payload với QR gốc</p></div>{results.length > 0 && <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">{results.length} mẫu đạt</span>}</div><div className="min-h-[520px] p-4 sm:p-5">{!working && !job && <Empty />}{working && <Progress job={job} />}{job?.status === 'failed' && results.length === 0 && <Failed message={job.error || 'Không thể tạo Art QR'} retry={generate} />}{(job?.status === 'completed' || results.length > 0) && <Results images={results} rejected={job?.rejected_count || 0} />}</div></section>
    </div>
  </div></div>;
}

function Alert({ message }: { message: string }) { return <div role="alert" className="flex gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-3.5 py-3 text-xs leading-5 text-rose-200"><XCircle className="size-4 shrink-0" />{message}</div>; }
function Empty() { return <div className="flex min-h-[470px] flex-col items-center justify-center text-center"><ScanLine className="mb-3 size-8 text-slate-600" /><p className="text-sm font-semibold text-slate-300">Chưa có kết quả</p><p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">ZeroGPU tạo ảnh, backend quét và tự thử lại khi QR không đạt.</p></div>; }
function Progress({ job }: { job: ArtQRJob | null }) { return <div className="flex min-h-[470px] flex-col items-center justify-center text-center"><LoaderCircle className="mb-4 size-8 animate-spin text-emerald-300" /><p className="text-sm font-semibold text-slate-200">{job?.status === 'queued' ? 'Đang chờ ZeroGPU' : job?.status === 'validating' ? 'Đang xác minh QR' : 'QR-ControlNet đang tạo ảnh'}</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Queue có thể mất vài phút trong giờ cao điểm. Bạn có thể giữ trang này mở để nhận kết quả.</p></div>; }
function Failed({ message, retry }: { message: string; retry: () => void }) { return <div className="flex min-h-[470px] flex-col items-center justify-center text-center"><XCircle className="mb-3 size-9 text-rose-300" /><p className="text-sm font-semibold text-slate-200">Chưa tạo được Art QR</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{message}</p><button type="button" onClick={retry} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-slate-200"><RefreshCw className="size-3.5" /> Thử lại</button></div>; }
function Results({ images, rejected }: { images: { url: string }[]; rejected: number }) { return <div className="space-y-4"><div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-3 text-xs text-emerald-200"><CheckCircle2 className="size-4" /><span><strong>{images.length} mẫu quét đúng</strong>, đã loại {rejected} mẫu không khớp.</span></div><div className="grid gap-3 sm:grid-cols-2">{images.map((item, index) => <article key={item.url} className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090c12]"><div className="relative aspect-square"><img src={item.url} alt={`Art QR ${index + 1}`} className="h-full w-full object-cover" /><span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-lg bg-[#07130e]/90 px-2 py-1 text-[10px] font-bold text-emerald-300"><ShieldCheck className="size-3" /> Quét được</span></div><div className="flex items-center justify-between px-3 py-2.5"><span className="text-[11px] text-slate-400">Mẫu {index + 1}</span><a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300"><Download className="size-3.5" /> Tải ảnh</a></div></article>)}</div></div>; }
