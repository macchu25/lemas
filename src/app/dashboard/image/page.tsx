'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Maximize2,
  X,
  Layers,
  Wand2,
  Flame,
  ShieldCheck,
  Zap,
  Info,
  ChevronDown,
  Palette,
} from 'lucide-react';
import {
  generateImage,
  IMAGE_STYLES,
  ASPECT_RATIOS,
  AVAILABLE_MODELS,
  AspectRatio,
  GeneratedImageResult,
  waitForPuter,
  getPuterUser,
  signInPuter,
  signOutPuter,
} from '@/lib/puter';
import { useDashboard } from '@/components/dashboard/DashboardContext';

export default function ImageStudioPage() {
  const { t } = useDashboard();
  const [prompt, setPrompt] = useState('');
  const [customStyleText, setCustomStyleText] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('cinematic');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('16:9');
  const [selectedModel, setSelectedModel] = useState('gpt-image-2');
  const [loading, setLoading] = useState(false);
  const [puterReady, setPuterReady] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImageResult | null>(null);
  const [history, setHistory] = useState<GeneratedImageResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [puterUser, setPuterUser] = useState<any>(null);
  const [signingInPuter, setSigningInPuter] = useState(false);

  // Check Puter.js readiness & active account
  useEffect(() => {
    let mounted = true;
    waitForPuter(6000).then(async (ready) => {
      if (mounted) {
        setPuterReady(ready);
        if (ready) {
          try {
            const u = await getPuterUser();
            if (mounted && u) setPuterUser(u);
          } catch {}
        }
      }
    });

    // Load stored history if any
    try {
      const saved = localStorage.getItem('lemas_image_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {}

    return () => {
      mounted = false;
    };
  }, []);

  const handlePuterSignIn = async () => {
    setSigningInPuter(true);
    try {
      const u = await signInPuter();
      if (u) setPuterUser(u);
    } catch (err) {
      console.warn('Puter signin error:', err);
    } finally {
      setSigningInPuter(false);
    }
  };

  const handlePuterSignOut = async () => {
    await signOutPuter();
    setPuterUser(null);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      let combinedPrompt = prompt.trim();
      if (customStyleText.trim()) {
        combinedPrompt += `, art style: ${customStyleText.trim()}`;
      }

      const result = await generateImage(combinedPrompt, {
        model: selectedModel,
        ratio: selectedRatio,
        style: selectedStyle === 'custom' ? undefined : selectedStyle,
        negativePrompt: negativePrompt.trim() || undefined,
      });

      setCurrentImage(result);
      const updatedHistory = [result, ...history.filter((h) => h.url !== result.url)].slice(0, 16);
      setHistory(updatedHistory);
      try {
        localStorage.setItem('lemas_image_history', JSON.stringify(updatedHistory));
      } catch {}
    } catch (err: any) {
      console.error('Image Generation Error:', err);
      setError(err?.message || 'Không thể tạo ảnh, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!currentImage) return;
    navigator.clipboard.writeText(currentImage.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!currentImage) return;
    try {
      const a = document.createElement('a');
      a.href = currentImage.url;
      a.download = `lemas_ai_image_${Date.now()}.png`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(currentImage.url, '_blank');
    }
  };

  const applyPromptHelper = (text: string) => {
    if (!prompt) {
      setPrompt(text);
    } else {
      setPrompt(`${prompt}, ${text}`);
    }
  };

  return (
    <div className="h-full w-full rounded-2xl border border-white/[0.08] overflow-y-auto bg-[#0a0c12] shadow-2xl p-3 sm:p-5 lg:p-6 relative">
      <div className="space-y-6 w-full pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <Sparkles className="size-6 text-cyan-400 animate-pulse" />
                <span>{t.imageTitle || 'AI Image Studio'}</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300">
                Puter.js Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              {t.imageSub || 'Tạo tác phẩm nghệ thuật, concept art và hình ảnh siêu thực 8K với Puter.js AI & FLUX Edge Router'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-[#0e111a] text-xs text-slate-300">
              <div className="size-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
              <span className="font-mono font-medium">{t.puterConnected || 'Puter.js & FLUX AI Sẵn Sàng'}</span>
            </div>
          </div>
        </div>

        {/* Main Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <form onSubmit={handleGenerate} className="p-5 sm:p-6 rounded-3xl border border-white/[0.08] bg-[#0e111a] space-y-5 shadow-2xl">
              {/* Prompt Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Wand2 className="size-3.5 text-cyan-400" />
                    <span>{t.promptLabel || 'Mô tả ảnh (Prompt)'}</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {prompt.length}/1000
                  </span>
                </div>

                <textarea
                  required
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.promptPlaceholder || 'Ví dụ: Một chiến binh samurai cyberpunk đứng trên đỉnh tòa nhà Tokyo tương lai trong đêm mưa neon rực rỡ, góc máy cinematic 8k, phong cách anime makoto shinkai...'}
                  className="w-full p-4 rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400/60 focus:bg-white/[0.05] focus:outline-none transition-all resize-none font-sans"
                />

                {/* Prompt Suggestions Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Flame className="size-3 text-amber-400" /> {t.quickSuggestions || 'Gợi ý nhanh:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => applyPromptHelper('ánh sáng neon rực rỡ, góc nhìn rộng 35mm')}
                    className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all cursor-pointer"
                  >
                    + Neon Cinematic
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPromptHelper('chi tiết siêu thực 8k, ánh sáng hoàng hôn vàng')}
                    className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all cursor-pointer"
                  >
                    + Golden Hour 8K
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPromptHelper('phong cách vẽ tay anime studio ghibli')}
                    className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all cursor-pointer"
                  >
                    + Studio Ghibli
                  </button>
                </div>
              </div>

              {/* Style Presets + Custom Style Input */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="size-3.5 text-purple-400" />
                  <span>{t.artStyle || 'Phong Cách Nghệ Thuật (Art Style)'}</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {IMAGE_STYLES.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200 shadow-sm shadow-cyan-500/20'
                            : 'border-white/[0.07] bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{style.label}</span>
                        {isSelected && <Check className="size-3.5 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Art Style Input Field */}
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Palette className="size-3.5 text-pink-400" />
                    <span className="text-[11px] font-semibold text-slate-300">
                      {t.customStyle || 'Hoặc tự nhập phong cách nghệ thuật riêng (Custom Style):'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={customStyleText}
                    onChange={(e) => setCustomStyleText(e.target.value)}
                    placeholder={t.customStylePlaceholder || 'Ví dụ: Tranh màu nước Cyberpunk, Van Gogh Starry Night, tranh lụa cổ điển, phác thảo than chì...'}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500/60 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Maximize2 className="size-3.5 text-emerald-400" />
                  <span>{t.aspectRatio || 'Tỉ Lệ Khung Hình (Aspect Ratio)'}</span>
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((r) => {
                    const cfg = ASPECT_RATIOS[r];
                    const isSelected = selectedRatio === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRatio(r)}
                        className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200 shadow-sm shadow-emerald-500/20'
                            : 'border-white/[0.07] bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
                        }`}
                      >
                        <div>{r}</div>
                        <div className="text-[10px] font-normal text-slate-500 truncate">{cfg.label.split(' ')[1]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model & Advanced Settings Toggle */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Zap className="size-3.5 text-amber-400" />
                    <span>{t.modelGen || 'Mô hình Sinh Ảnh'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sliders className="size-3.5" />
                    <span>{showAdvanced ? (t.hideAdvanced || 'Ẩn nâng cao') : (t.advancedOptions || 'Nâng cao')}</span>
                    <ChevronDown className={`size-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_MODELS.map((m) => {
                    const isSelected = selectedModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedModel(m.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                          isSelected
                            ? 'border-amber-400/80 bg-amber-500/10 text-amber-100 shadow-sm shadow-amber-500/20'
                            : 'border-white/[0.07] bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold text-xs text-white">{m.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-amber-300">
                            {m.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">{m.provider}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Negative Prompt Expandable */}
                {showAdvanced && (
                  <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-black/40 space-y-2 animate-fade-in">
                    <label className="text-xs font-semibold text-slate-300">
                      {t.negativePromptLabel || 'Negative Prompt (Những chi tiết không muốn xuất hiện)'}
                    </label>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder={t.negativePlaceholder || 'blurry, distorted face, extra fingers, watermark, text, low quality'}
                      className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400/60"
                    />
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
                  <Info className="size-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white font-bold text-sm hover:opacity-95 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="size-4.5 animate-spin" />
                    <span>{t.generatingBtn || 'Đang khởi tạo tác phẩm với Puter.js AI...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4.5" />
                    <span>{t.generateBtn || 'Tạo Ảnh Ngay (Generate Image)'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Preview Card (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-5 sm:p-6 rounded-3xl border border-white/[0.08] bg-[#0e111a] space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ImageIcon className="size-3.5 text-cyan-400" />
                  <span>{t.resultTitle || 'Kết Quả Tác Phẩm'}</span>
                </h2>

                {currentImage && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyPrompt}
                      title={t.copyPrompt || 'Copy Prompt'}
                      className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    </button>
                    <button
                      onClick={() => setLightboxOpen(true)}
                      title="Xem toàn màn hình"
                      className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="size-3.5" />
                    </button>
                    <button
                      onClick={handleDownload}
                      title={t.downloadBtn || 'Tải ảnh độ phân giải cao'}
                      className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer"
                    >
                      <Download className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Image Box */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/60 aspect-[16/10] flex items-center justify-center group">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="relative size-14">
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
                      <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-indigo-400 border-b-purple-400 border-l-transparent animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white">Đang xử lý hình ảnh...</p>
                      <p className="text-[11px] text-slate-400">Puter.js Neural Renderer đang tính toán các vector chi tiết</p>
                    </div>
                  </div>
                ) : currentImage ? (
                  <>
                    <img
                      src={currentImage.url}
                      alt={currentImage.prompt}
                      onClick={() => setLightboxOpen(true)}
                      className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-white/10">
                      {currentImage.source} • {currentImage.ratio}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-500">
                    <ImageIcon className="size-10 opacity-30" />
                    <p className="text-xs font-medium text-slate-400">{t.noImageYet || 'Chưa có ảnh nào được tạo'}</p>
                    <p className="text-[11px] text-slate-600">{t.noImageSub || 'Nhập mô tả ở khung bên trái và bấm Tạo Ảnh Ngay'}</p>
                  </div>
                )}
              </div>

              {/* Metadata Pill */}
              {currentImage && (
                <div className="space-y-2 pt-1 text-xs">
                  <p className="text-slate-200 line-clamp-2 font-sans font-medium bg-white/[0.03] p-3 rounded-xl border border-white/[0.08] text-xs leading-relaxed">
                    &ldquo;{currentImage.prompt}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{t.modelGen || 'Mô hình'}: <strong className="text-cyan-300 font-mono font-semibold">{currentImage.model}</strong></span>
                    <span>{t.aspectRatio || 'Tỉ lệ'}: <strong className="text-slate-200 font-mono font-semibold">{currentImage.ratio}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* History Gallery */}
            {history.length > 0 && (
              <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#0e111a] space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {t.historyTitle || 'Lịch Sử Trong Phiên'} ({history.length})
                  </span>
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('lemas_image_history');
                    }}
                    className="text-[10px] text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    {t.clearHistory || 'Xóa lịch sử'}
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {history.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImage(item)}
                      className={`relative rounded-xl overflow-hidden aspect-square border transition-all cursor-pointer ${
                        currentImage?.url === item.url
                          ? 'border-cyan-400 scale-95 shadow-md shadow-cyan-500/30'
                          : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Lightbox Modal */}
        {lightboxOpen && currentImage && (
          <div
            onClick={() => setLightboxOpen(false)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          >
            <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center gap-3">
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="size-5" />
              </button>
              <img
                src={currentImage.url}
                alt={currentImage.prompt}
                className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/10"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg transition-all"
                >
                  <Download className="size-4" />
                  <span>{t.downloadBtn || 'Tải Ảnh Xuống'}</span>
                </button>
                <button
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition-all"
                >
                  <Copy className="size-4" />
                  <span>{copied ? 'Đã Copy' : (t.copyPrompt || 'Copy Prompt')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
