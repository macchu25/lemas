'use client';

import React, { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { CheckCircle2, Download, ImageUp, LoaderCircle, QrCode, RefreshCw, ScanLine, ShieldCheck, Sparkles, UploadCloud, X, XCircle } from 'lucide-react';
import { generatePuterArtQR } from '@/lib/puter';

type StyleID = 'starry-night' | 'cyberpunk' | 'watercolor';
type Result = { url: string; scannable: boolean };

const STYLES: { id: StyleID; name: string; description: string; colors: string[]; prompt: string }[] = [
  { id: 'starry-night', name: 'Starry Night', description: 'Sơn dầu cobalt, bầu trời xoáy và ánh sao vàng.', colors: ['#172554', '#1d4ed8', '#facc15'], prompt: 'Transform this exact QR code into a Van Gogh inspired starry night painting. Preserve every QR finder square, timing pattern, module position and quiet zone exactly. Integrate modules as cobalt architecture, swirling golden stars and oil impasto details. Square centered composition, high contrast, no text, no watermark.' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Khối QR hóa thành cửa sổ và biển neon thành phố đêm.', colors: ['#07131f', '#06b6d4', '#ec4899'], prompt: 'Transform this exact QR code into a cinematic cyberpunk city at night. Preserve every QR finder square, timing pattern, module position and quiet zone exactly. Turn modules into high contrast cyan and magenta windows and city blocks. Square centered composition, no text, no watermark.' },
  { id: 'watercolor', name: 'Watercolor', description: 'Lá, cành và màu nước mềm trên nền giấy ấm.', colors: ['#f5f0e8', '#047857', '#6366f1'], prompt: 'Transform this exact QR code into a delicate botanical watercolor artwork. Preserve every QR finder square, timing pattern, module position and quiet zone exactly. Form modules with dark emerald leaves and indigo pigment on warm paper. Square centered composition, high contrast, no text, no watermark.' },
];

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không thể đọc ảnh')); 
    image.src = source;
  });
}

function readQR(canvas: HTMLCanvasElement): string | null {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' })?.data || null;
}

async function decodeOriginal(source: string): Promise<string> {
  const image = await loadImage(source);
  const canvas = document.createElement('canvas');
  const max = 1400;
  const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const decoded = readQR(canvas);
  if (!decoded) throw new Error('Không tìm thấy QR có thể quét trong ảnh gốc.');
  return decoded;
}

async function blendAndValidate(artURL: string, qrURL: string, expected: string, opacity: number): Promise<Result> {
  const [art, qr] = await Promise.all([loadImage(artURL), loadImage(qrURL)]);
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1024;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Trình duyệt không hỗ trợ Canvas');
  const side = Math.min(art.naturalWidth, art.naturalHeight);
  context.drawImage(art, (art.naturalWidth - side) / 2, (art.naturalHeight - side) / 2, side, side, 0, 0, 1024, 1024);
  context.save();
  context.globalAlpha = opacity;
  context.globalCompositeOperation = 'multiply';
  context.drawImage(qr, 0, 0, 1024, 1024);
  context.restore();
  const decoded = readQR(canvas);
  return { url: canvas.toDataURL('image/png'), scannable: decoded === expected };
}

export default function ArtQrPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectURL = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleID>('starry-night');
  const [dragging, setDragging] = useState(false);
  const [working, setWorking] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (objectURL.current) URL.revokeObjectURL(objectURL.current); }, []);

  const acceptFile = (next?: File) => {
    if (!next) return;
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(next.type)) return setError('Chỉ hỗ trợ ảnh QR PNG, JPG hoặc GIF.');
    if (next.size > 5 * 1024 * 1024) return setError('Ảnh QR phải nhỏ hơn 5 MB.');
    if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    const url = URL.createObjectURL(next);
    objectURL.current = url;
    setFile(next); setPreview(url); setResults([]); setRejected(0); setError(null);
  };

  const clearFile = () => {
    if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    objectURL.current = null;
    setFile(null); setPreview(null); setResults([]); setRejected(0); setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const generate = async () => {
    if (!file || !preview || working) return;
    setWorking(true); setResults([]); setRejected(0); setError(null);
    try {
      const expected = await decodeOriginal(preview);
      const preset = STYLES.find((item) => item.id === style) || STYLES[0];
      const accepted: Result[] = [];
      let failed = 0;
      for (let pass = 1; pass <= 2 && accepted.length < 4; pass++) {
        setAttempt(pass);
        const count = 4 - accepted.length;
        const candidates = await Promise.all(Array.from({ length: count }, async () => {
          const art = await generatePuterArtQR(file, `${preset.prompt} Create a unique variation while retaining the exact QR geometry.`);
          return blendAndValidate(art, preview, expected, pass === 1 ? 0.58 : 0.7);
        }));
        for (const candidate of candidates) {
          if (candidate.scannable) accepted.push(candidate);
          else failed++;
        }
        setResults([...accepted]); setRejected(failed);
      }
      if (!accepted.length) throw new Error('Puter.js đã tạo ảnh nhưng chưa có mẫu nào quét đúng. Hãy dùng QR gốc rõ nét hơn hoặc thử phong cách khác.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo Art QR');
    } finally { setWorking(false); }
  };

  return <div className="h-full w-full overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#090b10] p-3 sm:p-5 lg:p-6"><div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
    <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-3xl"><div className="mb-2 flex items-center gap-2"><QrCode className="size-5 text-emerald-300" /><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Puter.js Image-to-Image</span></div><h1 className="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">AI Art QR Studio</h1><p className="mt-1.5 max-w-[70ch] text-sm leading-6 text-slate-400">Tải QR, chọn phong cách và nhận tác phẩm do Puter.js tạo. Lemas tự quét từng ảnh ngay trên thiết bị và chỉ đánh dấu mẫu giải mã đúng QR gốc.</p></div><div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-[11px] font-medium text-emerald-200"><ShieldCheck className="size-4" /> Không cần Replicate token</div></header>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(400px,1.05fr)]">
      <section className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#0e1118] p-4 sm:p-6">
        <div><div className="mb-2 flex items-center justify-between"><label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><ImageUp className="size-3.5 text-cyan-300" /> 1. Tải QR gốc</label><span className="text-[10px] text-slate-600">PNG, JPG, GIF · tối đa 5 MB</span></div><div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files?.[0]); }} onClick={() => !file && inputRef.current?.click()} className={`relative flex min-h-56 items-center justify-center overflow-hidden rounded-2xl border border-dashed ${file ? 'border-white/10 bg-[#090c12]' : dragging ? 'cursor-copy border-emerald-400/60 bg-emerald-400/[0.07]' : 'cursor-pointer border-white/15 bg-white/[0.02] hover:border-emerald-400/40'}`}><input ref={inputRef} type="file" accept="image/png,image/jpeg,image/gif" onChange={(e: ChangeEvent<HTMLInputElement>) => acceptFile(e.target.files?.[0])} className="sr-only" />{preview ? <><img src={preview} alt="QR gốc" className="max-h-52 max-w-full object-contain p-4" /><button type="button" onClick={(e) => { e.stopPropagation(); clearFile(); }} className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg border border-white/10 bg-[#090c12]/90 text-slate-400 hover:text-white"><X className="size-4" /></button></> : <div className="text-center"><span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"><UploadCloud className="size-5 text-emerald-300" /></span><p className="text-sm font-semibold text-slate-200">Thả ảnh QR vào đây</p><p className="mt-1 text-xs text-slate-500">hoặc bấm để chọn từ thiết bị</p></div>}</div></div>
        <div className="space-y-3 border-t border-white/[0.07] pt-5"><label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><Sparkles className="size-3.5 text-violet-300" /> 2. Chọn phong cách</label><div className="grid gap-2 sm:grid-cols-3">{STYLES.map((item) => { const selected = style === item.id; return <button key={item.id} type="button" onClick={() => { setStyle(item.id); setResults([]); }} className={`relative min-h-32 rounded-xl border p-4 text-left ${selected ? 'border-emerald-400/55 bg-emerald-400/[0.07]' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'}`}><span className="mb-4 flex gap-1.5">{item.colors.map((color) => <i key={color} className="size-5 rounded-full border border-white/10" style={{ background: color }} />)}</span><strong className="block text-sm text-slate-100">{item.name}</strong><span className="mt-1.5 block text-[11px] leading-4 text-slate-500">{item.description}</span>{selected && <CheckCircle2 className="absolute right-3 top-3 size-4 text-emerald-300" />}</button>; })}</div></div>
        <button type="button" onClick={generate} disabled={!file || working} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-extrabold text-[#06110d] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40">{working ? <><LoaderCircle className="size-4 animate-spin" /> Đang tạo và kiểm tra, lần {attempt}/2...</> : <><Sparkles className="size-4" /> Tạo 4 mẫu bằng Puter.js</>}</button>{error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-3.5 py-3 text-xs leading-5 text-rose-200"><XCircle className="size-4 shrink-0" />{error}</div>}
      </section>
      <section className="rounded-2xl border border-white/[0.08] bg-[#0e1118]"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5"><div><h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Kết quả đã xác minh</h2><p className="mt-1 text-[10px] text-slate-600">jsQR kiểm tra trực tiếp trong trình duyệt</p></div>{results.length > 0 && <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">{results.length} mẫu đạt</span>}</div><div className="min-h-[520px] p-4 sm:p-5">{!working && !results.length && <div className="flex min-h-[470px] flex-col items-center justify-center text-center"><ScanLine className="mb-3 size-8 text-slate-600" /><p className="text-sm font-semibold text-slate-300">Chưa có kết quả</p><p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">Puter.js tạo ảnh, Lemas hòa cấu trúc QR và tự kiểm tra trước khi hiển thị.</p></div>}{working && !results.length && <div className="flex min-h-[470px] flex-col items-center justify-center text-center"><LoaderCircle className="mb-4 size-8 animate-spin text-emerald-300" /><p className="text-sm font-semibold text-slate-200">Puter.js đang tạo tác phẩm</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Có thể xuất hiện cửa sổ đăng nhập hoặc xác nhận chi phí của Puter.</p></div>}{results.length > 0 && <div className="space-y-4"><div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-3 text-xs text-emerald-200"><CheckCircle2 className="size-4" /><span><strong>{results.length} mẫu quét đúng</strong>, đã loại {rejected} mẫu không khớp.</span></div><div className="grid gap-3 sm:grid-cols-2">{results.map((item, i) => <article key={i} className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090c12]"><div className="relative aspect-square"><img src={item.url} alt={`Art QR ${i + 1}`} className="h-full w-full object-cover" /><span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-lg bg-[#07130e]/90 px-2 py-1 text-[10px] font-bold text-emerald-300"><ShieldCheck className="size-3" /> Quét được</span></div><div className="flex items-center justify-between px-3 py-2.5"><span className="text-[11px] text-slate-400">Mẫu {i + 1}</span><a href={item.url} download={`lemas-art-qr-${i + 1}.png`} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300"><Download className="size-3.5" /> Tải ảnh</a></div></article>)}</div>{!working && results.length < 4 && <button type="button" onClick={generate} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-slate-200"><RefreshCw className="size-3.5" /> Tạo lại đủ 4 mẫu</button>}</div>}</div></section>
    </div>
  </div></div>;
}
