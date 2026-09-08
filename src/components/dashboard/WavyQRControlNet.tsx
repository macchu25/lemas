'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Waves,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Eye,
  Layers,
  ArrowRight,
  UploadCloud,
  FileCode,
  Maximize2,
  CheckCircle2,
  Zap,
  RotateCw,
  Palette,
  Info,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import { processQRTransparency, getSampleQR, QRTransResponse } from '@/lib/api';

export interface WavyQRControlNetProps {
  initialQRUrl?: string;
  initialPayload?: string;
  onSendToGenerator?: (file: File, dataUrl: string, promptSuggestion?: string) => void;
  onBackToGallery?: () => void;
}

export type WaveStyle =
  | 'sine_stream'
  | 'silk_ribbon'
  | 'radial_ripple'
  | 'topographic'
  | 'cyber_circuit'
  | 'liquid_drops';

export type ColorPreset =
  | 'controlnet_bw'
  | 'controlnet_invert'
  | 'transparent_black'
  | 'cyber_cyan'
  | 'gold_silk'
  | 'emerald_nature'
  | 'sunset_coral';

export type FinderStyle = 'rounded_rings' | 'organic_circles' | 'classic' | 'flowing';

export default function WavyQRControlNet({
  initialQRUrl,
  initialPayload,
  onSendToGenerator,
  onBackToGallery,
}: WavyQRControlNetProps) {
  // Input source states
  const [sourceDataUrl, setSourceDataUrl] = useState<string>(initialQRUrl || '');
  const [sourcePayload, setSourcePayload] = useState<string>(initialPayload || '');
  const [loadingSample, setLoadingSample] = useState<boolean>(false);
  const [isProcessingSource, setIsProcessingSource] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wavy Parameters
  const [waveStyle, setWaveStyle] = useState<WaveStyle>('sine_stream');
  const [amplitude, setAmplitude] = useState<number>(14); // 0 - 40
  const [frequency, setFrequency] = useState<number>(8); // 1 - 30
  const [strokeWidth, setStrokeWidth] = useState<number>(6); // 1 - 20
  const [angleDeg, setAngleDeg] = useState<number>(0); // 0, 45, 90, 135, etc.
  const [phase, setPhase] = useState<number>(0); // 0 - 360
  const [smoothness, setSmoothness] = useState<number>(80); // 0 - 100%
  const [edgeBlur, setEdgeBlur] = useState<number>(0); // 0 - 15px
  const [colorPreset, setColorPreset] = useState<ColorPreset>('controlnet_bw');
  const [finderStyle, setFinderStyle] = useState<FinderStyle>('rounded_rings');
  const [invertGrid, setInvertGrid] = useState<boolean>(false);

  // Preview & output
  const [previewTab, setPreviewTab] = useState<'wavy' | 'split' | 'simulation'>('wavy');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [simBackground, setSimBackground] = useState<'wave_ocean' | 'gold_silk' | 'cyber_neon' | 'marble'>('wave_ocean');
  const [outputDataUrl, setOutputDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  // Prompt suggestions based on wavy style
  const promptSuggestions = [
    {
      label: 'Japanese Ocean Waves (Ukiyo-e)',
      style: 'sine_stream',
      prompt: 'masterpiece, traditional Japanese ukiyo-e woodblock print, roaring Great Wave off Kanagawa, flowing indigo and teal curved sea foam, golden sunset clouds, hyper-detailed, award winning art',
    },
    {
      label: 'Liquid Gold Silk & Marble',
      style: 'silk_ribbon',
      prompt: 'luxurious organic liquid gold flowing waves, black imperial marble veins, elegant silk ribbons undulating, soft studio cinematic lighting, 8k resolution, octane render',
    },
    {
      label: 'Cyberpunk Neon Ripple',
      style: 'radial_ripple',
      prompt: 'cyberpunk sci-fi holographic energy ripples, neon cyan and magenta flowing laser pathways, dark reflective futuristic floor, volumetric neon glow, trending on artstation',
    },
    {
      label: 'Topographic Emerald Terraces',
      style: 'topographic',
      prompt: 'aerial view of terraced emerald rice fields and winding mountain river contours, misty morning fog, sunlight rays piercing through bamboo forest, photorealistic landscape',
    },
  ];

  // Initialize with sample if empty
  useEffect(() => {
    if (!sourceDataUrl) {
      handleLoadSample();
    } else {
      loadSourceImage(sourceDataUrl);
    }
  }, []);

  // Update when initialQRUrl changes from parent
  useEffect(() => {
    if (initialQRUrl && initialQRUrl !== sourceDataUrl) {
      setSourceDataUrl(initialQRUrl);
      loadSourceImage(initialQRUrl);
    }
  }, [initialQRUrl]);

  // Load sample QR
  const handleLoadSample = async () => {
    try {
      setLoadingSample(true);
      const res = await getSampleQR('https://nornai.com/artqr-controlnet-wavy', 512);
      if (res && res.data_url) {
        setSourceDataUrl(res.data_url);
        setSourcePayload(res.payload || 'https://nornai.com/artqr-controlnet-wavy');
        loadSourceImage(res.data_url);
      }
    } catch (e) {
      console.warn('Failed to load sample QR:', e);
    } finally {
      setLoadingSample(false);
    }
  };

  // Process uploaded image file
  const handleFileUpload = async (file: File) => {
    setIsProcessingSource(true);
    try {
      // Run transparency isolation to get clean transparent QR modules
      const res: QRTransResponse = await processQRTransparency(file, {
        crop_mode: 'crop',
        threshold: 215,
        validate: false,
      });

      if (res && res.dataUrl) {
        setSourceDataUrl(res.dataUrl);
        if (res.outputPayload) setSourcePayload(res.outputPayload);
        loadSourceImage(res.dataUrl);
      } else {
        const objUrl = URL.createObjectURL(file);
        setSourceDataUrl(objUrl);
        loadSourceImage(objUrl);
      }
    } catch (err) {
      console.error('Transparency process error:', err);
      const objUrl = URL.createObjectURL(file);
      setSourceDataUrl(objUrl);
      loadSourceImage(objUrl);
    } finally {
      setIsProcessingSource(false);
    }
  };

  const loadSourceImage = (url: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      sourceImageRef.current = img;
      renderWavyQR();
    };
    img.src = url;
  };

  // Main Wavy Line QR ControlNet Engine
  const renderWavyQR = useCallback(() => {
    const canvas = canvasRef.current;
    const img = sourceImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 1024;
    canvas.width = size;
    canvas.height = size;

    // 1. Analyze input image modules
    const tempCanvas = document.createElement('canvas');
    const gridSize = 45; // sample resolution grid
    tempCanvas.width = gridSize;
    tempCanvas.height = gridSize;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(img, 0, 0, gridSize, gridSize);
    const imgData = tempCtx.getImageData(0, 0, gridSize, gridSize);
    const pixels = imgData.data;

    // Create binary module matrix
    const matrix: boolean[][] = [];
    for (let y = 0; y < gridSize; y++) {
      matrix[y] = [];
      for (let x = 0; x < gridSize; x++) {
        const idx = (y * gridSize + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const a = pixels[idx + 3];

        // Dark module detection: either high alpha with dark luminance, or dark in general
        const isDark = a > 50 && (r + g + b) / 3 < 180;
        matrix[y][x] = invertGrid ? !isDark : isDark;
      }
    }

    // 2. Setup Background Color based on colorPreset
    let bgColor = '#ffffff';
    let strokeColor = '#000000';
    let isTransparentBg = false;

    switch (colorPreset) {
      case 'controlnet_bw':
        bgColor = '#ffffff';
        strokeColor = '#000000';
        break;
      case 'controlnet_invert':
        bgColor = '#000000';
        strokeColor = '#ffffff';
        break;
      case 'transparent_black':
        isTransparentBg = true;
        strokeColor = '#0a0d14';
        break;
      case 'cyber_cyan':
        bgColor = '#080c14';
        strokeColor = '#00f0ff';
        break;
      case 'gold_silk':
        bgColor = '#0f0e0c';
        strokeColor = '#ffd066';
        break;
      case 'emerald_nature':
        bgColor = '#06140e';
        strokeColor = '#10e78c';
        break;
      case 'sunset_coral':
        bgColor = '#14080a';
        strokeColor = '#ff5e62';
        break;
    }

    ctx.clearRect(0, 0, size, size);
    if (!isTransparentBg) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);
    }

    if (edgeBlur > 0) {
      ctx.filter = `blur(${edgeBlur}px)`;
    } else {
      ctx.filter = 'none';
    }

    const rad = (angleDeg * Math.PI) / 180;
    const phaseRad = (phase * Math.PI) / 180;
    const cellWidth = size / gridSize;
    const cellHeight = size / gridSize;

    // Helper: is this cell in the 3 standard Finder Pattern zones?
    // Top-left (0..8, 0..8), Top-right (gridSize-9..gridSize-1, 0..8), Bottom-left (0..8, gridSize-9..gridSize-1)
    const isFinderZone = (gx: number, gy: number): boolean => {
      const margin = 8;
      const inTL = gx < margin && gy < margin;
      const inTR = gx >= gridSize - margin && gy < margin;
      const inBL = gx < margin && gy >= gridSize - margin;
      return inTL || inTR || inBL;
    };

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 3. Render Wavy Transformations according to waveStyle
    if (waveStyle === 'sine_stream') {
      // Continuous sinusoidal lines across grid rows or columns
      const lineCount = gridSize * 2;
      const step = size / lineCount;

      for (let l = 0; l < lineCount; l++) {
        const baseY = l * step;
        ctx.beginPath();
        let isDrawing = false;

        for (let x = 0; x <= size; x += 6) {
          // Calculate grid coordinates with wave offset
          const waveOffset = amplitude * Math.sin((x / size) * frequency * Math.PI * 2 + phaseRad + (l * 0.1));
          const y = baseY + waveOffset;

          // Rotate coordinate back to check grid matrix
          const rotX = Math.cos(-rad) * (x - size / 2) - Math.sin(-rad) * (y - size / 2) + size / 2;
          const rotY = Math.sin(-rad) * (x - size / 2) + Math.cos(-rad) * (y - size / 2) + size / 2;

          const gx = Math.floor(rotX / cellWidth);
          const gy = Math.floor(rotY / cellHeight);

          const isActive = gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize && matrix[gy][gx];
          const inFinder = isFinderZone(gx, gy);

          if (inFinder && finderStyle !== 'flowing') {
            // Handled separately by finder pattern drawer
            if (isDrawing) {
              ctx.stroke();
              ctx.beginPath();
              isDrawing = false;
            }
            continue;
          }

          if (isActive) {
            if (!isDrawing) {
              ctx.moveTo(x, y);
              isDrawing = true;
            } else {
              ctx.lineTo(x, y);
            }
          } else {
            if (isDrawing) {
              ctx.lineTo(x, y);
              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = strokeWidth;
              ctx.stroke();
              ctx.beginPath();
              isDrawing = false;
            }
          }
        }

        if (isDrawing) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }
      }
    } else if (waveStyle === 'silk_ribbon') {
      // Fluid smooth Bezier ribbon curves connecting adjacent active modules
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          if (!matrix[y][x]) continue;
          if (isFinderZone(x, y) && finderStyle !== 'flowing') continue;

          const cx = (x + 0.5) * cellWidth;
          const cy = (y + 0.5) * cellHeight;

          const waveX = amplitude * Math.sin((cy / size) * frequency * Math.PI + phaseRad);
          const waveY = amplitude * Math.cos((cx / size) * frequency * Math.PI + phaseRad);

          ctx.beginPath();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth * 1.2;

          const cp1x = cx + waveX;
          const cp1y = cy - cellHeight * 0.4 + waveY;
          const cp2x = cx - waveX;
          const cp2y = cy + cellHeight * 0.4 - waveY;

          ctx.moveTo(cx - cellWidth * 0.4, cy);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cx + cellWidth * 0.4, cy);
          ctx.stroke();

          // Connect to neighbor below if active
          if (y + 1 < gridSize && matrix[y + 1][x] && !isFinderZone(x, y + 1)) {
            const nextCy = (y + 1.5) * cellHeight;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.quadraticCurveTo(cx + waveX * 1.5, (cy + nextCy) / 2, cx, nextCy);
            ctx.stroke();
          }
        }
      }
    } else if (waveStyle === 'radial_ripple') {
      // Concentric circles modulated by wave and active modules
      const centerX = size / 2;
      const centerY = size / 2;
      const maxRadius = size * 0.72;
      const ringStep = strokeWidth * 2.2;

      for (let r = 10; r < maxRadius; r += ringStep) {
        const circumference = 2 * Math.PI * r;
        const angleStep = (2 * Math.PI) / Math.max(36, Math.floor(circumference / 6));

        ctx.beginPath();
        let isDrawing = false;

        for (let a = 0; a <= 2 * Math.PI + angleStep; a += angleStep) {
          const modR = r + amplitude * Math.sin(a * frequency + phaseRad);
          const x = centerX + modR * Math.cos(a + rad);
          const y = centerY + modR * Math.sin(a + rad);

          const gx = Math.floor(x / cellWidth);
          const gy = Math.floor(y / cellHeight);

          const isActive = gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize && matrix[gy][gx];
          const inFinder = isFinderZone(gx, gy);

          if (inFinder && finderStyle !== 'flowing') {
            if (isDrawing) {
              ctx.stroke();
              ctx.beginPath();
              isDrawing = false;
            }
            continue;
          }

          if (isActive) {
            if (!isDrawing) {
              ctx.moveTo(x, y);
              isDrawing = true;
            } else {
              ctx.lineTo(x, y);
            }
          } else {
            if (isDrawing) {
              ctx.lineTo(x, y);
              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = strokeWidth;
              ctx.stroke();
              ctx.beginPath();
              isDrawing = false;
            }
          }
        }

        if (isDrawing) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }
      }
    } else if (waveStyle === 'topographic') {
      // Iso-elevation wavy contour lines
      for (let y = 0; y < gridSize; y += 1) {
        ctx.beginPath();
        let drawing = false;

        for (let x = 0; x <= size; x += 4) {
          const rawGx = Math.floor(x / cellWidth);
          const rawGy = y;
          const isActive = rawGx >= 0 && rawGx < gridSize && matrix[rawGy][rawGx];
          const inFinder = isFinderZone(rawGx, rawGy);

          if (inFinder && finderStyle !== 'flowing') {
            if (drawing) {
              ctx.stroke();
              ctx.beginPath();
              drawing = false;
            }
            continue;
          }

          const elevationWave = amplitude * Math.sin((x / size) * frequency * 2 + y * 0.5 + phaseRad);
          const py = (y + 0.5) * cellHeight + (isActive ? elevationWave : 0);

          if (isActive) {
            if (!drawing) {
              ctx.moveTo(x, py);
              drawing = true;
            } else {
              ctx.lineTo(x, py);
            }
          } else {
            if (drawing) {
              ctx.lineTo(x, py);
              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = strokeWidth;
              ctx.stroke();
              ctx.beginPath();
              drawing = false;
            }
          }
        }

        if (drawing) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }
      }
    } else if (waveStyle === 'cyber_circuit') {
      // Tech circuits with smooth 45/90 deg curved bends
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          if (!matrix[y][x]) continue;
          if (isFinderZone(x, y) && finderStyle !== 'flowing') continue;

          const cx = (x + 0.5) * cellWidth;
          const cy = (y + 0.5) * cellHeight;
          const radius = (cellWidth * smoothness) / 200;

          ctx.fillStyle = strokeColor;
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;

          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(2, strokeWidth * 0.7), 0, Math.PI * 2);
          ctx.fill();

          // Connect to right or bottom
          if (x + 1 < gridSize && matrix[y][x + 1] && !isFinderZone(x + 1, y)) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo((x + 1.5) * cellWidth, cy);
            ctx.stroke();
          }
          if (y + 1 < gridSize && matrix[y + 1][x] && !isFinderZone(x, y + 1)) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, (y + 1.5) * cellHeight);
            ctx.stroke();
          }
        }
      }
    } else if (waveStyle === 'liquid_drops') {
      // Soft organic rounded droplet capsules
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          if (!matrix[y][x]) continue;
          if (isFinderZone(x, y) && finderStyle !== 'flowing') continue;

          const cx = (x + 0.5) * cellWidth;
          const cy = (y + 0.5) * cellHeight;
          const dropR = (cellWidth * 0.48 * smoothness) / 100;
          const waveOffset = (amplitude * 0.4) * Math.sin((x + y) * 0.4 + phaseRad);

          ctx.fillStyle = strokeColor;
          ctx.beginPath();
          ctx.arc(cx + waveOffset, cy + waveOffset, Math.max(3, dropR), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 4. Draw Finder Patterns (3 Corners) according to finderStyle
    const drawFinderPattern = (originX: number, originY: number) => {
      const boxSize = cellWidth * 7;
      const centerBoxX = originX + boxSize / 2;
      const centerBoxY = originY + boxSize / 2;

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;

      if (finderStyle === 'rounded_rings') {
        // Outer concentric rounded ring
        ctx.lineWidth = strokeWidth * 1.5;
        const outerR = boxSize * 0.42;
        ctx.beginPath();
        ctx.arc(centerBoxX, centerBoxY, outerR, 0, Math.PI * 2);
        ctx.stroke();

        // Inner solid core circle
        const innerR = boxSize * 0.22;
        ctx.beginPath();
        ctx.arc(centerBoxX, centerBoxY, innerR, 0, Math.PI * 2);
        ctx.fill();
      } else if (finderStyle === 'organic_circles') {
        // Wavy organic rings
        const outerR = boxSize * 0.44;
        ctx.lineWidth = strokeWidth * 1.4;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          const rMod = outerR + (amplitude * 0.3) * Math.sin(a * 4 + phaseRad);
          const px = centerBoxX + rMod * Math.cos(a);
          const py = centerBoxY + rMod * Math.sin(a);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(centerBoxX, centerBoxY, boxSize * 0.20, 0, Math.PI * 2);
        ctx.fill();
      } else if (finderStyle === 'classic') {
        // Crisp standard QR finder box
        ctx.lineWidth = cellWidth;
        ctx.strokeRect(originX + cellWidth * 0.5, originY + cellWidth * 0.5, boxSize - cellWidth, boxSize - cellWidth);
        ctx.fillRect(originX + cellWidth * 2, originY + cellWidth * 2, cellWidth * 3, cellWidth * 3);
      }
      ctx.restore();
    };

    if (finderStyle !== 'flowing') {
      drawFinderPattern(0, 0); // Top-Left
      drawFinderPattern((gridSize - 7) * cellWidth, 0); // Top-Right
      drawFinderPattern(0, (gridSize - 7) * cellHeight); // Bottom-Left
    }

    // Save final rendered data URL
    const finalUrl = canvas.toDataURL('image/png');
    setOutputDataUrl(finalUrl);
  }, [
    waveStyle,
    amplitude,
    frequency,
    strokeWidth,
    angleDeg,
    phase,
    smoothness,
    edgeBlur,
    colorPreset,
    finderStyle,
    invertGrid,
  ]);

  // Re-render when parameters change
  useEffect(() => {
    if (sourceImageRef.current) {
      renderWavyQR();
    }
  }, [renderWavyQR]);

  // Download Wavy PNG
  const handleDownloadPNG = () => {
    if (!outputDataUrl) return;
    const a = document.createElement('a');
    a.href = outputDataUrl;
    a.download = `artqr_controlnet_wavy_${waveStyle}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy to clipboard
  const handleCopyImage = async () => {
    if (!outputDataUrl) return;
    try {
      const res = await fetch(outputDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      navigator.clipboard.writeText(outputDataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Copy prompt suggestion
  const handleCopyPrompt = (p: string) => {
    navigator.clipboard.writeText(p);
    setCopiedPrompt(p);
    setTimeout(() => setCopiedPrompt(null), 2500);
  };

  // Send to ArtQR Generator
  const handleProceedToGenerator = () => {
    if (!outputDataUrl || !onSendToGenerator) return;

    // Convert dataUrl to File
    const binStr = atob(outputDataUrl.split(',')[1]);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    const file = new File([bytes], `wavy_controlnet_${Date.now()}.png`, { type: 'image/png' });

    // Pick appropriate prompt based on current style
    const matchingPrompt =
      promptSuggestions.find((p) => p.style === waveStyle)?.prompt ||
      'masterpiece, Japanese woodblock wave style, beautiful organic flowing curves, vibrant and sharp, 8k resolution';

    onSendToGenerator(file, outputDataUrl, matchingPrompt);
  };

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-gradient-to-tr from-cyan-500/25 via-blue-500/20 to-indigo-500/25 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 shrink-0">
            <Waves className="size-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Biến Đổi Nét Uốn Lượn • QR ControlNet Conditioning</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30">
                SD / ComfyUI / Monster QR Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chuyển mã QR đã tách nền thành các dải sóng uốn lượn, dải lụa mượt mà & đường đồng mức chuẩn ControlNet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {onBackToGallery && (
            <button
              type="button"
              onClick={onBackToGallery}
              className="px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all"
            >
              Về Kho Phong Cách
            </button>
          )}
          <button
            type="button"
            onClick={handleProceedToGenerator}
            disabled={!outputDataUrl}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>Đưa vào Phòng Tạo Ảnh</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Controls (5 cols) | Right Canvas & Previews (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: SOURCE & WAVE PARAMETERS */}
        <div className="lg:col-span-5 space-y-5">
          {/* Box 1: Input QR Source */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Mã QR Nguồn (Đã Tách Nền / Tự Động Tách)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={loadingSample}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1 transition-all"
              >
                {loadingSample ? <RefreshCw className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                <span>Mẫu Demo</span>
              </button>
            </div>

            {/* Drag & drop upload area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
              />

              {isProcessingSource ? (
                <div className="py-4 flex flex-col items-center gap-2 text-xs text-cyan-400">
                  <RefreshCw className="size-6 animate-spin" />
                  <span>Đang tự động bóc tách nền trong suốt...</span>
                </div>
              ) : sourceDataUrl ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sourceDataUrl}
                    alt="Source QR"
                    className="size-16 object-contain rounded-lg border border-slate-700 bg-[linear-gradient(45deg,#151921_25%,transparent_25%),linear-gradient(-45deg,#151921_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#151921_75%),linear-gradient(-45deg,transparent_75%,#151921_75%)] bg-[size:10px_10px] p-1 shrink-0"
                  />
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-emerald-400" />
                      <span>Đã nạp mã QR thành công</span>
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {sourcePayload || 'Sẵn sàng chuyển đổi nét uốn lượn'}
                    </p>
                    <span className="text-[10px] text-cyan-400 hover:underline">Bấm để đổi ảnh khác</span>
                  </div>
                </div>
              ) : (
                <div className="py-3">
                  <UploadCloud className="size-7 text-cyan-400 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-200 font-bold">Kéo thả hoặc bấm tải lên mã QR</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Hỗ trợ PNG trong suốt, JPG trắng đen, WebP</p>
                </div>
              )}
            </div>
          </div>

          {/* Box 2: Wave Pattern Algorithm Choice */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Thuật Toán Nét Uốn Lượn (Wave Pattern)
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'sine_stream',
                  title: 'Sóng Sin Dòng Chảy',
                  desc: 'Dải sóng uốn lượn mượt ngang/dọc',
                  icon: Waves,
                },
                {
                  id: 'silk_ribbon',
                  title: 'Ruy Băng Lụa Bezier',
                  desc: 'Đường cong hữu cơ mềm mại như lụa',
                  icon: Sparkles,
                },
                {
                  id: 'radial_ripple',
                  title: 'Gợn Sóng Lan Tỏa',
                  desc: 'Sóng tròn đồng tâm tỏa từ tâm QR',
                  icon: RotateCw,
                },
                {
                  id: 'topographic',
                  title: 'Đường Nét Địa Hình',
                  desc: 'Đường đồng mức uốn lượn đa tầng',
                  icon: Layers,
                },
                {
                  id: 'cyber_circuit',
                  title: 'Mạch Sóng Bo Cong',
                  desc: 'Nét bo góc 45° công nghệ hiện đại',
                  icon: Zap,
                },
                {
                  id: 'liquid_drops',
                  title: 'Giọt Nước Hữu Cơ',
                  desc: 'Khối tròn giọt nước lỏng nối kết',
                  icon: Sliders,
                },
              ].map((style) => {
                const Icon = style.icon;
                const isSelected = waveStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setWaveStyle(style.id as WaveStyle)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/15 to-blue-500/10 text-white shadow-md shadow-cyan-950/40'
                        : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`size-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold">{style.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{style.desc}</p>
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Box 3: Real-time Parameter Sliders */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center">
                  3
                </span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Thông Số Tinh Chỉnh Nét Sóng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAmplitude(14);
                  setFrequency(8);
                  setStrokeWidth(6);
                  setAngleDeg(0);
                  setPhase(0);
                  setSmoothness(80);
                  setEdgeBlur(0);
                }}
                className="text-[10px] text-slate-400 hover:text-cyan-300 underline"
              >
                Mặc định
              </button>
            </div>

            {/* Slider 1: Amplitude (Biên độ sóng) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>Biên độ uốn lượn (Amplitude)</span>
                  <span className="text-[10px] text-slate-500">Độ cong sóng</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold">{amplitude}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="35"
                step="1"
                value={amplitude}
                onChange={(e) => setAmplitude(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Slider 2: Frequency (Tần số sóng) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>Chu kỳ / Tần số sóng (Frequency)</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold">{frequency}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Slider 3: Stroke Width (Độ dày nét) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>Độ dày nét uốn (Line Thickness)</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold">{strokeWidth}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="16"
                step="1"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Angle & Phase Controls */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Hướng sóng</span>
                  <span className="font-mono text-cyan-400 text-[11px] font-bold">{angleDeg}°</span>
                </div>
                <div className="flex gap-1">
                  {[
                    { label: '0°', val: 0 },
                    { label: '45°', val: 45 },
                    { label: '90°', val: 90 },
                    { label: '135°', val: 135 },
                  ].map((ang) => (
                    <button
                      key={ang.val}
                      type="button"
                      onClick={() => setAngleDeg(ang.val)}
                      className={`flex-1 py-1 rounded-md text-[11px] font-bold border transition-all ${
                        angleDeg === ang.val
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {ang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Pha sóng (Seed)</span>
                  <span className="font-mono text-cyan-400 text-[11px] font-bold">{phase}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={phase}
                  onChange={(e) => setPhase(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-2"
                />
              </div>
            </div>

            {/* Finder Pattern style & Edge Softness */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold block">Mắt định vị 3 góc</label>
                <select
                  value={finderStyle}
                  onChange={(e) => setFinderStyle(e.target.value as FinderStyle)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="rounded_rings">Vòng tròn đồng tâm</option>
                  <option value="organic_circles">Sóng hữu cơ mềm</option>
                  <option value="classic">Vuông truyền thống</option>
                  <option value="flowing">Hòa quyện theo sóng</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Độ mờ viền (Soft Edge)</span>
                  <span className="font-mono text-cyan-400 text-[11px] font-bold">{edgeBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={edgeBlur}
                  onChange={(e) => setEdgeBlur(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-2"
                />
              </div>
            </div>

            {/* Color Schemes */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <label className="text-xs text-slate-300 font-semibold block">Bảng màu & Tương phản ControlNet</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'controlnet_bw', label: 'B/W Chuẩn', bg: 'bg-white text-black' },
                  { id: 'controlnet_invert', label: 'Đảo âm', bg: 'bg-black text-white border border-slate-700' },
                  { id: 'transparent_black', label: 'Trong suốt', bg: 'bg-slate-800 text-cyan-300' },
                  { id: 'cyber_cyan', label: 'Cyber Cyan', bg: 'bg-cyan-500/20 text-cyan-300' },
                  { id: 'gold_silk', label: 'Vàng Kim', bg: 'bg-amber-500/20 text-amber-300' },
                  { id: 'emerald_nature', label: 'Ngọc Lục', bg: 'bg-emerald-500/20 text-emerald-300' },
                  { id: 'sunset_coral', label: 'San Hô', bg: 'bg-rose-500/20 text-rose-300' },
                ].map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setColorPreset(col.id as ColorPreset)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all text-center ${col.bg} ${
                      colorPreset === col.id ? 'ring-2 ring-cyan-400 border-transparent shadow-sm' : 'opacity-70 hover:opacity-100 border-transparent'
                    }`}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE CANVAS, SIMULATION & EXPORT */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Preview Mode Selector */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPreviewTab('wavy')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    previewTab === 'wavy'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="size-3.5" />
                  <span>Nét Uốn Lượn HD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('split')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    previewTab === 'split'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="size-3.5" />
                  <span>So Sánh Trước / Sau</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('simulation')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    previewTab === 'simulation'
                      ? 'bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="size-3.5" />
                  <span>Mô Phỏng Trộn Ảnh AI</span>
                </button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold self-start sm:self-auto">
                <CheckCircle2 className="size-4" />
                <span>ControlNet Map 1024×1024 Sẵn Sàng</span>
              </div>
            </div>

            {/* Hidden Canvas for computation */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Main Interactive Display Area */}
            <div className="relative min-h-[420px] rounded-2xl border border-slate-800 bg-[#090c12] overflow-hidden flex items-center justify-center p-4">
              {/* Checkerboard backdrop */}
              <div className="absolute inset-0 opacity-40 pointer-events-none bg-[linear-gradient(45deg,#151921_25%,transparent_25%),linear-gradient(-45deg,#151921_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#151921_75%),linear-gradient(-45deg,transparent_75%,#151921_75%)] bg-[size:20px_20px]" />

              {/* TAB 1: Clean HD Wavy Canvas */}
              {previewTab === 'wavy' && (
                <div className="relative z-10 flex items-center justify-center max-h-[460px]">
                  {outputDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={outputDataUrl}
                      alt="Wavy QR Output"
                      className="max-h-[420px] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800/80"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <RefreshCw className="size-4 animate-spin" />
                      <span>Đang tạo bản đồ uốn lượn...</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Interactive Split Slider (Original Transparent QR vs Wavy ControlNet) */}
              {previewTab === 'split' && (
                <div className="relative z-10 w-full max-w-[420px] aspect-square rounded-xl overflow-hidden border border-slate-800 select-none">
                  {/* Background: Wavy output */}
                  {outputDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={outputDataUrl}
                      alt="Wavy QR"
                      className="absolute inset-0 w-full h-full object-contain bg-white"
                    />
                  )}

                  {/* Foreground: Original Transparent QR clipped by splitPos */}
                  {sourceDataUrl && (
                    <div
                      style={{ width: `${splitPos}%` }}
                      className="absolute inset-0 h-full overflow-hidden border-r-2 border-cyan-400 bg-[#0c1017] z-10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sourceDataUrl}
                        alt="Original Transparent QR"
                        className="w-[420px] max-w-none h-full object-contain p-4"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-cyan-400 text-[10px] font-bold border border-cyan-500/40">
                        QR Gốc Tách Nền
                      </span>
                    </div>
                  )}

                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-amber-400 text-[10px] font-bold border border-amber-500/40 z-0">
                    Nét Uốn Lượn ControlNet
                  </span>

                  {/* Slider interaction bar */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={splitPos}
                    onChange={(e) => setSplitPos(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
                  />
                </div>
              )}

              {/* TAB 3: Simulated AI ArtQR Blend Preview */}
              {previewTab === 'simulation' && (
                <div className="relative z-10 w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
                  {/* Artistic Simulated Backdrop */}
                  <div
                    className={`absolute inset-0 transition-all duration-500 ${
                      simBackground === 'wave_ocean'
                        ? 'bg-gradient-to-br from-blue-900 via-indigo-950 to-teal-900'
                        : simBackground === 'gold_silk'
                        ? 'bg-gradient-to-br from-amber-950 via-stone-900 to-yellow-950'
                        : simBackground === 'cyber_neon'
                        ? 'bg-gradient-to-br from-purple-950 via-slate-950 to-cyan-950'
                        : 'bg-gradient-to-br from-emerald-950 via-stone-900 to-teal-950'
                    }`}
                  >
                    {/* Simulated texture overlay */}
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
                  </div>

                  {/* Blended Wavy QR */}
                  {outputDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={outputDataUrl}
                      alt="Blend Preview"
                      style={{
                        mixBlendMode: colorPreset === 'controlnet_invert' ? 'screen' : 'multiply',
                        filter: 'contrast(1.2) brightness(0.95)',
                      }}
                      className="w-4/5 h-4/5 object-contain z-10 relative drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
                    />
                  )}

                  {/* Bottom Backdrop Switcher */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/10">
                    {[
                      { id: 'wave_ocean', label: '🌊 Sóng Biển' },
                      { id: 'gold_silk', label: '✨ Lụa Vàng' },
                      { id: 'cyber_neon', label: '⚡ Cyber Neon' },
                      { id: 'marble', label: '🏔️ Địa Hình' },
                    ].map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setSimBackground(bg.id as any)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          simBackground === bg.id
                            ? 'bg-cyan-500 text-black font-extrabold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar: Download PNG, Copy, Export to Generator */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadPNG}
                className="flex-1 min-w-[180px] py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
              >
                <Download className="size-4" />
                <span>Tải Ảnh ControlNet (PNG 1024px)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                className="py-3 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-cyan-400" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép ảnh'}</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToGenerator}
                className="py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
              >
                <Wand2 className="size-4" />
                <span>Tạo Ảnh Nghệ Thuật (AI Studio)</span>
              </button>
            </div>
          </div>

          {/* Box 4: Suggested Prompts for Stable Diffusion / ControlNet QR Monster */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="size-3.5 text-amber-400" />
                <span>Gợi Ý Prompt Tối Ưu Cho Nét Uốn Lượn ControlNet</span>
              </h3>
              <span className="text-[10px] text-slate-500">Bấm để sao chép prompt</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {promptSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCopyPrompt(item.prompt)}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-cyan-500/50 hover:bg-slate-900 transition-all cursor-pointer group relative"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                      {item.label}
                    </span>
                    {copiedPrompt === item.prompt ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="size-3" /> Đã sao chép
                      </span>
                    ) : (
                      <Copy className="size-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
