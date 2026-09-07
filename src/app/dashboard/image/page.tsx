'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Crown,
  Lock,
  ArrowRight,
} from 'lucide-react';
import {
  generateMachGenImage,
  IMAGE_STYLES,
  ASPECT_RATIOS,
  AVAILABLE_MODELS,
  AspectRatio,
  GeneratedImageResult,
} from '@/lib/machgen';
import { useDashboard } from '@/components/dashboard/DashboardContext';

export default function ImageStudioPage() {
  const { user, t, setTopupModalOpen } = useDashboard();
  const [prompt, setPrompt] = useState('');
  const [customStyleText, setCustomStyleText] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('cinematic');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('16:9');
  const [selectedModel, setSelectedModel] = useState('flux');
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImageResult | null>(null);
  const [history, setHistory] = useState<GeneratedImageResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Check if user has an active subscription plan (Non-free plan or Admin)
  const isSubscribed = Boolean(
    user &&
      (user.role === 'admin' ||
        (user.plan &&
          user.plan.toLowerCase() !== 'free' &&
          user.plan.toLowerCase() !== 'trial' &&
          user.plan.trim() !== ''))
  );

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lemas_machgen_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    if (!isSubscribed) {
      setError('Tính năng Tạo Ảnh MachGen Ultra yêu cầu tài khoản có gói đăng ký (Pro, VIP, Enterprise). Vui lòng nâng cấp gói để tiếp tục!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateMachGenImage(prompt, {
        ratio: selectedRatio,
        style: selectedStyle,
        model: selectedModel,
        negativePrompt: negativePrompt.trim() || undefined,
        seed: seed || Math.floor(Math.random() * 9999999),
      });

      setCurrentImage(result);

      // Save to local history
      setHistory((prev) => {
        const next = [result, ...prev.filter((item) => item.url !== result.url)].slice(0, 30);
        try {
          localStorage.setItem('lemas_machgen_history', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err: any) {
      console.error('MachGen Generation Error:', err);
      setError(err?.message || 'Không thể tạo ảnh, vui lòng thử lại sau giây lát.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (img: GeneratedImageResult) => {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = `machgen_${img.model}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const activeModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];
  const activeRatioObj = ASPECT_RATIOS[selectedRatio] || ASPECT_RATIOS['16:9'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-teal-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Sparkles className="size-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              MachGen AI Studio
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300">
                Ultra HD
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Studio sáng tạo hình ảnh điện ảnh 4K độ phân giải cao sử dụng công nghệ MachGen FLUX.1 & Turbo Engine.
          </p>
        </div>

        {/* Plan Status Badge */}
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold shadow-md">
              <Crown className="size-4 text-amber-400" />
              <span>Gói {user?.plan ? user.plan.toUpperCase() : 'VIP'}: Tạo ảnh không giới hạn</span>
            </div>
          ) : (
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-all shadow-lg shadow-amber-500/10"
            >
              <Crown className="size-4 text-amber-400" />
              <span>Nâng cấp Gói để Tạo Ảnh</span>
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* VIP Subscription Requirement Alert for Free Users */}
      {!isSubscribed && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-950/20 to-cyan-950/20 p-5 backdrop-blur-xl shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 shadow-lg shadow-amber-500/20">
                <Lock className="size-6" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                  Dành riêng cho Thành viên có Gói Đăng Ký
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500 text-black">
                    PRO / VIP
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Tài khoản của bạn hiện là gói Miễn phí. Hãy nâng cấp lên gói Lemas Pro hoặc VIP để mở khóa MachGen AI Studio với khả năng tạo ảnh 4K không giới hạn lượt tạo!
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/billing"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Crown className="size-4" />
              <span>Nâng cấp Gói Ngay</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generator Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Prompt Input Box */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b0e14]/90 backdrop-blur-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Wand2 className="size-4 text-cyan-400" />
                Mô tả bức ảnh của bạn (Prompt)
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {prompt.length} ký tự
              </span>
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: Một nàng tiên cá tóc vàng lấp lánh bơi giữa rạn san hô phát quang neon, phong cách điện ảnh 8K, ánh sáng lung linh dưới nước..."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs md:text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
              />
            </div>

            {/* Quick Inspiration Prompts */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
                Gợi ý:
              </span>
              {[
                'Cyberpunk Tokyo samurai in rainy neon street',
                'Cô gái anime ngồi đọc sách bên quán cà phê mùa thu Đà Lạt',
                'Majestic golden dragon flying over floating fantasy islands',
                'Hyperrealistic 3D cute robotic cat playing with yarn',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(sample)}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all truncate max-w-[240px]"
                >
                  {sample}
                </button>
              ))}
            </div>

            {/* Model Selection Tabs */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Zap className="size-3.5 text-amber-400" />
                Mô hình tạo ảnh (MachGen AI Model)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_MODELS.map((m) => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-cyan-500/60 bg-cyan-500/10 text-white shadow-lg shadow-cyan-500/10'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-slate-100">{m.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-cyan-500 text-black' : 'bg-white/10 text-slate-400'
                        }`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Art Styles Selection */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Palette className="size-3.5 text-cyan-400" />
                Phong cách nghệ thuật (Art Style)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {IMAGE_STYLES.map((st) => {
                  const isSelected = selectedStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStyle(st.id)}
                      className={`text-xs font-medium py-2 px-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200 font-bold shadow-md shadow-cyan-500/10'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio Selection */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Sliders className="size-3.5 text-emerald-400" />
                Tỷ lệ khung hình (Aspect Ratio)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((ratioKey) => {
                  const isSelected = selectedRatio === ratioKey;
                  const ratioInfo = ASPECT_RATIOS[ratioKey];
                  return (
                    <button
                      key={ratioKey}
                      type="button"
                      onClick={() => setSelectedRatio(ratioKey)}
                      className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold shadow-md shadow-emerald-500/10'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{ratioKey}</span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                        {ratioInfo.pxW}x{ratioInfo.pxH}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Settings Accordion */}
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
              >
                <ChevronDown className={`size-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                Tùy chỉnh nâng cao (Negative Prompt & Seed)
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3 p-3.5 rounded-xl bg-black/30 border border-white/[0.05]">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Negative Prompt (Chi tiết không muốn xuất hiện):
                    </label>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="blurry, distorted face, extra limbs, low quality, bad anatomy"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Seed ngẫu nhiên (hoặc cố định để tái tạo lại ảnh):
                    </label>
                    <input
                      type="number"
                      value={seed || ''}
                      onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Tự động sinh seed ngẫu nhiên..."
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Info className="size-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
                {!isSubscribed && (
                  <Link
                    href="/dashboard/billing"
                    className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 text-[11px] font-bold shrink-0"
                  >
                    Nâng cấp
                  </Link>
                )}
              </div>
            )}

            {/* Action Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !prompt.trim() || !isSubscribed}
                className={`w-full py-3.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                  !isSubscribed
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    : loading || !prompt.trim()
                    ? 'bg-cyan-500/40 text-cyan-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-black hover:brightness-110 active:scale-[0.99] shadow-cyan-500/20'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="size-4 animate-spin text-black" />
                    <span>MachGen đang xử lý render 4K ({activeModelObj.name})...</span>
                  </>
                ) : !isSubscribed ? (
                  <>
                    <Lock className="size-4" />
                    <span>Mở khóa gói cước để Tạo ảnh MachGen</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>Tạo Ảnh Ngay (MachGen Ultra)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Image Preview Canvas & History (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Viewport Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b0e14]/90 backdrop-blur-xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ImageIcon className="size-4 text-emerald-400" />
                Kết quả hiển thị (Canvas)
              </span>
              {currentImage && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentImage.ratio} • {currentImage.model}
                </span>
              )}
            </div>

            {/* Display Area */}
            <div className="relative w-full rounded-xl overflow-hidden bg-black/60 border border-white/[0.05] min-h-[360px] flex items-center justify-center group">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="relative size-16">
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
                    <div className="relative size-16 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin flex items-center justify-center">
                      <Sparkles className="size-6 text-cyan-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Đang khởi tạo bức ảnh...</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Thời gian xử lý từ 2 – 5 giây</p>
                  </div>
                </div>
              ) : currentImage ? (
                <>
                  <img
                    src={currentImage.url}
                    alt={currentImage.prompt}
                    className="w-full h-auto max-h-[520px] object-contain rounded-xl transition-all"
                  />

                  {/* Hover Overlay Controls */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition-all"
                        title="Xem toàn màn hình"
                      >
                        <Maximize2 className="size-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-200 line-clamp-2 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/10">
                        {currentImage.prompt}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownload(currentImage)}
                          className="flex-1 py-2 px-3 rounded-lg bg-cyan-500 text-black text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-110 shadow-lg shadow-cyan-500/20"
                        >
                          <Download className="size-3.5" />
                          <span>Tải ảnh về</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyPrompt(currentImage.prompt)}
                          className="p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
                          title="Sao chép prompt"
                        >
                          {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 text-slate-500">
                  <div className="size-14 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-slate-600">
                    <ImageIcon className="size-7" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">Chưa có bức ảnh nào được tạo</p>
                  <p className="text-[11px] text-slate-600 max-w-[220px]">
                    Nhập mô tả ở khung bên trái và bấm Tạo Ảnh để bắt đầu.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Local History Thumbnails */}
          {history.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0b0e14]/90 backdrop-blur-xl p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="size-3.5 text-cyan-400" />
                  Lịch sử tạo gần đây ({history.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('lemas_machgen_history');
                  }}
                  className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
                >
                  Xóa lịch sử
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentImage(item);
                      setPrompt(item.prompt);
                    }}
                    className="relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-cyan-500/60 transition-all group/item"
                  >
                    <img
                      src={item.url}
                      alt={item.prompt}
                      className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                      <Sparkles className="size-3.5 text-cyan-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && currentImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
          >
            <X className="size-5" />
          </button>

          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-4">
            <img
              src={currentImage.url}
              alt={currentImage.prompt}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <div className="flex items-center gap-3 bg-black/80 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/15">
              <p className="text-xs text-slate-300 max-w-xl truncate">{currentImage.prompt}</p>
              <button
                type="button"
                onClick={() => handleDownload(currentImage)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-bold flex items-center gap-1.5 hover:brightness-110 shrink-0"
              >
                <Download className="size-3.5" />
                Tải về
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
