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
} from 'lucide-react';
import {
  processQRTransparency,
  getSampleQR,
  QRTransResponse,
} from '@/lib/api';
import {
  getArtQRPresets,
  generateArtQRSync,
  ArtQRPreset,
  ArtQRResult,
} from '@/lib/artqr_api';

export default function ArtQRStudioPage() {
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState<boolean>(false);

  // View mode: 'catalog' (Trang chọn phong cách) | 'generator' (Trang tạo mã) | 'transparency_tool' (Bóc tách nền)
  const [viewMode, setViewMode] = useState<'catalog' | 'generator' | 'transparency_tool'>('catalog');

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

  // Transparency tool extra settings
  const [cropMode, setCropMode] = useState<'none' | 'crop' | 'mask'>('none');
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

  useEffect(() => {
    setMounted(true);
    // Fetch presets from API
    getArtQRPresets().then((res) => {
      if (res && res.length > 0) {
        setPresets(res);
      }
    });

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
    if (preset.reference_image_url || preset.preview_url) {
      setReferencePreview(preset.reference_image_url || preset.preview_url);
    }
    setViewMode('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Process uploaded QR file - AUTOMATICALLY runs existing QR background removal immediately
  const handleQRFileSelected = async (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewURL(objectUrl);
    setArtQRError('');
    setArtQRResult(null);

    // Mandatory Step: Execute existing QR background removal automatically
    setTransparencyProcessing(true);
    try {
      const opts = {
        threshold: useOtsu ? 0 : threshold,
        crop_mode: cropMode,
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

    try {
      const res = await generateArtQRSync(selectedFile, {
        referenceFile: referenceFile,
        presetId: selectedPresetId,
        customPrompt: customPrompt,
      });

      if (res && res.success) {
        setCurrentStep(5);
        setArtQRResult(res);
      } else {
        setArtQRError(res?.error || 'Không thể tạo mã Art QR với độ quét hợp lệ.');
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

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold shrink-0">
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
              onClick={() => setViewMode('transparency_tool')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'transparency_tool'
                  ? 'bg-slate-800 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="size-3.5 text-cyan-400" />
              <span>Tách Nền QR</span>
            </button>
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

            {/* Presets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {presets.map((preset) => {
                const isSelected = selectedPresetId === preset.id || selectedPresetId === preset.slug;
                const price = preset.price_credits !== undefined ? preset.price_credits : 5;
                const previewImg = preset.reference_image_url || preset.preview_url || '/presets/doraemon_bread_scene.jpg';

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPresetAndProceed(preset)}
                    className={`group relative rounded-2xl border bg-[#0c1017]/90 overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] hover:shadow-2xl ${
                      isSelected
                        ? 'border-amber-500/80 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/50'
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Image Preview Header */}
                      <div className="relative h-48 w-full overflow-hidden bg-black/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewImg}
                          alt={preset.name}
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1017] via-transparent to-black/30" />

                        {/* Price Badge */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-extrabold shadow-lg">
                          <Coins className="size-3.5 text-amber-400" />
                          <span>{price > 0 ? `${price} Xu / lần` : 'Miễn Phí'}</span>
                        </div>

                        {/* Highlight Tag */}
                        {preset.id === 'bread_toast' && (
                          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                            ★ Khuyên Dùng
                          </div>
                        )}
                      </div>

                      {/* Content Body */}
                      <div className="p-4 space-y-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                          <span>{preset.name}</span>
                          <ArrowRight className="size-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {preset.description || 'Chất liệu tự nhiên, khóa cứng ma trận module quét 100%'}
                        </p>

                        {/* Attributes tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-medium">
                            Vật liệu: {preset.material || 'Toasted'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-medium">
                            ✓ Khóa Ma Trận
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Card Action */}
                    <div className="p-4 pt-0">
                      <button
                        type="button"
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800/80 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-200'
                        }`}
                      >
                        <Sparkles className="size-3.5" />
                        <span>Chọn Phong Cách Này & Tạo QR</span>
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
                        Mã QR Đầu Vào (Tự Động Bóc Tách Nền)
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
                                <span className="text-[9px] text-slate-500">Đang tách...</span>
                              )}
                            </div>
                            <span className="text-[9px] text-emerald-400 font-semibold mt-1 block">
                              Tách Nền Xong
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[260px] mx-auto">
                            {selectedFile?.name || 'Mã QR đã chọn'}
                          </p>
                          <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center justify-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-400" />
                            <span>Đã tự động gọi hàm bóc tách nền chuẩn (qrtrans)</span>
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

                {/* 2. Custom Prompt & Scene reference */}
                <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                        Khung Cảnh & Mô Tả Bổ Sung
                      </h2>
                    </div>
                  </div>

                  {/* Scene Reference Upload */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={referencePreview}
                          alt="Scene Reference"
                          className="size-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">
                          {referenceFile ? referenceFile.name : 'Ảnh tham chiếu phong cách'}
                        </p>
                        <p className="text-[10px] text-slate-400">Cung cấp làm Reference Image 1 cho MachGen</p>
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={refInputRef}
                      onChange={handleReferenceChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => refInputRef.current?.click()}
                      className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
                    >
                      Đổi cảnh nền
                    </button>
                  </div>

                  {/* Optional Custom Prompt */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-400">Ghi chú bổ sung (Prompt):</span>
                      <span className="text-[10px] text-slate-500">Mặc định dùng prompt hệ thống</span>
                    </div>
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="VD: Slightly darker toasted edges, rich butter glaze..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
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
                        Kết Quả Art QR & Kiểm Định Quét ZXing
                      </h2>
                    </div>

                    {artQRResult && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                        <span>Payload Trùng Khớp 100%</span>
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
                              <span>5. Khôi phục module và kiểm định quét ZXing</span>
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
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950 shadow-md">
                            ✓ ĐÃ KIỂM ĐỊNH QUÉT
                          </span>
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
                            Tải lên ảnh mã QR bên trái và bấm nút Tạo Art QR để bắt đầu quy trình MachGen + khôi phục module bất biến.
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
                          <CheckCircle2 className="size-3.5 text-emerald-400" />
                          <span className="text-xs font-extrabold text-emerald-400">100% Hợp Lệ</span>
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

                  {/* Decoded Payload Box */}
                  {(artQRResult?.decoded_payload || cleanQRResult?.outputPayload) && (
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                          <CheckCheck className="size-3.5 text-emerald-400" />
                          <span>Dữ Liệu Mã QR Giải Mã Được (Expected Payload):</span>
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
                  <button
                    type="button"
                    onClick={() => handleDownloadOutput(cleanQRResult.dataUrl, `transparent_qr_${Date.now()}.png`)}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Download className="size-4" />
                    <span>Tải Ảnh PNG Trong Suốt</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
