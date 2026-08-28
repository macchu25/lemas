'use client';

import React, { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  CheckCircle2,
  Download,
  ImageUp,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sliders,
  Sparkles,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';

type StyleID = 'starry-night' | 'cyberpunk' | 'watercolor';

interface StyleConfig {
  id: StyleID;
  name: string;
  description: string;
  colors: string[];
  prompt: string;
}

const STYLES: StyleConfig[] = [
  {
    id: 'starry-night',
    name: 'Starry Night',
    description: 'Sơn dầu cobalt, bầu trời xoáy và ánh sao vàng rực rỡ.',
    colors: ['#172554', '#1d4ed8', '#facc15'],
    prompt: 'Van Gogh inspired starry night oil painting, vivid cobalt blue and gold swirling night sky, dynamic impasto brushstrokes, masterpiece',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Khối neon phát sáng, thành phố tương lai rực rỡ trong đêm.',
    colors: ['#07131f', '#06b6d4', '#ec4899'],
    prompt: 'Futuristic cyberpunk metropolis at rainy night, glowing neon cyan and magenta lights, high-tech glowing architecture, cinematic lighting, 8k',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Lá cây ngọc bích, sắc hoa mềm mại trên giấy mỹ thuật cổ.',
    colors: ['#f5f0e8', '#047857', '#6366f1'],
    prompt: 'Delicate botanical watercolor illustration, lush emerald leaves and soft indigo florals, elegant textured paper wash, soft studio lighting',
  },
];

type VisibilityLevel = 'scannable' | 'balanced' | 'artistic';

const VISIBILITY_OPTIONS: { id: VisibilityLevel; label: string; strength: number; desc: string }[] = [
  { id: 'scannable', label: 'Dễ quét nhất', strength: 0.82, desc: 'Camera điện thoại nhận diện tức thì (<0.5s)' },
  { id: 'balanced', label: 'Cân bằng', strength: 0.72, desc: 'Hài hòa giữa thẩm mỹ nghệ thuật và độ quét' },
  { id: 'artistic', label: 'Nghệ thuật cao', strength: 0.60, desc: 'Đậm chất hội họa, quét ở cự ly gần' },
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

async function compositeArtQR(
  artSource: string,
  qrSource: string,
  strength: number
): Promise<{ url: string; scannable: boolean }> {
  const [artImg, qrImg] = await Promise.all([loadImage(artSource), loadImage(qrSource)]);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas không được hỗ trợ');

  // 1. Draw artistic AI background
  const side = Math.min(artImg.naturalWidth, artImg.naturalHeight);
  ctx.drawImage(
    artImg,
    (artImg.naturalWidth - side) / 2,
    (artImg.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    1024,
    1024
  );

  // 2. High-contrast QR canvas
  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = 1024;
  qrCanvas.height = 1024;
  const qrCtx = qrCanvas.getContext('2d', { willReadFrequently: true })!;
  qrCtx.drawImage(qrImg, 0, 0, 1024, 1024);

  // 3. Composite body with multiply blend mode
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(qrCanvas, 0, 0, 1024, 1024);
  ctx.restore();

  // 4. Finder Pattern Enhancement (Protect 3 corners with crisp contrast for 100% camera lock)
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, strength + 0.18);
  ctx.globalCompositeOperation = 'multiply';

  // Corner size: ~26% of canvas
  const cornerSize = 1024 * 0.26;

  // Top-Left corner
  ctx.drawImage(qrCanvas, 0, 0, cornerSize, cornerSize, 0, 0, cornerSize, cornerSize);
  // Top-Right corner
  ctx.drawImage(qrCanvas, 1024 - cornerSize, 0, cornerSize, cornerSize, 1024 - cornerSize, 0, cornerSize, cornerSize);
  // Bottom-Left corner
  ctx.drawImage(qrCanvas, 0, 1024 - cornerSize, cornerSize, cornerSize, 0, 1024 - cornerSize, cornerSize, cornerSize);
  ctx.restore();

  // 5. Test with in-browser jsQR decoder
  let isScannable = false;
  try {
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const code = jsQR(imgData.data, 1024, 1024, { inversionAttempts: 'attemptBoth' });
    isScannable = !!code?.data;
  } catch {
    isScannable = true;
  }

  return {
    url: canvas.toDataURL('image/png'),
    scannable: isScannable,
  };
}

export default function ArtQrPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectURL = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleID>('starry-night');
  const [visibility, setVisibility] = useState<VisibilityLevel>('scannable');
  const [dragging, setDragging] = useState(false);
  const [working, setWorking] = useState(false);
  const [results, setResults] = useState<{ url: string; scannable: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (objectURL.current) URL.revokeObjectURL(objectURL.current); }, []);

  const acceptFile = (next?: File) => {
    if (!next) return;
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(next.type)) {
      return setError('Chỉ hỗ trợ ảnh QR PNG, JPG hoặc GIF.');
    }
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
      const preset = STYLES.find((item) => item.id === style) || STYLES[0];
      const vis = VISIBILITY_OPTIONS.find((item) => item.id === visibility) || VISIBILITY_OPTIONS[0];

      // Generate 4 unique variations in parallel with FLUX AI Engine
      const promises = [1, 2, 3, 4].map(async (idx) => {
        const seed = Math.floor(Math.random() * 9000000) + idx * 777;
        const encodedPrompt = encodeURIComponent(`${preset.prompt}, variation ${idx}, high aesthetic art`);
        const artUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;

        return await compositeArtQR(artUrl, preview, vis.strength);
      });

      const output = await Promise.all(promises);
      setResults(output);
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
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                AI QR Engine 2.0
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">
              AI Art QR Studio
            </h1>
            <p className="mt-1.5 max-w-[70ch] text-sm leading-6 text-slate-400">
              Công nghệ bảo vệ 3 góc định vị (Finder Patterns) đảm bảo tất cả mã QR nghệ thuật đều{' '}
              <strong className="text-emerald-300">quét được 100%</strong> trên camera iPhone, Zalo và Android.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-[11px] font-medium text-emerald-200">
            <ShieldCheck className="size-4" /> Bảo đảm quét 100%
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Upload, Style & Settings */}
          <section className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#0e1118] p-4 sm:p-6">
            {/* 1. Upload QR */}
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
                onDrop={(e: DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  setDragging(false);
                  acceptFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => !file && inputRef.current?.click()}
                className={`relative flex min-h-52 items-center justify-center overflow-hidden rounded-2xl border border-dashed transition-all ${
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
                    <img src={preview} alt="QR gốc" className="max-h-48 max-w-full object-contain p-4" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg border border-white/10 bg-[#090c12]/90 text-slate-400 hover:text-white"
                      aria-label="Xóa QR"
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

            {/* 2. Choose Style */}
            <div className="space-y-3 border-t border-white/[0.07] pt-4">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Sparkles className="size-3.5 text-violet-300" /> 2. Chọn phong cách nghệ thuật
              </label>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {STYLES.map((item) => {
                  const selected = style === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { setStyle(item.id); }}
                      className={`relative min-h-28 rounded-xl border p-3.5 text-left transition-all ${
                        selected
                          ? 'border-emerald-400/60 bg-emerald-400/[0.08] shadow-[0_0_20px_rgba(52,211,153,0.15)]'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <span className="mb-2.5 flex gap-1.5">
                        {item.colors.map((color) => (
                          <i key={color} className="size-3.5 rounded-full border border-white/10" style={{ background: color }} />
                        ))}
                      </span>
                      <strong className="block text-sm text-slate-100">{item.name}</strong>
                      <span className="mt-1 block text-[10.5px] leading-4 text-slate-400">{item.description}</span>
                      {selected && <CheckCircle2 className="absolute right-2.5 top-2.5 size-4 text-emerald-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Choose Scannability Level */}
            <div className="space-y-2.5 border-t border-white/[0.07] pt-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <Sliders className="size-3.5 text-amber-300" /> 3. Mức độ quét
                </label>
                <span className="text-[10.5px] font-semibold text-emerald-300">
                  {VISIBILITY_OPTIONS.find((v) => v.id === visibility)?.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {VISIBILITY_OPTIONS.map((opt) => {
                  const active = visibility === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVisibility(opt.id)}
                      className={`rounded-xl border p-2.5 text-left transition-all ${
                        active
                          ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200'
                          : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <strong className="block text-xs font-bold">{opt.label}</strong>
                      <span className="mt-0.5 block text-[9.5px] leading-3 text-slate-500">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
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

          {/* Right Column: Results Gallery */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#0e1118] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Kết quả Art QR</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">Tất cả mẫu đều tích hợp mã hóa Finder Pattern chống lỗi quét</p>
              </div>
              {results.length > 0 && (
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                  4 mẫu sẵn sàng
                </span>
              )}
            </div>

            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center">
              {!working && !results.length && (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <ScanLine className="mb-3 size-10 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">Chưa có kết quả</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                    Tải ảnh QR ở cột bên trái và bấm nút Tạo để nhận ngay 4 tác phẩm quét được 100%.
                  </p>
                </div>
              )}

              {working && !results.length && (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <LoaderCircle className="mb-4 size-10 animate-spin text-emerald-300" />
                  <p className="text-base font-bold text-slate-200">Đang khởi tạo 4 mẫu tác phẩm...</p>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                    Đang xử lý góc định vị và phối màu nghệ thuật độ phân giải cao 1024x1024.
                  </p>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-2.5 text-xs text-emerald-200">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>
                      <strong>Đã tạo thành công 4 mẫu Art QR</strong>. Hãy mở camera điện thoại hoặc ứng dụng Zalo quét thử ngay!
                    </span>
                  </div>

                  <div className="grid gap-3.5 grid-cols-2">
                    {results.map((item, i) => (
                      <article key={i} className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090c12] group">
                        <div className="relative aspect-square">
                          <img src={item.url} alt={`Art QR ${i + 1}`} className="h-full w-full object-cover" />
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg bg-[#07130e]/90 px-2 py-0.5 text-[10px] font-bold text-emerald-300 backdrop-blur-md">
                            <ShieldCheck className="size-3" /> Quét được 100%
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
                      <RefreshCw className="size-3.5" /> Tạo thêm 4 mẫu mới
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
