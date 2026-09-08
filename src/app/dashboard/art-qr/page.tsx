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
  Image as ImageIcon,
  Cpu,
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

  // Active view tab: 'art_qr' (Default) | 'transparency_tool'
  const [activeTab, setActiveTab] = useState<'art_qr' | 'transparency_tool'>('art_qr');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string>('');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom reference scene
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string>('/presets/doraemon_bread_scene.jpg');
  const refInputRef = useRef<HTMLInputElement>(null);

  // Presets
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
    // Fetch presets
    getArtQRPresets().then((res) => {
      if (res && res.length > 0) {
        setPresets(res);
      }
    });
  }, []);

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

    // Simulate progressive step status
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
          <span>Đang tải Art QR Production Studio...</span>
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
                  <span>Art QR Studio • Pipeline Tích Hợp MachGen & Khôi Phục Module</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-500/30">
                    Deterministic Engine 100% Scan
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Tự động bóc tách nền QR bằng Go engine, đưa vào MachGen tạo chất liệu toasting/khắc và khôi phục cấu trúc module bảo toàn nguyên vẹn
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('art_qr')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'art_qr'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="size-3.5" />
              <span>Tạo Art QR (MachGen)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transparency_tool')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'transparency_tool'
                  ? 'bg-slate-800 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="size-3.5 text-cyan-400" />
              <span>Bóc Tách Nền Trong Suốt</span>
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Uploads & Configs (5 cols) */}
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

            {/* 2. Material Preset Selection */}
            {activeTab === 'art_qr' && (
              <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Chọn Preset Phong Cách & Vật Liệu
                    </h2>
                  </div>
                  <span className="text-[10px] text-amber-300 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    Khóa Ma Trận Module
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Preset 1: Doraemon Bread Toast (Default) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPresetId('bread_toast');
                      setReferencePreview('/presets/doraemon_bread_scene.jpg');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      selectedPresetId === 'bread_toast'
                        ? 'border-amber-500/70 bg-amber-500/10 text-white shadow-lg shadow-amber-500/15'
                        : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="size-10 rounded-lg overflow-hidden border border-amber-500/40 shrink-0 bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/presets/doraemon_bread_scene.jpg"
                        alt="Doraemon Bread"
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white truncate">Bánh Mì Doraemon</p>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/30 text-amber-300">
                          Khuyên Dùng
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">Nướng vàng toasting tự nhiên</p>
                    </div>
                  </button>

                  {/* Preset 2: Stone Engrave */}
                  <button
                    type="button"
                    onClick={() => setSelectedPresetId('stone_engrave')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      selectedPresetId === 'stone_engrave'
                        ? 'border-cyan-500/70 bg-cyan-500/10 text-white shadow-lg shadow-cyan-500/15'
                        : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="size-10 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-800 flex items-center justify-center text-slate-400">
                      <Cpu className="size-5 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">Khắc Đá Cổ Thạch</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">Đá hoa cương chạm bóng râm</p>
                    </div>
                  </button>

                  {/* Preset 3: Burned Wood */}
                  <button
                    type="button"
                    onClick={() => setSelectedPresetId('burned_wood')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      selectedPresetId === 'burned_wood'
                        ? 'border-orange-500/70 bg-orange-500/10 text-white shadow-lg shadow-orange-500/15'
                        : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="size-10 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-800 flex items-center justify-center text-orange-400">
                      <Flame className="size-5 text-orange-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">Gỗ Cháy Pyrography</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">Khò nhiệt thớ gỗ sồi tự nhiên</p>
                    </div>
                  </button>

                  {/* Preset 4: Metal Etch */}
                  <button
                    type="button"
                    onClick={() => setSelectedPresetId('metal_etch')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      selectedPresetId === 'metal_etch'
                        ? 'border-purple-500/70 bg-purple-500/10 text-white shadow-lg shadow-purple-500/15'
                        : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="size-10 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-800 flex items-center justify-center text-purple-400">
                      <ShieldCheck className="size-5 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">Kim Loại Khắc Axit</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">Titan phay xước tương phản cao</p>
                    </div>
                  </button>
                </div>

                {/* Base Scene Reference info */}
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
                        {referenceFile ? referenceFile.name : 'Khung cảnh Doraemon Bánh Mì (Mặc định)'}
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
                    <span className="font-semibold text-slate-400">Mô Tả Bổ Sung (Prompt Tùy Chọn):</span>
                    <span className="text-[10px] text-slate-500">Mặc định dùng prompt chuẩn</span>
                  </div>
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="VD: Slightly darker toasted edges, golden honey butter glaze..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {artQRError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{artQRError}</span>
              </div>
            )}

            {/* Action Button: Generate Art QR */}
            {activeTab === 'art_qr' ? (
              <button
                type="button"
                onClick={handleGenerateArtQR}
                disabled={generating || !selectedFile}
                className="w-full py-4 px-4 rounded-xl font-extrabold text-xs bg-gradient-to-r from-amber-500 via-amber-400 to-rose-400 hover:from-amber-400 hover:to-rose-300 text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Đang Xử Lý Pipeline (MachGen + Khôi Phục Module)...</span>
                  </>
                ) : (
                  <>
                    <Zap className="size-4" />
                    <span>TẠO ART QR BẢO ĐẢM QUÉT 100% (GENERATE ART QR)</span>
                  </>
                )}
              </button>
            ) : (
              <div className="text-center">
                <p className="text-xs text-slate-400">
                  Chế độ bóc tách nền đang kích hoạt ở cột bên phải.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: High-Res Result & Verification Display (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    {activeTab === 'art_qr'
                      ? 'Kết Quả Art QR & Kiểm Định Quét ZXing'
                      : 'Xem Trước Mã QR Trong Suốt (RGBA)'}
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
              <div
                className={`relative rounded-2xl min-h-[420px] flex items-center justify-center p-6 border border-slate-800/80 overflow-hidden transition-all bg-[#06080c]`}
              >
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
                ) : cleanQRResult?.dataUrl && activeTab === 'transparency_tool' ? (
                  <div className="relative group max-w-full text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cleanQRResult.dataUrl}
                      alt="Processed QR Preview"
                      className="max-h-[360px] max-w-full object-contain mx-auto"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/80 text-amber-300 border border-amber-500/40">
                        PNG Trong Suốt (RGBA)
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
    </div>
  );
}
