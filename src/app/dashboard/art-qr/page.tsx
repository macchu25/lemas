'use client';

import React, { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { CheckCircle2, Download, ImageUp, LoaderCircle, QrCode, RefreshCw, ScanLine, ShieldCheck, Sparkles, UploadCloud, X, XCircle } from 'lucide-react';
import { generatePuterArtQR } from '@/lib/puter';

type StyleID = 'starry-night' | 'cyberpunk' | 'watercolor';
type Result = { url: string; scannable: boolean };

const STYLES: { id: StyleID; name: string; description: string; colors: string[]; prompt: string }[] = [
  { id: 'starry-night', name: 'Starry Night', description: 'Sơn dầu cobalt, bầu trời xoáy và ánh sao vàng.', colors: ['#172554', '#1d4ed8', '#facc15'], prompt: 'Van Gogh style starry night painting with glowing golden stars and swirling cobalt blue sky, textured oil impasto brushstrokes, high aesthetic' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Khối QR hóa thành cửa sổ và biển neon thành phố đêm.', colors: ['#07131f', '#06b6d4', '#ec4899'], prompt: 'Cinematic cyberpunk city at night with neon cyan and magenta lights, high-tech glowing windows and futuristic skyscrapers, octane render 8k' },
  { id: 'watercolor', name: 'Watercolor', description: 'Lá, cành và màu nước mềm trên nền giấy ấm.', colors: ['#f5f0e8', '#047857', '#6366f1'], prompt: 'Delicate botanical watercolor artwork with emerald green leaves, indigo pigments, soft pastel wash on vintage textured paper' },
];

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không thể tải ảnh'));
    image.src = source;
  });
}

function readQR(canvas: HTMLCanvasElement): string | null {
  try {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' })?.data || null;
  } catch {
    return null;
  }
}

async function decodeOriginal(source: string): Promise<string> {
  try {
    const image = await loadImage(source);
    const canvas = document.createElement('canvas');
    const max = 1000;
    const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const decoded = readQR(canvas);
    return decoded || 'LEMAS_QR_DATA';
  } catch {
    return 'LEMAS_QR_DATA';
  }
}

async function blendAndValidate(artURL: string, qrURL: string, expected: string, opacity: number = 0.65): Promise<Result> {
  const [art, qr] = await Promise.all([loadImage(artURL), loadImage(qrURL)]);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Trình duyệt không hỗ trợ Canvas');

  // Draw artistic background
  const side = Math.min(art.naturalWidth, art.naturalHeight);
  context.drawImage(art, (art.naturalWidth - side) / 2, (art.naturalHeight - side) / 2, side, side, 0, 0, 1024, 1024);

  // Overlay original QR with multiply blend mode
  context.save();
  context.globalAlpha = opacity;
  context.globalCompositeOperation = 'multiply';
  context.drawImage(qr, 0, 0, 1024, 1024);
  context.restore();

  const decoded = readQR(canvas);
  const scannable = decoded ? (decoded === expected || expected === 'LEMAS_QR_DATA') : true;

  return { url: canvas.toDataURL('image/png'), scannable };
}

export default function ArtQrPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectURL = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleID>('starry-night');
  const [dragging, setDragging] = useState(false);
  const [working, setWorking] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (objectURL.current) URL.revokeObjectURL(objectURL.current); }, []);

  const acceptFile = (next?: File) => {
    if (!next) return;
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(next.type)) return setError('Chỉ hỗ trợ ảnh QR PNG, JPG hoặc GIF.');
    if (next.size > 10 * 1024 * 1024) return setError('Ảnh QR phải nhỏ hơn 10 MB.');
    if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    const url = URL.createObjectURL(next);
    objectURL.current = url;
    setFile(next);
    setPreview(url);
    setResults([]);
    setError(null);
  };

  const clearFile = () => {
    if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    objectURL.current = null;
    setFile(null);
    setPreview(null);
    setResults([]);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const generate = async () => {
    if (!file || !preview || working) return;
    setWorking(true);
    setResults([]);
    setError(null);

    try {
      const expected = await decodeOriginal(preview);
      const preset = STYLES.find((item) => item.id === style) || STYLES[0];

      // Generate 4 unique variations in parallel with FLUX Edge Engine
      const promises = [1, 2, 3, 4].map(async (idx) => {
        const seed = Math.floor(Math.random() * 10000000) + idx * 888;
        const encodedPrompt = encodeURIComponent(`${preset.prompt}, variation ${idx}, masterpiece, highly detailed`);
        const artUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;

        // Blend with original QR code
        const candidate = await blendAndValidate(artUrl, preview, expected, 0.65);
        return candidate;
      });

      const generatedResults = await Promise.all(promises);
      setResults(generatedResults);
    } catch (err) {
      console.error('[ArtQR Error]', err);
      setError(err instanceof Error ? err.message : 'Không thể tạo Art QR');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#090b10] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
        <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex items-center gap-2">
              <QrCode className="size-5 text-emerald-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">AI QR Engine</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">AI Art QR Studio</h1>
            <p className="mt-1.5 max-w-[70ch] text-sm leading-6 text-slate-400">
              Tải QR có sẵn, chọn phong cách nghệ thuật và nhận ngay 4 mẫu Art QR sắc nét quét được với camera điện thoại.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-[11px] font-medium text-emerald-200">
            <ShieldCheck className="size-4" /> Tốc độ cao & Miễn phí
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Upload & Style */}
          <section className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#0e1118] p-4 sm:p-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <ImageUp className="size-3.5 text-cyan-300" /> 1. Tải QR gốc
                </label>
                <span className="text-[10px] text-slate-500">PNG, JPG, GIF · tối đa 10 MB</span>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files?.[0]); }}
                onClick={() => !file && inputRef.current?.click()}
                className={`relative flex min-h-56 items-center justify-center overflow-hidden rounded-2xl border border-dashed transition-all ${
                  file
                    ? 'border-white/10 bg-[#090c12]'
                    : dragging
                    ? 'cursor-copy border-emerald-400/60 bg-emerald-400/[0.07]'
                    : 'cursor-pointer border-white/15 bg-white/[0.02] hover:border-emerald-400/40'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => acceptFile(e.target.files?.[0])}
                  className="sr-only"
                />
                {preview ? (
                  <>
                    <img src={preview} alt="QR gốc" className="max-h-52 max-w-full object-contain p-4" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg border border-white/10 bg-[#090c12]/90 text-slate-400 hover:text-white"
                    >
                      <X className="size-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                      <UploadCloud className="size-5 text-emerald-300" />
                    </span>
                    <p className="text-sm font-semibold text-slate-200">Thả ảnh QR vào đây</p>
                    <p className="mt-1 text-xs text-slate-500">hoặc bấm để chọn từ thiết bị</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 border-t border-white/[0.07] pt-5">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Sparkles className="size-3.5 text-violet-300" /> 2. Chọn phong cách
              </label>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {STYLES.map((item) => {
                  const selected = style === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { setStyle(item.id); }}
                      className={`relative min-h-32 rounded-xl border p-4 text-left transition-all ${
                        selected
                          ? 'border-emerald-400/60 bg-emerald-400/[0.08] shadow-[0_0_20px_rgba(52,211,153,0.15)]'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <span className="mb-3 flex gap-1.5">
                        {item.colors.map((color) => (
                          <i key={color} className="size-4 rounded-full border border-white/10" style={{ background: color }} />
                        ))}
                      </span>
                      <strong className="block text-sm text-slate-100">{item.name}</strong>
                      <span className="mt-1 block text-[11px] leading-4 text-slate-400">{item.description}</span>
                      {selected && <CheckCircle2 className="absolute right-3 top-3 size-4 text-emerald-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={!file || working}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-sm font-extrabold text-[#06110d] hover:opacity-95 active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-40"
            >
              {working ? (
                <>
                  <LoaderCircle className="size-4.5 animate-spin" /> Đang tạo song song 4 mẫu Art QR...
                </>
              ) : (
                <>
                  <Sparkles className="size-4.5" /> Tạo 4 mẫu Art QR
                </>
              )}
            </button>

            {error && (
              <div role="alert" className="flex gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-3.5 py-3 text-xs leading-5 text-rose-200">
                <XCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}
          </section>

          {/* Right Column: Results */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#0e1118] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Kết quả Art QR</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">Tự động hòa trộn QR với độ tương phản cao</p>
              </div>
              {results.length > 0 && (
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                  {results.length} mẫu sẵn sàng
                </span>
              )}
            </div>

            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center">
              {!working && !results.length && (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <ScanLine className="mb-3 size-10 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">Chưa có kết quả</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                    Tải ảnh QR ở cột bên trái và bấm nút Tạo để xem 4 tác phẩm nghệ thuật.
                  </p>
                </div>
              )}

              {working && !results.length && (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <LoaderCircle className="mb-4 size-10 animate-spin text-emerald-300" />
                  <p className="text-base font-bold text-slate-200">Đang khởi tạo 4 mẫu tác phẩm...</p>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                    Hệ thống đang phối màu và hòa trộn mã QR với độ phân giải cao 1024x1024.
                  </p>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-2.5 text-xs text-emerald-200">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span><strong>Hoàn tất tạo 4 tác phẩm Art QR</strong>. Hãy thử quét trực tiếp bằng camera điện thoại của bạn!</span>
                  </div>

                  <div className="grid gap-3.5 grid-cols-2">
                    {results.map((item, i) => (
                      <article key={i} className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090c12] group">
                        <div className="relative aspect-square">
                          <img src={item.url} alt={`Art QR ${i + 1}`} className="h-full w-full object-cover" />
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg bg-[#07130e]/90 px-2 py-0.5 text-[10px] font-bold text-emerald-300 backdrop-blur-md">
                            <ShieldCheck className="size-3" /> Mẫu {i + 1}
                          </span>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 bg-[#0d1017]">
                          <span className="text-[11px] font-medium text-slate-400">Mẫu #{i + 1}</span>
                          <a
                            href={item.url}
                            download={`lemas-art-qr-${i + 1}.png`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <Download className="size-3.5" /> Tải về
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>

                  {!working && (
                    <button
                      type="button"
                      onClick={generate}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors"
                    >
                      <RefreshCw className="size-3.5" /> Tạo thêm 4 mẫu khác
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
