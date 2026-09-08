'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Sparkles,
  UploadCloud,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Eye,
  EyeOff,
  QrCode,
  Layers,
  Zap,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Info,
  ArrowRight,
  ExternalLink,
  Crop,
  Maximize2,
  FileCheck,
  CheckCheck,
  ScanLine,
  TrendingDown,
  Link2,
  Share2,
  Globe,
  ArrowDownRight,
} from 'lucide-react';
import {
  API_BASE,
  processQRTransparency,
  getSampleQR,
  createIntermediateQR,
  QRTransResponse,
  IntermediateQRData,
} from '@/lib/api';

export default function ArtQRStudioPage() {
  // Authentication state
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>('');
  const [loginUser, setLoginUser] = useState<string>('admin');
  const [loginPass, setLoginPass] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);


  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string>('');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing settings
  const [cropMode, setCropMode] = useState<'none' | 'crop' | 'mask'>('none');
  const [useOtsu, setUseOtsu] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(215);
  const [validateQR, setValidateQR] = useState<boolean>(true);

  // Processing result state
  const [processing, setProcessing] = useState<boolean>(false);
  const [processError, setProcessError] = useState<string>('');
  const [result, setResult] = useState<QRTransResponse | null>(null);
  const [intermediate, setIntermediate] = useState<IntermediateQRData | null>(null);
  const [activePreview, setActivePreview] = useState<'intermediate' | 'original'>('intermediate');
  const [bgPreview, setBgPreview] = useState<'checker' | 'white' | 'dark'>('checker');

  // Copy feedback state
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [copiedShortUrl, setCopiedShortUrl] = useState<boolean>(false);
  const [copiedDataUrl, setCopiedDataUrl] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);

  // Auto-process uploaded QR file
  const processQRFile = async (file: File) => {
    setSelectedFile(file);
    setPreviewURL(URL.createObjectURL(file));
    setProcessing(true);
    setProcessError('');
    setResult(null);
    setIntermediate(null);

    try {
      const opts = {
        threshold: useOtsu ? 0 : threshold,
        crop_mode: cropMode,
        validate: validateQR,
      };

      const res = await processQRTransparency(file, opts, adminToken);
      if (res.success) {
        setResult(res);
        if (res.intermediate) {
          setIntermediate(res.intermediate);
          setActivePreview('intermediate');
        } else {
          setActivePreview('original');
        }
      } else {
        setProcessError(res.error || 'Không thể đọc hoặc xử lý mã QR');
      }
    } catch (err: unknown) {
      setProcessError(err instanceof Error ? err.message : 'Lỗi kết nối tới máy chủ xử lý QR');
    } finally {
      setProcessing(false);
    }
  };

  // File selection handlers (Auto-process on selection)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processQRFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processQRFile(e.dataTransfer.files[0]);
    }
  };

  // Load sample QR for instant testing (Auto-process)
  const handleLoadSample = async () => {
    try {
      setProcessing(true);
      setProcessError('');
      const data = await getSampleQR('https://nornai.com/art-qr-studio', 350);
      if (data.success && data.data_url) {
        const res = await fetch(data.data_url);
        const blob = await res.blob();
        const file = new File([blob], 'sample_qr.png', { type: 'image/png' });
        await processQRFile(file);
      }
    } catch {
      setProcessError('Không thể tải ảnh mẫu từ máy chủ.');
      setProcessing(false);
    }
  };

  // Trigger processing from uploaded image (Manual re-run or options change)
  const handleProcessTransparency = async () => {
    if (selectedFile) {
      await processQRFile(selectedFile);
    } else {
      setProcessError('Vui lòng chọn hoặc tải lên một hình ảnh QR trước!');
    }
  };

  // Listen for Clipboard Image Paste (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              processQRFile(file);
              break;
            }
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [useOtsu, threshold, cropMode, validateQR]);

  // Copy text payload
  const handleCopyPayload = () => {
    const text = intermediate?.targetUrl || result?.outputPayload || result?.inputPayload || '';
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Copy short URL
  const handleCopyShortURL = () => {
    if (!intermediate?.shortUrl) return;
    navigator.clipboard.writeText(intermediate.shortUrl);
    setCopiedShortUrl(true);
    setTimeout(() => setCopiedShortUrl(false), 2000);
  };

  // Get active image dataUrl
  const getActiveDataUrl = () => {
    if (activePreview === 'intermediate' && intermediate?.dataUrl) {
      return intermediate.dataUrl;
    }
    return result?.dataUrl || intermediate?.dataUrl || '';
  };

  // Copy Data URL
  const handleCopyDataURL = () => {
    const dataUrl = getActiveDataUrl();
    if (!dataUrl) return;
    navigator.clipboard.writeText(dataUrl);
    setCopiedDataUrl(true);
    setTimeout(() => setCopiedDataUrl(false), 2000);
  };

  // Copy image to clipboard
  const handleCopyImageToClipboard = async () => {
    const dataUrl = getActiveDataUrl();
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch {
      handleCopyDataURL();
    }
  };

  // Download Transparent PNG
  const handleDownload = () => {
    const dataUrl = getActiveDataUrl();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    if (activePreview === 'intermediate' && intermediate) {
      a.download = `artqr_minimal_v${intermediate.qrVersion}_${intermediate.slug}_${Date.now()}.png`;
    } else {
      a.download = `artqr_transparent_${cropMode}_${Date.now()}.png`;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // STUDIO RENDER (Open directly to all users)
  return (
    <div className="h-full w-full rounded-2xl border border-white/[0.08] overflow-y-auto bg-[#0a0c12] shadow-2xl p-3 sm:p-5 lg:p-6 relative">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Top Header */}
        <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <QrCode className="size-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Art QR Studio • Tối Thiểu Hóa Module QR</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/30">
                    Version 1 (21×21)
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Mỗi mã QR bạn nhập vào đều được tự động tạo một mã QR trung gian để giảm module xuống mức tối thiểu (21×21 ô) giúp AI hòa trộn nghệ thuật và điện thoại quét siêu nhạy
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tự Động Nén Module 21×21 Live</span>
          </div>
        </div>

      {/* Main Grid Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls & Input (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Input Section */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Tải Lên Hình Ảnh Mã QR
                </h2>
              </div>

              <button
                type="button"
                onClick={handleLoadSample}
                disabled={processing}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
              >
                <Sparkles className="size-3 text-cyan-400" />
                <span>Thử ảnh VietQR mẫu (53×53)</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
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
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
              }`}
            >
              {previewURL ? (
                <div className="space-y-3">
                  <div className="relative inline-block border border-slate-700/80 rounded-xl overflow-hidden bg-black/50 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewURL}
                      alt="Source QR Preview"
                      className="size-36 object-contain mx-auto rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[280px] mx-auto">
                      {selectedFile?.name || 'Ảnh mã QR đã tải lên'}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                      ✓ Đã tự động đọc và tạo mã QR trung gian 21×21
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Bấm vào đây để chọn ảnh khác, kéo thả file mới hoặc dán (Ctrl+V)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="size-14 rounded-2xl bg-gradient-to-tr from-amber-500/15 to-cyan-500/15 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-400 shadow-md">
                    <UploadCloud className="size-7" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      Kéo thả ảnh mã QR hoặc <span className="text-amber-400">Bấm để tải lên</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Hỗ trợ PNG, JPG, WebP • Có thể bấm <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-amber-300">Ctrl + V</kbd> để dán ảnh trực tiếp
                    </p>
                    <p className="text-[10px] text-cyan-400/80 mt-1">
                      ⚡ Tự động nén số ô module xuống tối thiểu (Version 1: 21×21) ngay khi tải ảnh
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Mode Selector */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Chế Độ Cắt & Tách Nền (Crop Mode)
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Mode None */}
              <button
                type="button"
                onClick={() => setCropMode('none')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  cropMode === 'none'
                    ? 'border-amber-500/60 bg-amber-500/10 text-white shadow-lg shadow-amber-500/10'
                    : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Layers className={`size-4 mb-2 ${cropMode === 'none' ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <p className="text-xs font-bold">Gốc (None)</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Giữ nguyên khung, tẩy trắng nền
                  </p>
                </div>
              </button>

              {/* Mode Crop */}
              <button
                type="button"
                onClick={() => setCropMode('crop')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  cropMode === 'crop'
                    ? 'border-cyan-500/60 bg-cyan-500/10 text-white shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Crop className={`size-4 mb-2 ${cropMode === 'crop' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div>
                  <p className="text-xs font-bold">Cắt Sát (Crop)</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Tự động tìm và crop đúng mã QR
                  </p>
                </div>
              </button>

              {/* Mode Mask */}
              <button
                type="button"
                onClick={() => setCropMode('mask')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  cropMode === 'mask'
                    ? 'border-purple-500/60 bg-purple-500/10 text-white shadow-lg shadow-purple-500/10'
                    : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <ScanLine className={`size-4 mb-2 ${cropMode === 'mask' ? 'text-purple-400' : 'text-slate-500'}`} />
                <div>
                  <p className="text-xs font-bold">Xóa Viền (Mask)</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Giữ khung, xóa sạch viền ngoài
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Threshold & Algorithm Settings */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="size-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Thuật Toán Tương Phản (Threshold)
              </h2>
            </div>

            <div className="space-y-4">
              {/* Otsu Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">Tự động tính ngưỡng (Otsu Adaptive)</p>
                  <p className="text-[10px] text-slate-400">
                    Thuật toán phân tích histogram để tìm ngưỡng cắt trắng/đen tối ưu
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseOtsu(!useOtsu)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    useOtsu ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`size-5 rounded-full bg-white transition-transform ${
                      useOtsu ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Manual Threshold Slider */}
              {!useOtsu && (
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Ngưỡng thủ công (Cutoff)</span>
                    <span className="font-mono font-bold text-amber-400">{threshold} / 255</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="250"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>100 (Tối hơn)</span>
                    <span>215 (Mặc định)</span>
                    <span>250 (Sáng hơn)</span>
                  </div>
                </div>
              )}

              {/* Validation Checkbox */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">Quét kiểm tra tính hợp lệ (Gozxing)</p>
                  <p className="text-[10px] text-slate-400">
                    Tự động decode kiểm tra mã QR sau khi tách nền trên canvas trắng
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setValidateQR(!validateQR)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    validateQR ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`size-5 rounded-full bg-white transition-transform ${
                      validateQR ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Error message */}
            {processError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{processError}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="button"
              onClick={handleProcessTransparency}
              disabled={processing || !selectedFile}
              className="w-full py-3.5 px-4 rounded-xl font-extrabold text-xs bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 hover:from-amber-400 hover:to-cyan-300 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>Đang xử lý thuật toán Go (~3ms)...</span>
                </>
              ) : (
                <>
                  <Zap className="size-4" />
                  <span>Tách Nền & Tự Động Rút Gọn Module (Process & Minimize)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Result & Inspection (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-emerald-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Xem Trước Kết Quả Trong Suốt
                </h2>
              </div>

              {/* Background switch */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-[11px] font-medium self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setBgPreview('checker')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    bgPreview === 'checker' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lưới Trong Suốt
                </button>
                <button
                  type="button"
                  onClick={() => setBgPreview('white')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    bgPreview === 'white' ? 'bg-white/20 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Nền Trắng
                </button>
                <button
                  type="button"
                  onClick={() => setBgPreview('dark')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    bgPreview === 'dark' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Nền Tối
                </button>
              </div>
            </div>

            {/* Preview Switcher Tabs (Intermediate vs Original) */}
            {(intermediate || result) && (
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
                {intermediate && (
                  <button
                    type="button"
                    onClick={() => setActivePreview('intermediate')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      activePreview === 'intermediate'
                        ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Zap className="size-3.5 text-emerald-400" />
                    <span>Mã Rút Gọn Module ({Math.sqrt(intermediate.moduleCount)}×{Math.sqrt(intermediate.moduleCount)})</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      -{intermediate.reductionPercent.toFixed(0)}%
                    </span>
                  </button>
                )}

                {result?.dataUrl && (
                  <button
                    type="button"
                    onClick={() => setActivePreview('original')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      activePreview === 'original'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Layers className="size-3.5 text-amber-400" />
                    <span>Mã Gốc Tách Nền</span>
                    {result.width && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({result.width}×{result.height}px)
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Display Canvas Viewport */}
            <div
              className={`relative rounded-2xl min-h-[360px] flex items-center justify-center p-6 border border-slate-800/80 overflow-hidden transition-all ${
                bgPreview === 'checker'
                  ? 'bg-[linear-gradient(45deg,#151921_25%,transparent_25%),linear-gradient(-45deg,#151921_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#151921_75%),linear-gradient(-45deg,transparent_75%,#151921_75%)] bg-[size:20px_20px] bg-[#0d1117]'
                  : bgPreview === 'white'
                  ? 'bg-white'
                  : 'bg-[#06080c]'
              }`}
            >
              {getActiveDataUrl() ? (
                <div className="relative group max-w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getActiveDataUrl()}
                    alt="Processed QR Preview"
                    className="max-h-[320px] max-w-full object-contain mx-auto transition-transform group-hover:scale-[1.01]"
                  />
                  {/* Quality Badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {activePreview === 'intermediate' && intermediate ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
                        <Zap className="size-3 text-emerald-400" />
                        <span>Version {intermediate.qrVersion} ({Math.sqrt(intermediate.moduleCount)}×{Math.sqrt(intermediate.moduleCount)} ô)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/80 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                        Mã Gốc Tách Nền (PNG RGBA)
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 max-w-xs">
                  <div className="size-16 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <QrCode className="size-8 stroke-[1.5] text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300">Chưa có kết quả xử lý</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tải lên ảnh mã QR hoặc nhập liên kết bên trái để tạo mã QR rút gọn tối thiểu module.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* INTERMEDIATE QR COMPARISON & REDUCTION CARD */}
            {intermediate && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0e1622]/90 to-[#0a1017]/90 border border-cyan-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <TrendingDown className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
                        <span>Bộ Giảm Thiểu Module QR Cho AI Art</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Intermediate Minimal QR
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Ép ma trận mã QR về mức tối thiểu để AI Diffusion hòa trộn ảnh nghệ thuật không bị nhiễu ô vuông
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold self-start sm:self-auto">
                    <Zap className="size-3 text-emerald-400" />
                    <span>Giảm -{intermediate.reductionPercent.toFixed(1)}% Ô Ma Trận</span>
                  </div>
                </div>

                {/* Module Comparison Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Original Box */}
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Mã Gốc (Original)</p>
                    <p className="text-xs font-mono font-bold text-slate-200">
                      {intermediate.originalModules > 0
                        ? `${Math.sqrt(intermediate.originalModules)}×${Math.sqrt(intermediate.originalModules)} modules`
                        : 'Mã Dày Đặc'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {intermediate.originalModules > 0 ? `${intermediate.originalModules.toLocaleString()} ô vuông` : 'Nhiều chi tiết'}
                    </p>
                  </div>

                  {/* Reduced Box */}
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      <span>Rút Gọn (Minimal)</span>
                    </p>
                    <p className="text-xs font-mono font-bold text-emerald-300">
                      Version {intermediate.qrVersion} ({Math.sqrt(intermediate.moduleCount)}×{Math.sqrt(intermediate.moduleCount)})
                    </p>
                    <p className="text-[10px] text-emerald-400/80">
                      Chỉ {intermediate.moduleCount} ô vuông (Cực thoáng)
                    </p>
                  </div>

                  {/* Benefit Box */}
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                    <p className="text-[10px] font-semibold text-cyan-400 uppercase">Hiệu Quả AI Art</p>
                    <p className="text-xs font-bold text-cyan-200">
                      Tối ưu 100% Diffusion
                    </p>
                    <p className="text-[10px] text-cyan-400/80">
                      Điện thoại quét nhạy & nhanh
                    </p>
                  </div>
                </div>

                {/* Short URL & Redirection Info */}
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Link2 className="size-3.5 text-cyan-400" />
                        <span className="font-semibold">Link chuyển hướng trung gian:</span>
                        <span className="font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                          {intermediate.shortUrl}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyShortURL}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80 flex items-center gap-1 transition-colors"
                        >
                          {copiedShortUrl ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          <span>{copiedShortUrl ? 'Đã chép link' : 'Chép link'}</span>
                        </button>

                        <a
                          href={intermediate.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="size-3" />
                          <span>Mở test</span>
                        </a>
                      </div>
                    </div>

                    {/* Target Payload Display */}
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 flex items-start gap-1.5">
                      <span className="font-semibold shrink-0 text-slate-500">Đích đến:</span>
                      <span className="font-mono text-slate-300 break-all line-clamp-2">
                        {intermediate.targetUrl}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Result Metadata Badges for Original QR */}
            {result && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Trạng Thái Quét</p>
                  <div className="mt-1 inline-flex items-center gap-1">
                    {result.qrValid ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                        <span className="text-xs font-extrabold text-emerald-400">Hợp Lệ</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="size-3.5 text-amber-400" />
                        <span className="text-xs font-extrabold text-amber-400">Chưa Quét Đc</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Tốc Độ Go</p>
                  <p className="text-xs font-mono font-bold text-cyan-400 mt-1">
                    {result.executionTimeMs ? `${result.executionTimeMs.toFixed(2)} ms` : '< 5 ms'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Ngưỡng Đã Dùng</p>
                  <p className="text-xs font-mono font-bold text-amber-400 mt-1">
                    {result.thresholdUsed || threshold} / 255
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Kích Thước Gốc</p>
                  <p className="text-xs font-mono font-bold text-slate-200 mt-1">
                    {result.width} x {result.height} px
                  </p>
                </div>
              </div>
            )}

            {/* Decoded Payload Box */}
            {result?.outputPayload && (
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                    <CheckCheck className="size-3.5 text-emerald-400" />
                    <span>Dữ Liệu QR Đã Giải Mã (Payload Gốc):</span>
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
                  {result.outputPayload}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            {getActiveDataUrl() && (
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 min-w-[200px] py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all"
                >
                  <Download className="size-4" />
                  <span>
                    {activePreview === 'intermediate' && intermediate
                      ? `Tải PNG Rút Gọn (${Math.sqrt(intermediate.moduleCount)}×${Math.sqrt(intermediate.moduleCount)}) Trong Suốt`
                      : 'Tải PNG Gốc Trong Suốt'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyImageToClipboard}
                  className="py-3 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                >
                  {copiedImage ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-cyan-400" />}
                  <span>{copiedImage ? 'Đã sao chép ảnh' : 'Sao chép ảnh'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyDataURL}
                  className="py-3 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                >
                  {copiedDataUrl ? <Check className="size-3.5 text-emerald-400" /> : <FileCheck className="size-3.5 text-amber-400" />}
                  <span>{copiedDataUrl ? 'Đã chép Base64' : 'Chép Base64 Data URL'}</span>
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
