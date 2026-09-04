'use client';

import React, { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  Focus,
  ImageUp,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wand2,
  X,
  XCircle,
} from 'lucide-react';
import ArtQRPlacementEditor from '@/components/dashboard/ArtQRPlacementEditor';
import {
  ArtQRPreset,
  ArtQRJobResponse,
  getArtQRJob,
  getArtQRPresets,
  Placement,
  StyleAnalysis,
  analyzeStyle,
  submitArtQRGeneration,
} from '@/lib/artqr_api';

const DEFAULT_PRESETS: ArtQRPreset[] = [
  {
    id: 'starry-night',
    slug: 'starry-night',
    name: 'Starry Night',
    description: 'Sơn dầu cobalt huyền thoại, bầu trời xoáy và ánh sao vàng rực rỡ',
    preview_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    colors: ['#0b1e3f', '#1d4ed8', '#eab308'],
    prompt: '',
    negative_prompt: '',
    conditioning_scale: 1.35,
    guidance_scale: 7.5,
  },
  {
    id: 'cyberpunk',
    slug: 'cyberpunk',
    name: 'Cyberpunk Metropolis',
    description: 'Thành phố tương lai đêm mưa, biển neon rực rỡ và ánh phản chiếu công nghệ cao',
    preview_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    colors: ['#090d16', '#06b6d4', '#ec4899'],
    prompt: '',
    negative_prompt: '',
    conditioning_scale: 1.38,
    guidance_scale: 7.5,
  },
  {
    id: 'watercolor',
    slug: 'watercolor',
    name: 'Botanical Watercolor',
    description: 'Lá cây ngọc bích, sắc hoa mềm mại trên nền giấy mỹ thuật cổ điển',
    preview_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    colors: ['#fbf9f5', '#047857', '#6366f1'],
    prompt: '',
    negative_prompt: '',
    conditioning_scale: 1.36,
    guidance_scale: 7.0,
  },
  {
    id: 'forest',
    slug: 'forest',
    name: 'Mystic Forest',
    description: 'Rừng sương mù huyền bí, ánh nắng xuyên tán cây cổ thụ',
    preview_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
    colors: ['#061a14', '#15803d', '#ca8a04'],
    prompt: '',
    negative_prompt: '',
    conditioning_scale: 1.35,
    guidance_scale: 7.5,
  },
];

export default function ArtQrPage() {
  const qrInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  // States
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  const [presets, setPresets] = useState<ArtQRPreset[]>(DEFAULT_PRESETS);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('starry-night');

  const [isCustomRef, setIsCustomRef] = useState<boolean>(false);
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);

  const [placement, setPlacement] = useState<Placement>({ x: 0.25, y: 0.25, size: 0.5 });
  const [isDraggingQR, setIsDraggingQR] = useState(false);
  const [isDraggingRef, setIsDraggingRef] = useState(false);

  // Vision Analysis & Editable Prompt
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [styleAnalysis, setStyleAnalysis] = useState<any | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Job Polling
  const [job, setJob] = useState<ArtQRJobResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load presets and default Demo QR on mount
  useEffect(() => {
    getArtQRPresets().then((data) => {
      if (data && data.length > 0) setPresets(data);
    });

    fetch('https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=https://lemas.io.vn')
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'demo_qr.png', { type: 'image/png' });
        setQrFile((prev) => {
          if (!prev) {
            setQrPreview(URL.createObjectURL(file));
            return file;
          }
          return prev;
        });
      })
      .catch(() => {});
  }, []);

  const handleUseDemoQR = async () => {
    try {
      const res = await fetch('https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=https://lemas.io.vn');
      const blob = await res.blob();
      const file = new File([blob], 'demo_qr.png', { type: 'image/png' });
      if (qrPreview) URL.revokeObjectURL(qrPreview);
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
      setJob(null);
      setError(null);
    } catch {
      setError('Không thể tải mã QR mẫu');
    }
  };

  // One request at a time, with bounded retries and cleanup on job changes.
  useEffect(() => {
    if (!job?.job_id || job.status === 'completed' || job.status === 'failed') return;
    const jobID = job.job_id;
    const controller = new AbortController();
    let stopped = false;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout>;
    const stopTracking = (message: string) => {
      if (stopped) return;
      stopped = true;
      controller.abort();
      setError(message);
      setJob(null);
    };
    const deadline = setTimeout(() => stopTracking('Đã chờ quá thời gian. Vui lòng thử lại.'), 8 * 60 * 1000);
    const poll = async () => {
      try {
        const nextJob = await getArtQRJob(jobID, controller.signal);
        if (stopped) return;
        failures = 0;
        setJob(nextJob);
        if (nextJob.status === 'completed' || nextJob.status === 'failed') {
          stopped = true;
          clearTimeout(deadline);
          if (nextJob.status === 'failed') setError(nextJob.error || 'Không tạo được Art QR.');
          return;
        }
      } catch (err: unknown) {
        if (stopped) return;
        failures += 1;
        if (failures >= 5) {
          stopTracking('Không thể kết nối tới máy chủ sau nhiều lần thử.');
          return;
        }
      }
      if (!stopped) {
        timer = setTimeout(poll, 2500);
      }
    };
    timer = setTimeout(poll, 2500);

    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
      clearTimeout(deadline);
    };
  }, [job?.job_id]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (qrPreview) URL.revokeObjectURL(qrPreview);
      if (refPreview) URL.revokeObjectURL(refPreview);
    };
  }, [qrPreview, refPreview]);

  const handleAcceptQR = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
      return setError('Chỉ hỗ trợ ảnh QR PNG, JPG hoặc GIF.');
    }
    if (file.size > 10 * 1024 * 1024) return setError('Ảnh QR phải nhỏ hơn 10 MB.');
    if (qrPreview) URL.revokeObjectURL(qrPreview);

    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
    setJob(null);
    setError(null);
  };

  const handleAcceptRef = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      return setError('Chỉ hỗ trợ ảnh phong cách PNG, JPG hoặc WEBP.');
    }
    if (file.size > 10 * 1024 * 1024) return setError('Ảnh tham khảo phải nhỏ hơn 10 MB.');
    if (refPreview) URL.revokeObjectURL(refPreview);

    setRefFile(file);
    setRefPreview(URL.createObjectURL(file));
    setIsCustomRef(true);
    setError(null);
    setStyleAnalysis(null);

    // Trigger DeepSeek Vision AI analysis
    setIsAnalyzing(true);
    try {
      const res = await analyzeStyle(file, placement);
      setStyleAnalysis(res);
      if (res?.prompt) {
        setCustomPrompt(res.prompt);
      }
    } catch (err: any) {
      console.warn('Vision analysis fallback:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearQR = () => {
    if (qrPreview) URL.revokeObjectURL(qrPreview);
    setQrFile(null);
    setQrPreview(null);
    setJob(null);
    setError(null);
    if (qrInputRef.current) qrInputRef.current.value = '';
  };

  const clearRef = () => {
    if (refPreview) URL.revokeObjectURL(refPreview);
    setRefFile(null);
    setRefPreview(null);
    setIsCustomRef(false);
    setStyleAnalysis(null);
    setCustomPrompt('');
    if (refInputRef.current) refInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (submitting || (job && job.status !== 'completed' && job.status !== 'failed')) return;

    let activeQRFile = qrFile;
    if (!activeQRFile) {
      try {
        const res = await fetch('https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=https://lemas.io.vn');
        const blob = await res.blob();
        activeQRFile = new File([blob], 'demo_qr.png', { type: 'image/png' });
        setQrFile(activeQRFile);
        setQrPreview(URL.createObjectURL(activeQRFile));
      } catch {
        return setError('Vui lòng tải lên ảnh mã QR gốc để bắt đầu.');
      }
    }

    setSubmitting(true);
    setJob(null);
    setError(null);

    try {
      const resp = await submitArtQRGeneration(activeQRFile, {
        referenceFile: isCustomRef ? refFile : null,
        presetId: isCustomRef ? undefined : selectedPresetId,
        customPrompt: isCustomRef && customPrompt ? customPrompt : undefined,
        placement,
      });

      setJob({
        job_id: resp.jobId,
        status: (resp.status as any) || 'queued',
        progress: resp.progress || 10,
      });
    } catch (err: any) {
      setError(err.message || 'Không thể tạo tác vụ Art QR');
    } finally {
      setSubmitting(false);
    }
  };

  const activePreset = presets.find((p) => p.id === selectedPresetId || p.slug === selectedPresetId) || presets[0];
  const editorBackground = isCustomRef && refPreview ? refPreview : activePreset?.preview_url || DEFAULT_PRESETS[0].preview_url;
  const isWorking = submitting || (!!job && job.status !== 'completed' && job.status !== 'failed');
  const results = job?.images?.filter((image) => image.verified) || [];

  return (
    <div className="h-full w-full overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#090b10] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex items-center gap-2">
              <QrCode className="size-5 text-emerald-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                AI Art QR Studio
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">
              Hòa Trộn QR Nghệ Thuật
            </h1>
            <p className="mt-1.5 max-w-[70ch] text-sm leading-6 text-slate-400">
              Biến mã QR thành tranh nghệ thuật bằng công nghệ ControlNet Latent conditioning. Tự động kiểm tra giải mã 100%
              trước khi trả về kết quả.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-2 text-xs font-medium text-emerald-200">
            <ShieldCheck className="size-4" /> Xác minh QR chuẩn máy quét
          </div>
        </header>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.95fr)]">
          {/* Left Column: Flow Steps */}
          <div className="space-y-6">
            {/* Step 1: Upload QR */}
            <section className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#0e1118] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                  <ImageUp className="size-3.5 text-cyan-400" /> 1. Tải lên mã QR gốc
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseDemoQR}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-0.5 text-[10.5px] font-semibold text-emerald-300 hover:bg-emerald-400/15 transition-all"
                  >
                    <Sparkles className="size-3" /> Dùng QR mẫu
                  </button>
                  <span className="text-[10px] text-slate-500">PNG, JPG</span>
                </div>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingQR(true); }}
                onDragLeave={() => setIsDraggingQR(false)}
                onDrop={(e: DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  setIsDraggingQR(false);
                  handleAcceptQR(e.dataTransfer.files?.[0]);
                }}
                onClick={() => !qrFile && qrInputRef.current?.click()}
                className={`relative flex min-h-44 items-center justify-center overflow-hidden rounded-2xl border border-dashed transition-all ${
                  qrFile
                    ? 'border-white/10 bg-[#090c12]'
                    : isDraggingQR
                    ? 'cursor-copy border-emerald-400/60 bg-emerald-400/[0.07]'
                    : 'cursor-pointer border-white/15 bg-white/[0.02] hover:border-emerald-400/40'
                }`}
              >
                <input
                  ref={qrInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleAcceptQR(e.target.files?.[0])}
                  className="sr-only"
                />
                {qrPreview ? (
                  <>
                    <img src={qrPreview} alt="QR gốc" className="max-h-40 max-w-full object-contain p-3" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearQR(); }}
                      className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-lg border border-white/10 bg-[#090c12]/90 text-slate-400 hover:text-white"
                      aria-label="Xóa QR"
                    >
                      <X className="size-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <span className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                      <UploadCloud className="size-5 text-emerald-400" />
                    </span>
                    <p className="text-xs font-semibold text-slate-200">Kéo thả ảnh QR vào đây</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">hoặc bấm để chọn từ thiết bị</p>
                  </div>
                )}
              </div>
            </section>

            {/* Step 2: Choose Preset OR Upload Custom Reference */}
            <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#0e1118] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                  <Sparkles className="size-3.5 text-violet-400" /> 2. Chọn phong cách hoặc ảnh tham khảo
                </label>
                <div className="flex rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
                  <button
                    type="button"
                    onClick={() => setIsCustomRef(false)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      !isCustomRef ? 'bg-emerald-400/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mẫu có sẵn
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomRef(true)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      isCustomRef ? 'bg-violet-400/20 text-violet-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ảnh tùy chọn
                  </button>
                </div>
              </div>

              {!isCustomRef ? (
                /* Preset Cards */
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {presets.map((item) => {
                    const selected = selectedPresetId === item.id || selectedPresetId === item.slug;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedPresetId(item.id)}
                        className={`group relative flex gap-3 rounded-xl border p-3 text-left transition-all ${
                          selected
                            ? 'border-emerald-400/60 bg-emerald-400/[0.08] shadow-[0_0_20px_rgba(52,211,153,0.12)]'
                            : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <img
                          src={item.preview_url}
                          alt={item.name}
                          className="size-16 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <strong className="block truncate text-xs font-bold text-slate-100">{item.name}</strong>
                            {selected && <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />}
                          </div>
                          <p className="mt-1 line-clamp-2 text-[10.5px] leading-4 text-slate-400">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Custom Reference Upload */
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingRef(true); }}
                    onDragLeave={() => setIsDraggingRef(false)}
                    onDrop={(e: DragEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      setIsDraggingRef(false);
                      handleAcceptRef(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => !refFile && refInputRef.current?.click()}
                    className={`relative flex min-h-36 items-center justify-center overflow-hidden rounded-2xl border border-dashed transition-all ${
                      refFile
                        ? 'border-white/10 bg-[#090c12]'
                        : isDraggingRef
                        ? 'cursor-copy border-violet-400/60 bg-violet-400/[0.07]'
                        : 'cursor-pointer border-white/15 bg-white/[0.02] hover:border-violet-400/40'
                    }`}
                  >
                    <input
                      ref={refInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleAcceptRef(e.target.files?.[0])}
                      className="sr-only"
                    />
                    {refPreview ? (
                      <>
                        <img src={refPreview} alt="Ảnh tham khảo" className="max-h-32 max-w-full object-contain p-3" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); clearRef(); }}
                          className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-lg border border-white/10 bg-[#090c12]/90 text-slate-400 hover:text-white"
                          aria-label="Xóa ảnh"
                        >
                          <X className="size-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <span className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                          <Wand2 className="size-5 text-violet-400" />
                        </span>
                        <p className="text-xs font-semibold text-slate-200">Tải ảnh mẫu phong cách riêng</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          GPT-4o Vision AI sẽ tự động phân tích nét vẽ, ánh sáng, chất liệu và bảng màu
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step 2.5: GPT-4o Vision Analysis Feedback & Editable AI Prompt */}
                  {isCustomRef && (refFile || isAnalyzing || styleAnalysis) && (
                    <div className="rounded-xl border border-violet-500/20 bg-gradient-to-b from-violet-950/20 to-slate-950/40 p-3.5 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="size-4 text-violet-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-violet-200">
                            Phân tích thị giác AI (GPT-4o Vision Inspector)
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAnalyzing ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-300 animate-pulse">
                              <LoaderCircle className="size-3.5 animate-spin" /> Đang bóc tách từng chi tiết JSON...
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => refFile && handleAcceptRef(refFile)}
                                className="inline-flex items-center gap-1 rounded-md border border-violet-400/20 bg-violet-400/[0.08] px-2 py-0.5 text-[10.5px] font-semibold text-violet-300 hover:bg-violet-400/15 transition-all"
                              >
                                <Sparkles className="size-3" /> Phân tích lại
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowRawJson(!showRawJson)}
                                className="inline-flex items-center gap-1 rounded-md border border-cyan-400/20 bg-cyan-400/[0.08] px-2 py-0.5 text-[10.5px] font-semibold text-cyan-300 hover:bg-cyan-400/15 transition-all"
                              >
                                {showRawJson ? "Ẩn JSON" : "{ } Xem JSON"}
                              </button>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                <CheckCircle2 className="size-3.5" /> Đã trích xuất
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {styleAnalysis && (
                        <div className="space-y-2 text-[11px]">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-white/[0.03] p-2.5 border border-white/5 space-y-1">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Trường phái & Thể loại:</span>
                              <span className="font-semibold text-slate-200 leading-snug block">{styleAnalysis.style}</span>
                            </div>
                            <div className="rounded-lg bg-white/[0.03] p-2.5 border border-white/5 space-y-1">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Ánh sáng & Phản quang:</span>
                              <span className="font-semibold text-slate-200 leading-snug block">{styleAnalysis.lighting}</span>
                            </div>
                          </div>

                          {styleAnalysis.palette && Array.isArray(styleAnalysis.palette) && styleAnalysis.palette.length > 0 && (
                            <div className="rounded-lg bg-white/[0.03] p-2 border border-white/5 flex items-center justify-between">
                              <span className="text-slate-400 text-[10.5px] font-medium">Bảng màu chủ đạo (Color DNA):</span>
                              <div className="flex items-center gap-1.5">
                                {styleAnalysis.palette.map((color: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                                    <span className="size-3 rounded-full border border-white/20 inline-block" style={{ backgroundColor: color }} />
                                    <span className="text-[9.5px] font-mono text-slate-300">{color}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {showRawJson && (
                            <div className="rounded-lg border border-cyan-500/20 bg-[#050811] p-3 space-y-1.5">
                              <div className="flex items-center justify-between text-[10.5px] text-cyan-300 font-bold">
                                <span>🌲 Chi Tiết Dữ Liệu JSON Forensic (GPT-4o Vision):</span>
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText(JSON.stringify(styleAnalysis, null, 2))}
                                  className="text-xs text-cyan-400 hover:underline"
                                >
                                  Sao chép JSON
                                </button>
                              </div>
                              <pre className="max-h-48 overflow-auto rounded bg-black/60 p-2 font-mono text-[10px] text-emerald-300/90 leading-relaxed border border-white/5">
                                {JSON.stringify(styleAnalysis, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                          <span>✨ Prompt Điều Khiển AI Khắc Nét (Tự động tạo & Tùy chỉnh):</span>
                        </label>
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder={isAnalyzing ? "Đang tạo câu lệnh từ ảnh..." : "Mô tả chi tiết phong cách bạn muốn AI hòa trộn..."}
                          rows={3}
                          className="w-full rounded-lg border border-white/10 bg-[#07090e] p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400/40 leading-relaxed resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Step 3: Interactive Placement Editor */}
            <section>
              <ArtQRPlacementEditor
                imageUrl={editorBackground}
                qrImageUrl={qrPreview}
                placement={placement}
                onPlacementChange={setPlacement}
              />
            </section>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!qrFile || isWorking}
              className="inline-flex h-13 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-sm font-extrabold text-[#05110d] shadow-lg shadow-emerald-500/15 hover:opacity-95 active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isWorking ? (
                <>
                  <LoaderCircle className="size-5 animate-spin" />
                  <span>
                    {job?.status === 'analyzing_style'
                      ? 'xKiro Vision đang phân tích phong cách...'
                      : job?.status === 'validating'
                      ? 'Đang giải mã và đối chiếu payload QR...'
                      : 'Đang tạo tranh QR nghệ thuật...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="size-5" /> Bắt đầu tạo Art QR
                </>
              )}
            </button>

            {error && (
              <div role="alert" className="flex gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-4 py-3 text-xs leading-5 text-rose-200">
                <XCircle className="size-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Right Column: Live Status & Verified Results Gallery */}
          <div className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#0e1118]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Kết quả Art QR</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">Mã hóa Latent Conditioning & xác thực QR 100%</p>
              </div>
              {results.length > 0 && (
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                  {results.length} mẫu đạt chuẩn
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
              {/* State 1: Empty */}
              {!isWorking && !results.length && (
                <div className="flex min-h-[440px] flex-col items-center justify-center text-center p-6">
                  <ScanLine className="mb-3 size-11 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">Chưa có kết quả</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                    Tải QR gốc, tùy chỉnh vùng đặt mã QR trên tranh và bấm tạo để nhận tác phẩm.
                  </p>
                </div>
              )}

              {/* State 2: Progress Tracker */}
              {isWorking && (
                <div className="flex min-h-[440px] flex-col items-center justify-center text-center p-6 space-y-4">
                  <LoaderCircle className="size-11 animate-spin text-emerald-400" />
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      {job?.status === 'decoding'
                        ? 'Đang giải mã QR gốc...'
                        : job?.status === 'analyzing_style'
                        ? 'DeepSeek Vision đang học phong cách...'
                        : job?.status === 'validating'
                        ? 'Đang quét và so sánh dữ liệu mã QR...'
                        : 'ControlNet ZeroGPU đang vẽ tranh...'}
                    </h3>
                    <p className="mt-1 max-w-xs text-xs text-slate-400">
                      Tiến độ: {job?.progress || 20}% · Lần tạo {job?.attempts || 1}/{job?.max_attempts || 4}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full max-w-xs rounded-full bg-white/10 overflow-hidden">
                    <div
                      style={{ width: `${job?.progress || 20}%` }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                    />
                  </div>
                </div>
              )}

              {/* State 3: Completed Results Gallery */}
              {results.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-2.5 text-xs text-emerald-200">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                    <span>
                      <strong>Tác phẩm Art QR đã hoàn thiện & xác thực 100%</strong>. Hãy mở camera điện thoại hoặc Zalo quét thử trực tiếp!
                    </span>
                  </div>

                  {results.length === 1 ? (
                    <article className="group overflow-hidden rounded-2xl border border-emerald-400/30 bg-[#090c12] shadow-2xl shadow-emerald-950/30">
                      <div className="relative aspect-square w-full">
                        <img src={results[0].url} alt="Masterpiece Art QR" className="h-full w-full object-cover" />
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-xl bg-[#07130e]/95 px-3 py-1 text-xs font-bold text-emerald-300 shadow-lg backdrop-blur-md border border-emerald-400/30">
                          <ShieldCheck className="size-4 text-emerald-400" /> QR Verified (100% Scannable)
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-[#0d1017] p-4 border-t border-white/[0.08]">
                        <div>
                          <p className="text-xs font-bold text-slate-200">Tác phẩm Art QR Chất Lượng Cao</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Độ phân giải 1024x1024 · Sẵn sàng chia sẻ & in ấn</p>
                        </div>
                        <a
                          href={results[0].url}
                          target="_blank"
                          rel="noreferrer"
                          download="lemas-art-qr-masterpiece.png"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-2 text-xs font-bold text-[#05110d] shadow-md shadow-emerald-500/10 hover:opacity-95 transition-all"
                        >
                          <Download className="size-4" /> Tải về ảnh gốc
                        </a>
                      </div>
                    </article>
                  ) : (
                    <div className="grid gap-3.5 grid-cols-2">
                      {results.map((item, i) => (
                        <article key={i} className="group overflow-hidden rounded-xl border border-white/[0.08] bg-[#090c12]">
                          <div className="relative aspect-square">
                            <img src={item.url} alt={`Art QR ${i + 1}`} className="h-full w-full object-cover" />
                            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg bg-[#07130e]/90 px-2 py-0.5 text-[10px] font-bold text-emerald-300 backdrop-blur-md">
                              <ShieldCheck className="size-3" /> QR Verified
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-[#0d1017] px-3 py-2">
                            <span className="text-[11px] font-medium text-slate-400">Mẫu #{i + 1}</span>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              download={`lemas-art-qr-${i + 1}.png`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              <Download className="size-3.5" /> Tải về
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {!isWorking && (
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors"
                    >
                      <RefreshCw className="size-3.5" /> Tạo lại mẫu khác
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
