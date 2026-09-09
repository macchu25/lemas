'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  Download,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  Layers,
  Zap,
  AlertCircle,
  CheckCircle2,
  Crop,
  FileCheck,
  CheckCheck,
  ScanLine,
  Flame,
  ShieldCheck,
  Wand2,
  ArrowRight,
  ArrowLeft,
  Coins,
  Cpu,
  Palette,
  Lock,
  Upload,
  Waves,
  History,
  Trash2,
  ExternalLink,
  Eye,
} from 'lucide-react';
import {
  processQRTransparency,
  getSampleQR,
  QRTransResponse,
  API_BASE,
} from '@/lib/api';
import {
  getArtQRPresets,
  submitArtQRGeneration,
  ArtQRPreset,
  ArtQRResult,
  getPresetAssetUrl,
  getUserArtQRHistory,
  deleteUserArtQRHistory,
  UserArtQRHistoryItem,
} from '@/lib/artqr_api';
import { useDashboard } from '@/components/dashboard/DashboardContext';
import WavyQRControlNet from '@/components/dashboard/WavyQRControlNet';

export default function ArtQRStudioPage() {
  const { user, refreshData, setTopupModalOpen } = useDashboard();
  const isPaidPlan = user?.plan === 'pro' || user?.plan === 'vip' || user?.plan === 'extra' || user?.plan === 'pro-plus' || user?.plan === 'max' || user?.plan === 'ultra' || user?.plan === 'power';

  // Prevent hydration mismatch
  const [mounted, setMounted] = useState<boolean>(false);

  // View mode: 'catalog' | 'generator' | 'wavy_controlnet' | 'transparency_tool' | 'history'
  const [viewMode, setViewMode] = useState<'catalog' | 'generator' | 'wavy_controlnet' | 'transparency_tool' | 'history'>('catalog');

  // History state (Bộ sưu tập riêng của từng user)
  const [history, setHistory] = useState<UserArtQRHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<UserArtQRHistoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string>('');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom reference scene
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string>('/presets/doraemon_bread_scene.jpg');
  const refInputRef = useRef<HTMLInputElement>(null);

  // Presets list
  const [presets, setPresets] = useState<ArtQRPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('bread_toast');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Transparency background removal state (Mandatory automatic step 1)
  const [cleanQRResult, setCleanQRResult] = useState<QRTransResponse | null>(null);
  const [transparencyProcessing, setTransparencyProcessing] = useState<boolean>(false);

  // Transparency tool extra settings (Tự động cắt sát viền QR)
  const [cropMode, setCropMode] = useState<'none' | 'crop' | 'mask'>('crop');
  const [useOtsu, setUseOtsu] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(215);
  const [validateQR, setValidateQR] = useState<boolean>(true);
  const [bgPreview, setBgPreview] = useState<'checker' | 'white' | 'dark'>('checker');

  // Art QR Generation state
  const [generating, setGenerating] = useState<boolean>(false);
  const [artQRResult, setArtQRResult] = useState<ArtQRResult | null>(null);
  const [artQRError, setArtQRError] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Feedback copy state
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const items = await getUserArtQRHistory();
      setHistory(items);
    } catch {
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa tác phẩm Art QR này khỏi bộ sưu tập?')) return;
    setDeletingId(id);
    const ok = await deleteUserArtQRHistory(id);
    if (ok) {
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (selectedHistoryItem?.id === id) {
        setSelectedHistoryItem(null);
      }
    }
    setDeletingId(null);
  };

  useEffect(() => {
    setMounted(true);
    // Fetch presets from API
    getArtQRPresets().then((res) => {
      if (res && res.length > 0) {
        setPresets(res);
      }
    });

    // Load user Art QR creation history
    loadHistory();

    // Check query params if preset was requested directly
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const presetParam = urlParams.get('preset');
      if (presetParam) {
        setSelectedPresetId(presetParam);
        setViewMode('generator');
      }
    } catch (_) {}
  }, []);

  // When user selects a preset from the Style Gallery
  const handleSelectPresetAndProceed = (preset: ArtQRPreset) => {
    setSelectedPresetId(preset.id);
    setReferenceFile(null);
    if (preset.reference_image_url) {
      setReferencePreview(getPresetAssetUrl(preset.reference_image_url));
    } else if (preset.preview_url) {
      setReferencePreview(getPresetAssetUrl(preset.preview_url));
    }
    setViewMode('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCustomRefUpload = (file: File) => {
    setReferenceFile(file);
    const objUrl = URL.createObjectURL(file);
    setReferencePreview(objUrl);
  };

  // Process uploaded QR file - AUTOMATICALLY runs existing QR background removal immediately
  const handleQRFileSelected = async (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewURL(objectUrl);
    setArtQRError('');
    setArtQRResult(null);

    // Mandatory Step: Execute existing QR background removal and tight crop automatically
    setTransparencyProcessing(true);
    try {
      const opts = {
        threshold: useOtsu ? 0 : threshold,
        crop_mode: 'crop' as const,
        validate: validateQR,
      };
      const res = await processQRTransparency(file, opts);
      if (res && res.success) {
        setCleanQRResult(res);
      }
    } catch (err: unknown) {
      console.warn('Auto background removal notice:', err);
    } finally {
      setTransparencyProcessing(false);
    }
  };

  // Load sample QR for instant demonstration
  const handleLoadSample = async () => {
    try {
      setTransparencyProcessing(true);
      setArtQRError('');
      const data = await getSampleQR('https://nornai.com/art-qr-studio', 400);
      if (data && data.success && data.data_url) {
        const res = await fetch(data.data_url);
        const blob = await res.blob();
        const file = new File([blob], 'sample_qr_demo.png', { type: 'image/png' });
        await handleQRFileSelected(file);
      }
    } catch {
      setArtQRError('Không thể tải ảnh mẫu từ máy chủ.');
      setTransparencyProcessing(false);
    }
  };

  // Reference scene handler
  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReferenceFile(file);
      setReferencePreview(URL.createObjectURL(file));
    }
  };

  // File drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleQRFileSelected(e.dataTransfer.files[0]);
    }
  };

  // Generate Art QR
  const handleGenerateArtQR = async () => {
    if (!selectedFile) {
      setArtQRError('Vui lòng chọn hoặc tải lên ảnh mã QR trước!');
      return;
    }

    setGenerating(true);
    setArtQRError('');
    setArtQRResult(null);
    setCurrentStep(1);

    const timer1 = setTimeout(() => setCurrentStep(2), 300);
    const timer2 = setTimeout(() => setCurrentStep(3), 600);
    const timer3 = setTimeout(() => setCurrentStep(4), 1200);

    let uploadFile = selectedFile;
    if (cleanQRResult?.dataUrl?.includes(',')) {
      try {
        const binStr = atob(cleanQRResult.dataUrl.split(',', 2)[1]);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        uploadFile = new File([bytes], 'clean_cropped_qr.png', { type: 'image/png' });
      } catch (_) {}
    }

    try {
      // Step 1: Submit job (fast, returns jobId immediately)
      const submission = await submitArtQRGeneration(uploadFile, {
        presetId: selectedPresetId,
        referenceFile: referenceFile,
        placement: {
          x: 0.41,
          y: 0.28,
          size: 0.30,
        },
      });

      const jobId = submission.jobId;

      // Step 2: Poll every 3s until completed or failed (max 5 minutes = 100 polls)
      const maxPolls = 100;
      let pollCount = 0;
      let done = false;

      while (!done && pollCount < maxPolls) {
        await new Promise((r) => setTimeout(r, 3000)); // wait 3s
        pollCount++;

        const jobRes = await fetch(`${API_BASE}/api/art-qr/jobs/${encodeURIComponent(jobId)}`, {
          cache: 'no-store',
        });

        if (!jobRes.ok) continue;

        const job = await jobRes.json();

        if (job.status === 'completed' && job.images?.length > 0) {
          done = true;
          const img = job.images[0];
          setCurrentStep(5);
          setArtQRResult({
            success: true,
            image: img.data_url || img.url,
            expected_payload: job.original_payload,
            decoded_payload: img.decoded_payload || job.decoded_payload || '',
            qr_valid: img.verified === true,
            preset: job.preset_id || selectedPresetId,
            background_removed: job.background_removed ?? false,
            fallback_mode: job.fallback_mode ?? false,
            retry_count: job.attempts ?? 0,
            processing_ms: job.processing_ms ?? 0,
          });
          refreshData();
          loadHistory();
        } else if (job.status === 'failed') {
          done = true;
          setArtQRError(job.error || 'Tạo Art QR thất bại. Vui lòng thử lại.');
        }
        // else: still generating, continue polling
      }

      if (!done) {
        setArtQRError('Hết thời gian chờ (5 phút). Hệ thống tạo ảnh AI đang tải. Vui lòng thử lại.');
      }
    } catch (err: unknown) {
      setArtQRError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ Art QR');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setGenerating(false);
    }
  };

  // Clipboard Paste (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              handleQRFileSelected(file);
              break;
            }
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useOtsu, threshold, cropMode, validateQR]);

  // Copy Payload
  const handleCopyPayload = () => {
    const text = artQRResult?.decoded_payload || cleanQRResult?.outputPayload || '';
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Download Output
  const handleDownloadOutput = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy image to clipboard
  const handleCopyImage = async (dataUrl: string) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch {
      navigator.clipboard.writeText(dataUrl);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    }
  };

  if (!mounted) {
    return (
      <div className="h-full w-full rounded-2xl border border-white/[0.08] bg-[#0a0c12] p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <RefreshCw className="size-4 animate-spin text-amber-400" />
          <span>Đang tải Art QR Studio...</span>
        </div>
      </div>
    );
  }

  const selectedPreset = presets.find((p) => p.id === selectedPresetId || p.slug === selectedPresetId);

  return (
    <div className="h-full w-full rounded-2xl border border-white/[0.08] overflow-y-auto bg-[#0a0c12] shadow-2xl p-3 sm:p-5 lg:p-6 relative">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Top Header */}
        <div className="bg-[#0c1017]/90 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-xl bg-gradient-to-tr from-amber-500/25 to-rose-500/25 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <Wand2 className="size-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>Art QR Studio • Tạo QR Nghệ Thuật Chuẩn Quét 100%</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-500/30">
                    Deterministic Restoration
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Chọn phong cách chất liệu, tự động bóc tách nền QR và kết hợp MachGen bảo toàn chính xác cấu trúc module
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs & Wallet Balance */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs font-semibold shrink-0 flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setViewMode('catalog')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'catalog'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="size-3.5" />
                <span>Kho Phong Cách</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('generator')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'generator'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="size-3.5" />
                <span>Phòng Tạo Mã</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('wavy_controlnet')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'wavy_controlnet'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-cyan-400 hover:text-white'
                }`}
              >
                <Waves className="size-3.5" />
                <span>Uốn Lượn ControlNet</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('transparency_tool')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'transparency_tool'
                    ? 'bg-slate-800 text-white font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="size-3.5 text-slate-300" />
                <span>Tách Nền QR</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('history');
                  loadHistory();
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'history'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-emerald-400 hover:text-white'
                }`}
              >
                <History className="size-3.5" />
                <span>Bộ Sưu Tập ({history.length})</span>
              </button>
            </div>

            {/* Live Balance & Quota Notice */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 rounded-xl px-3 py-1.5 text-xs">
              <Coins className="size-3.5 text-amber-400" />
              {isPaidPlan ? (
                <span className="text-emerald-400 font-bold">Gói {user?.plan?.toUpperCase()} • Không giới hạn</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">Ví: <strong className="text-amber-400">${(user?.balance || 0).toFixed(2)}</strong></span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">($0.05/lượt)</span>
                  <button
                    type="button"
                    onClick={() => setTopupModalOpen(true)}
                    className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold transition-all"
                  >
                    Nạp
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VIEW 1: TRANG CHỌN PHONG CÁCH (STYLE GALLERY / CATALOG) */}
        {viewMode === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c1017]/60 border border-slate-800/60 rounded-2xl p-4">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Kho Phong Cách & Chất Liệu Tự Nhiên</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({presets.length} phong cách độc quyền)
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Bấm vào phong cách bất kỳ dưới đây để chuyển sang phòng tạo ảnh với thông số chuẩn đã thiết lập sẵn.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('generator')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 flex items-center gap-1.5 shrink-0 transition-all shadow-md"
              >
                <span>Vào phòng tạo ảnh</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>

            {/* Presets List: Mỗi phong cách là 1 dòng riêng biệt (Full-width Banner Row) */}
            <div className="flex flex-col space-y-4">
              {presets.map((preset) => {
                const isSelected = selectedPresetId === preset.id || selectedPresetId === preset.slug;
                const price = preset.price_credits !== undefined ? preset.price_credits : 5;
                const previewImg = getPresetAssetUrl(preset.preview_url || preset.reference_image_url);

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPresetAndProceed(preset)}
                    className={`group relative rounded-3xl border bg-[#0c1017]/90 p-4 sm:p-5 overflow-hidden cursor-pointer transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-5 hover:border-amber-500/60 hover:shadow-2xl hover:shadow-amber-500/10 ${
                      isSelected
                        ? 'border-amber-500/80 shadow-xl shadow-amber-500/15 ring-1 ring-amber-500/50 bg-[#121620]'
                        : 'border-slate-800/80 hover:bg-[#0f1420]'
                    }`}
                  >
                    {/* Left: Big Preview Image with Badges */}
                    <div className="relative w-full md:w-64 h-48 sm:h-52 rounded-2xl overflow-hidden bg-black/60 shrink-0 border border-white/10 group-hover:border-amber-500/40 transition-all">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewImg}
                        alt={preset.name}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute('src', '/presets/doraemon_bread_scene.jpg');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-md">
                          Ảnh Mẫu Tham Khảo
                        </span>
                        {preset.id === 'bread_toast' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                            ★ Khuyên Dùng
                          </span>
                        )}
                      </div>

                      {/* Price on Image Bottom */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/85 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-black shadow-lg">
                          <Coins className="size-3.5 text-amber-400" />
                          <span>{price > 0 ? `${price} Xu / lần` : 'Miễn Phí'}</span>
                        </div>
                        {preset.price_vnd ? (
                          <span className="px-2 py-1 rounded-xl bg-black/85 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                            {preset.price_vnd.toLocaleString('vi-VN')} đ
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Center: Details & Attributes */}
                    <div className="flex-1 min-w-0 space-y-2.5 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                          {preset.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {preset.material || 'Tự Nhiên'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {preset.description || 'Chất liệu hòa quyện tự nhiên, khóa cứng ma trận module QR chuẩn xác quét 100%'}
                      </p>

                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="size-3.5 text-emerald-400" />
                          <span>Chuẩn Quét 100% (Deterministic Restoration)</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 font-semibold">
                          Tự động bóc tách nền QR (qrtrans)
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] text-slate-400 font-mono">
                          Màu tối: {preset.dark_color || '#1e140d'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 italic flex items-center gap-1">
                        <Lock className="size-3 text-slate-500" />
                        <span>Ảnh mẫu tham chiếu và Prompt đã được Quản trị viên (Admin) cấu hình chuẩn xác cho phong cách này.</span>
                      </p>
                    </div>

                    {/* Right: Big CTA Button */}
                    <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0">
                      <button
                        type="button"
                        className={`w-full md:w-auto px-6 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-300'
                            : 'bg-gradient-to-r from-amber-500 to-rose-500 group-hover:from-amber-400 group-hover:to-rose-400 text-slate-950 shadow-amber-500/20'
                        }`}
                      >
                        <Sparkles className="size-4 text-slate-950" />
                        <span>Chọn Phong Cách Này & Tạo QR →</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: PHÒNG TẠO MÃ ART QR (STUDIO GENERATOR) */}
        {viewMode === 'generator' && (
          <div className="space-y-6">
            {/* Active Preset Top Banner */}
            <div className="bg-[#0c1017]/90 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl overflow-hidden border border-amber-500/40 shrink-0 bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={referencePreview}
                    alt={selectedPreset?.name || 'Selected Preset'}
                    className="size-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white">
                      {selectedPreset?.name || 'Bánh Mì Nướng Doraemon'}
                    </h2>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {selectedPreset?.price_credits ? `${selectedPreset.price_credits} Xu` : '5 Xu'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedPreset?.description || 'Giữ nguyên ma trận module QR, nướng vàng toasting tự nhiên'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('catalog')}
                className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all shrink-0 self-start sm:self-auto"
              >
                <ArrowLeft className="size-3.5 text-amber-400" />
                <span>Đổi phong cách khác</span>
              </button>
            </div>

            {/* Main Studio Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Upload & Options (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                {/* 1. Input QR Section */}
                <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold flex items-center justify-center">
                        1
                      </span>
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                        Mã QR Đầu Vào (Tự Động Cắt Sát & Bóc Tách Nền)
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={handleLoadSample}
                      disabled={transparencyProcessing || generating}
                      className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
                    >
                      <Sparkles className="size-3 text-cyan-400" />
                      <span>Dùng QR mẫu</span>
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleQRFileSelected(e.target.files[0]);
                      }
                    }}
                    accept="image/png,image/jpeg,image/webp,image/jpg,image/gif"
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
                    }`}
                  >
                    {previewURL ? (
                      <div className="space-y-3">
                        <div className="relative inline-flex items-center gap-3 p-2 bg-black/60 rounded-xl border border-slate-700/80">
                          {/* Raw QR Preview */}
                          <div className="text-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewURL}
                              alt="Source QR"
                              className="size-20 object-contain mx-auto rounded-lg border border-slate-800"
                            />
                            <span className="text-[9px] text-slate-400 mt-1 block">Ảnh Gốc</span>
                          </div>

                          {/* Cleaned Transparent QR Preview */}
                          <div className="text-center">
                            <div className="size-20 rounded-lg border border-emerald-500/40 bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)] bg-[size:10px_10px] bg-[#111827] flex items-center justify-center overflow-hidden">
                              {cleanQRResult?.dataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={cleanQRResult.dataUrl}
                                  alt="Cleaned Transparent QR"
                                  className="size-18 object-contain"
                                />
                              ) : transparencyProcessing ? (
                                <RefreshCw className="size-4 animate-spin text-amber-400" />
                              ) : (
                                <span className="text-[9px] text-slate-500">Đang cắt...</span>
                              )}
                            </div>
                            <span className="text-[9px] text-emerald-400 font-semibold mt-1 block">
                              Đã Cắt Sát & Tách Nền
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[260px] mx-auto">
                            {selectedFile?.name || 'Mã QR đã chọn'}
                          </p>
                          <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center justify-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-400" />
                            <span>Đã tự động cắt sát viền mã QR và loại bỏ viền trắng thừa xung quanh (qrtrans)</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-tr from-amber-500/15 to-rose-500/15 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-400 shadow-md">
                          <UploadCloud className="size-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            Kéo thả ảnh QR hoặc <span className="text-amber-400">Bấm để tải lên</span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            PNG, JPG, WebP • Hỗ trợ bấm <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[9px] text-amber-300">Ctrl + V</kbd> dán ảnh
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Style & Reference Display (Managed by Admin, read-only on User side) */}
                <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                        Phong Cách & Ảnh Mẫu (Do Admin Thiết Lập)
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewMode('catalog')}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                    >
                      <span>Đổi phong cách</span>
                      <ArrowRight className="size-3" />
                    </button>
                  </div>

                  {/* Hidden Custom Reference Input */}
                  <input
                    type="file"
                    ref={refInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleCustomRefUpload(e.target.files[0]);
                    }}
                  />

                  {/* Reference Scene Preview Display */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
                    <div className="size-16 rounded-xl overflow-hidden border border-amber-500/30 shrink-0 bg-black/60 relative shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={referenceFile ? referencePreview : getPresetAssetUrl(selectedPreset?.reference_image_url || selectedPreset?.preview_url)}
                        alt="Scene Reference"
                        className="size-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.getAttribute('src') !== '/presets/doraemon_bread_scene.jpg') {
                            target.setAttribute('src', '/presets/doraemon_bread_scene.jpg');
                          }
                        }}
                      />
                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded text-[7px] font-bold bg-black/80 text-amber-300">
                        {referenceFile ? 'Ảnh Tự Tải' : 'Phôi AI'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white truncate">
                          {referenceFile ? 'Ảnh Phôi Tự Tải Lên (Custom Scene)' : (selectedPreset?.name || 'Bánh Mì Nướng Doraemon')}
                        </p>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          {selectedPreset?.price_credits !== undefined ? `${selectedPreset.price_credits} Xu / lần` : '5 Xu'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {referenceFile
                          ? 'Hệ thống sẽ giữ nguyên ma trận module QR và hòa trộn lên ảnh phôi bạn vừa tải lên.'
                          : (selectedPreset?.description || 'Giữ nguyên ma trận module QR, hòa trộn tự nhiên vào phôi nền cảnh')}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => refInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          <Upload className="size-3" />
                          <span>{referenceFile ? 'Đổi ảnh phôi khác' : 'Tùy chọn: Tải ảnh phôi riêng của bạn'}</span>
                        </button>
                        {referenceFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setReferenceFile(null);
                              if (selectedPreset?.reference_image_url || selectedPreset?.preview_url) {
                                setReferencePreview(selectedPreset.reference_image_url || selectedPreset.preview_url);
                              }
                            }}
                            className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] transition-all cursor-pointer"
                          >
                            Dùng lại mẫu Preset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {artQRError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{artQRError}</span>
                  </div>
                )}

                {/* Action Button: Generate Art QR */}
                <button
                  type="button"
                  onClick={handleGenerateArtQR}
                  disabled={generating || !selectedFile}
                  className="w-full py-4 px-4 rounded-xl font-extrabold text-xs bg-gradient-to-r from-amber-500 via-amber-400 to-rose-400 hover:from-amber-400 hover:to-rose-300 text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      <span>Đang Xử Lý Pipeline (MachGen + Khôi Phục Module)...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="size-4" />
                      <span>TẠO ART QR BẢO ĐẢM QUÉT 100% ({selectedPreset?.price_credits || 5} XU)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: High-Res Result & Verification Display (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-emerald-400" />
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                        {artQRResult?.qr_valid ? 'Kết Quả Art QR & Kiểm Định Quét ZXing' : 'Kết Quả Art QR từ AI'}
                      </h2>
                    </div>

                    {artQRResult && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${artQRResult.qr_valid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
                        {artQRResult.qr_valid ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <AlertCircle className="size-3.5 text-amber-400" />}
                        <span>{artQRResult.qr_valid ? 'Payload Trùng Khớp 100%' : 'Bản AI chưa kiểm định quét'}</span>
                      </div>
                    )}
                  </div>

                  {/* Main Stage Viewport */}
                  <div className="relative rounded-2xl min-h-[420px] flex items-center justify-center p-6 border border-slate-800/80 overflow-hidden transition-all bg-[#06080c]">
                    {generating ? (
                      <div className="text-center space-y-4 max-w-sm">
                        <div className="size-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 animate-pulse">
                          <RefreshCw className="size-7 animate-spin" />
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-bold text-white">Đang thực hiện Art QR Pipeline</p>
                          <div className="space-y-1.5 text-left bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px]">
                            <div className="flex items-center gap-2 text-emerald-400">
                              <Check className="size-3.5" />
                              <span>1. Giải mã & khóa expected_payload</span>
                            </div>
                            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {currentStep >= 2 ? <Check className="size-3.5" /> : <span className="size-3.5 rounded-full border border-slate-600" />}
                              <span>2. Gọi hàm bóc tách nền chuẩn (qrtrans.ProcessImage)</span>
                            </div>
                            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {currentStep >= 3 ? <Check className="size-3.5" /> : <span className="size-3.5 rounded-full border border-slate-600" />}
                              <span>3. Xây dựng ma trận module khóa cứng (Binary Mask)</span>
                            </div>
                            <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-amber-300 font-semibold' : 'text-slate-500'}`}>
                              {currentStep >= 4 ? <RefreshCw className="size-3.5 animate-spin text-amber-400" /> : <span className="size-3.5 rounded-full border border-slate-600" />}
                              <span>4. MachGen tạo hiệu ứng chất liệu & ánh sáng</span>
                            </div>
                            <div className={`flex items-center gap-2 ${currentStep >= 5 ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {currentStep >= 5 ? <Check className="size-3.5" /> : <span className="size-3.5 rounded-full border border-slate-600" />}
                              <span>5. Nhận nguyên ảnh AI (không chèn thêm QR)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : artQRResult ? (
                      <div className="relative group max-w-full text-center space-y-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={artQRResult.image}
                          alt="Verified Art QR Result"
                          className="max-h-[380px] max-w-full object-contain mx-auto rounded-xl shadow-2xl border border-amber-500/30"
                        />

                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-md ${artQRResult.qr_valid ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'}`}>
                            {artQRResult.qr_valid ? '✓ ĐÃ KIỂM ĐỊNH QUÉT' : 'ẢNH AI NGUYÊN BẢN'}
                          </span>
                        </div>
                      </div>
                    ) : artQRError ? (
                      <div className="text-center space-y-4 max-w-md p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 mx-auto shadow-xl">
                        <div className="size-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto text-rose-400 border border-rose-500/30">
                          <AlertCircle className="size-8" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-black text-rose-200 uppercase tracking-wide">
                            Hệ Thống Tạm Thời Gián Đoạn
                          </p>
                          <p className="text-xs text-rose-300/90 leading-relaxed font-medium">
                            {artQRError}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-3 max-w-xs">
                        <div className="size-16 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                          <QrCode className="size-8 stroke-[1.5] text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-300">Chưa có kết quả Art QR</p>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            Tải lên ảnh mã QR bên trái và bấm nút Tạo Art QR để bắt đầu quy trình hòa trộn AI gpt-image-2 chuẩn xác.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Badges & Metrics Bar */}
                  {artQRResult && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Kiểm Định Quét</p>
                        <div className="mt-1 inline-flex items-center gap-1">
                          {artQRResult.qr_valid ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <AlertCircle className="size-3.5 text-amber-400" />}
                          <span className={`text-xs font-extrabold ${artQRResult.qr_valid ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {artQRResult.qr_valid ? '100% Hợp Lệ' : 'Chưa kiểm định'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Thời Gian Xử Lý</p>
                        <p className="text-xs font-mono font-bold text-cyan-400 mt-1">
                          {artQRResult.processing_ms} ms
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Tách Nền Tự Động</p>
                        <p className="text-xs font-bold text-emerald-400 mt-1">
                          {artQRResult.background_removed ? 'qrtrans OK' : 'Fallback'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Số Lần Retry</p>
                        <p className="text-xs font-mono font-bold text-amber-400 mt-1">
                          {artQRResult.retry_count} lần
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Fallback Auto-Swap Notification */}
                  {artQRResult?.fallback_mode && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs shadow-sm">
                      <Zap className="size-4 text-amber-400 shrink-0 animate-pulse" />
                      <span>
                        <strong className="font-bold text-amber-200">Đã tự động chuyển đổi:</strong> API apigiare tạm hết hạn ngạch/số dư, hệ thống đã tự động swap sang <strong className="text-amber-200 font-bold">MachGen (model gpt-image-2)</strong> để hoàn tất Art QR chuẩn xác!
                      </span>
                    </div>
                  )}

                  {/* Decoded Payload Box */}
                  {(artQRResult?.decoded_payload || cleanQRResult?.outputPayload) && (
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                          <CheckCheck className="size-3.5 text-emerald-400" />
                          <span>{artQRResult?.qr_valid ? 'Dữ liệu giải mã từ ảnh kết quả:' : 'Payload từ mã QR đầu vào:'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyPayload}
                          className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
                        >
                          {copiedPayload ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          <span>{copiedPayload ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      </div>
                      <div className="bg-black/60 rounded-lg p-2.5 font-mono text-xs text-slate-200 break-all border border-slate-800/60">
                        {artQRResult?.decoded_payload || cleanQRResult?.outputPayload}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {artQRResult?.image && (
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadOutput(artQRResult.image, `artqr_${selectedPresetId}_${Date.now()}.png`)}
                        className="flex-1 min-w-[200px] py-3.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all"
                      >
                        <Download className="size-4" />
                        <span>Tải Ảnh Art QR Hoàn Chỉnh (PNG)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyImage(artQRResult.image)}
                        className="py-3.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                      >
                        {copiedImage ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-cyan-400" />}
                        <span>{copiedImage ? 'Đã sao chép ảnh' : 'Sao chép ảnh'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: TRANG BÓC TÁCH NỀN TRONG SUỐT ĐỘC LẬP */}
        {viewMode === 'transparency_tool' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Tải Lên QR Để Bóc Tách Nền Trắng
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
                  >
                    Thử ảnh mẫu
                  </button>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 text-center cursor-pointer bg-slate-900/40"
                >
                  {previewURL ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewURL} alt="Raw" className="size-32 object-contain mx-auto rounded-lg mb-2" />
                      <p className="text-xs text-white font-bold">{selectedFile?.name}</p>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud className="size-8 text-amber-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-200 font-bold">Bấm hoặc kéo thả ảnh mã QR</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Crop Mode Selection */}
              <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Chế Độ Bóc Tách</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCropMode('none')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold ${
                      cropMode === 'none' ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    Gốc (None)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropMode('crop')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold ${
                      cropMode === 'crop' ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    Cắt Sát (Crop)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropMode('mask')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold ${
                      cropMode === 'mask' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    Xóa Viền (Mask)
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Transparent Result */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Kết Quả PNG Trong Suốt (RGBA)</h3>
                <div className="min-h-[380px] rounded-2xl border border-slate-800 bg-[linear-gradient(45deg,#151921_25%,transparent_25%),linear-gradient(-45deg,#151921_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#151921_75%),linear-gradient(-45deg,transparent_75%,#151921_75%)] bg-[size:20px_20px] bg-[#0d1117] flex items-center justify-center p-6">
                  {cleanQRResult?.dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cleanQRResult.dataUrl} alt="Cleaned" className="max-h-[320px] max-w-full object-contain" />
                  ) : (
                    <p className="text-xs text-slate-500">Tải lên ảnh QR bên trái để bóc tách nền</p>
                  )}
                </div>

                {cleanQRResult?.dataUrl && (
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadOutput(cleanQRResult.dataUrl as string, `transparent_qr_${Date.now()}.png`)}
                      className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <Download className="size-4" />
                      <span>Tải Ảnh PNG Trong Suốt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('wavy_controlnet');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      <Waves className="size-4" />
                      <span>Chuyển Sang Uốn Lượn ControlNet</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: TRANG BIẾN ĐỔI NÉT UỐN LƯỢN CHO QR CONTROLNET */}
        {viewMode === 'wavy_controlnet' && (
          <WavyQRControlNet
            initialQRUrl={cleanQRResult?.dataUrl || previewURL}
            initialPayload={cleanQRResult?.outputPayload || cleanQRResult?.inputPayload || ''}
            onBackToGallery={() => {
              setViewMode('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSendToGenerator={(file, dataUrl, prompt) => {
              setSelectedFile(file);
              setPreviewURL(dataUrl);
              if (prompt) setCustomPrompt(prompt);
              setViewMode('generator');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* VIEW 5: BỘ SƯU TẬP ART QR ĐÃ TẠO RIÊNG CỦA USER */}
        {viewMode === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c1017]/60 border border-slate-800/60 rounded-2xl p-4">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Bộ Sưu Tập Art QR Của Bạn</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({history.length} tác phẩm đã lưu)
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Tất cả mã QR nghệ thuật được tạo từ tài khoản của bạn được lưu trữ an toàn và bảo mật riêng tư tại đây.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={historyLoading}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`size-3.5 ${historyLoading ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Làm mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('generator')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 flex items-center gap-1.5 shrink-0 transition-all shadow-md"
                >
                  <Sparkles className="size-3.5" />
                  <span>Tạo QR mới</span>
                </button>
              </div>
            </div>

            {historyLoading && history.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-[#0c1017]/80 p-12 text-center">
                <RefreshCw className="size-6 animate-spin text-amber-400 mx-auto mb-3" />
                <p className="text-xs text-slate-400">Đang tải bộ sưu tập Art QR của bạn...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-[#0c1017]/40 p-12 text-center space-y-4">
                <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <QrCode className="size-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Chưa có tác phẩm Art QR nào</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Hãy vào phòng tạo ảnh để sáng tạo những tác phẩm QR nghệ thuật độc bản chuẩn quét 100%.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('generator')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all"
                >
                  Bắt đầu tạo Art QR ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {history.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="group relative rounded-2xl border border-slate-800 bg-[#0c1017]/90 hover:border-amber-500/50 hover:bg-[#121620] overflow-hidden transition-all duration-300 flex flex-col shadow-lg"
                    >
                      {/* Thumbnail with overlay buttons */}
                      <div
                        onClick={() => setSelectedHistoryItem(item)}
                        className="relative w-full aspect-square bg-black/70 overflow-hidden cursor-pointer flex items-center justify-center border-b border-slate-800/80"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url}
                          alt="Art QR"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Scannable verified badge */}
                        <div className="absolute top-2.5 left-2.5">
                          {item.scannable !== false ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-slate-950 flex items-center gap-1 shadow-md">
                              <CheckCircle2 className="size-3" />
                              <span>Chuẩn quét 100%</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/90 text-slate-300 border border-slate-700">
                              Art Preview
                            </span>
                          )}
                        </div>

                        {/* Quick View Hover Icon */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5">
                            <Eye className="size-3.5 text-amber-400" />
                            <span>Xem chi tiết</span>
                          </span>
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="font-bold text-amber-300 truncate">
                              {item.preset_name || item.preset_id}
                            </span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {new Date(item.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          {item.original_payload && (
                            <p className="text-[11px] text-slate-400 truncate font-mono bg-slate-950/60 px-2 py-1 rounded-md border border-slate-900">
                              {item.original_payload}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                          <button
                            type="button"
                            onClick={() => handleDownloadOutput(item.image_url, `art_qr_${item.preset_id}_${item.id.slice(-6)}.png`)}
                            className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                          >
                            <Download className="size-3 text-amber-400" />
                            <span>Tải ảnh</span>
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={(e) => handleDeleteHistory(e, item.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                            title="Xóa tác phẩm"
                          >
                            <Trash2 className={`size-3.5 ${deletingId === item.id ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FULL RESOLUTION PREVIEW MODAL */}
        {selectedHistoryItem && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative max-w-2xl w-full bg-[#0c1017] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <QrCode className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {selectedHistoryItem.preset_name || selectedHistoryItem.preset_id}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Tạo lúc: {new Date(selectedHistoryItem.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedHistoryItem(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                >
                  <span className="text-sm font-bold px-1.5">✕</span>
                </button>
              </div>

              {/* High-res Image Preview */}
              <div className="w-full aspect-square max-h-[420px] rounded-2xl bg-black/80 border border-slate-800 flex items-center justify-center overflow-hidden p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedHistoryItem.image_url}
                  alt="Art QR High-Res"
                  className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                />
              </div>

              {/* Payload details & Verification Status */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Nội dung giải mã (Payload):</span>
                  {selectedHistoryItem.scannable !== false ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCheck className="size-3" /> Chuẩn quét 100%
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">Chưa kiểm định</span>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-black/60 border border-white/5 font-mono text-[11px] text-amber-300 break-all select-all flex items-center justify-between gap-2">
                  <span className="truncate">{selectedHistoryItem.original_payload || selectedHistoryItem.decoded_payload || 'Không có payload'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedHistoryItem.original_payload) {
                        navigator.clipboard.writeText(selectedHistoryItem.original_payload);
                      }
                    }}
                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white shrink-0"
                    title="Sao chép nội dung"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDownloadOutput(selectedHistoryItem.image_url, `art_qr_${selectedHistoryItem.preset_id}_${selectedHistoryItem.id.slice(-6)}.png`)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.01] transition-all"
                >
                  <Download className="size-4" />
                  <span>Tải Ảnh Gốc 4K</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyImage(selectedHistoryItem.image_url)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-all"
                >
                  <Copy className="size-3.5 text-slate-300" />
                  <span>Sao chép ảnh</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
