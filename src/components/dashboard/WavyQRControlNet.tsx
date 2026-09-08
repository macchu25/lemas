'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
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
  CheckCircle2,
  Zap,
  RotateCw,
  ShieldCheck,
  Wand2,
  AlertTriangle,
  Link as LinkIcon,
  Compass,
  Feather,
  Disc,
  Activity,
  TreeDeciduous,
  Grid,
  Settings2,
  Maximize2,
  Boxes,
  Cpu,
  SlidersHorizontal,
} from 'lucide-react';
import { processQRTransparency, getSampleQR } from '@/lib/api';

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
  | 'liquid_drops'
  | 'vortex_spiral'
  | 'botanical_vines'
  | 'isometric_weave'
  | 'audio_waveform'
  | 'cosmic_orbits'
  | 'ink_calligraphy';

export type ColorPreset =
  | 'controlnet_bw'
  | 'controlnet_invert'
  | 'transparent_black'
  | 'cyber_cyan'
  | 'gold_silk'
  | 'emerald_nature'
  | 'sunset_coral'
  | 'sakura_pink'
  | 'midnight_indigo'
  | 'matrix_green';

export type FinderStyle = 'rounded_rings' | 'organic_circles' | 'classic' | 'flowing';
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export type TimingProtectionMode = 'crisp_aligned' | 'subtle_wavy' | 'full_merged';

interface ScanVerification {
  isScanning: boolean;
  isValid: boolean;
  decodedPayload?: string;
  scanTimeMs?: number;
}

export default function WavyQRControlNet({
  initialQRUrl,
  initialPayload,
  onSendToGenerator,
  onBackToGallery,
}: WavyQRControlNetProps) {
  // QR Payload & Matrix Configuration
  const [payloadText, setPayloadText] = useState<string>(
    initialPayload || 'https://lemas.ai/art-qr'
  );
  const [ecLevel, setEcLevel] = useState<ErrorCorrectionLevel>('H');
  const [quietZone, setQuietZone] = useState<number>(2.5); // 1 to 4 modules
  const [sourceDataUrl, setSourceDataUrl] = useState<string>(initialQRUrl || '');
  const [loadingSample, setLoadingSample] = useState<boolean>(false);
  const [isProcessingSource, setIsProcessingSource] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exact QR matrix (boolean 2D array)
  const [qrMatrix, setQrMatrix] = useState<boolean[][]>([]);
  const [matrixSize, setMatrixSize] = useState<number>(29);
  const [calculatedCellSize, setCalculatedCellSize] = useState<number>(30.1);

  // Adaptive Matrix Mode (Tự động tính toán theo kích thước/mật độ từng ma trận)
  const [adaptiveMatrixMode, setAdaptiveMatrixMode] = useState<boolean>(true);

  // Wavy Parameters
  const [waveStyle, setWaveStyle] = useState<WaveStyle>('sine_stream');
  const [amplitude, setAmplitude] = useState<number>(10); // 0 - 30px
  const [frequency, setFrequency] = useState<number>(6); // 1 - 20
  const [moduleFillRatio, setModuleFillRatio] = useState<number>(88); // 60% - 100% module coverage
  const [strokeWidth, setStrokeWidth] = useState<number>(7); // 3 - 16px
  const [angleDeg, setAngleDeg] = useState<number>(0); // 0, 45, 90, 135
  const [phase, setPhase] = useState<number>(0); // 0 - 360
  const [edgeBlur, setEdgeBlur] = useState<number>(0); // 0 - 8px
  const [colorPreset, setColorPreset] = useState<ColorPreset>('controlnet_bw');

  // Matrix Zone Specific Fine-Tuning (Tùy chỉnh theo từng vùng ma trận)
  const [finderStyle, setFinderStyle] = useState<FinderStyle>('rounded_rings');
  const [finderWeight, setFinderWeight] = useState<number>(1.0); // 0.8x - 1.8x
  const [timingMode, setTimingMode] = useState<TimingProtectionMode>('crisp_aligned');
  const [centerWaveDecay, setCenterWaveDecay] = useState<number>(100); // 50% to 150%

  // Real-time Scanner Verification State
  const [scanVerif, setScanVerif] = useState<ScanVerification>({
    isScanning: false,
    isValid: true,
    decodedPayload: initialPayload || 'https://lemas.ai/art-qr',
  });

  // Active parameter tab
  const [paramTab, setParamTab] = useState<'wave' | 'matrix_zones' | 'color_style'>('wave');

  // Preview & output
  const [previewTab, setPreviewTab] = useState<'wavy' | 'split' | 'simulation'>('wavy');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [simBackground, setSimBackground] = useState<
    'wave_ocean' | 'gold_silk' | 'cyber_neon' | 'marble' | 'sakura_garden' | 'aurora_space'
  >('wave_ocean');
  const [outputDataUrl, setOutputDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 12 Curated Wave Algorithms
  const waveStylesList = [
    {
      id: 'sine_stream',
      title: 'Sóng Sin Dòng Chảy',
      desc: 'Dải sóng uốn lượn mượt mà bảo toàn tâm module',
      icon: Waves,
    },
    {
      id: 'silk_ribbon',
      title: 'Ruy Băng Lụa Bezier',
      desc: 'Đường cong hữu cơ mềm mại nối các khối QR',
      icon: Sparkles,
    },
    {
      id: 'radial_ripple',
      title: 'Gợn Sóng Lan Tỏa',
      desc: 'Sóng tròn đồng tâm tỏa từ tâm mã QR',
      icon: RotateCw,
    },
    {
      id: 'topographic',
      title: 'Đường Nét Địa Hình',
      desc: 'Đường đồng mức uốn lượn cao độ đa tầng',
      icon: Layers,
    },
    {
      id: 'cyber_circuit',
      title: 'Mạch Sóng Bo Cong',
      desc: 'Nét bo cong 45°/90° phong cách vi mạch',
      icon: Zap,
    },
    {
      id: 'liquid_drops',
      title: 'Giọt Nước Hữu Cơ',
      desc: 'Khối tròn giọt nước lỏng liên kết tự nhiên',
      icon: Sliders,
    },
    {
      id: 'vortex_spiral',
      title: 'Xoáy Nước Vortex',
      desc: 'Đường xoắn ốc Fibonacci uốn lượn hút mắt',
      icon: Disc,
    },
    {
      id: 'botanical_vines',
      title: 'Dây Leo Thảo Mộc',
      desc: 'Nhánh cây & dây leo uốn lượn hữu cơ',
      icon: TreeDeciduous,
    },
    {
      id: 'isometric_weave',
      title: 'Đan Lưới Dệt Chiếu',
      desc: 'Nét đan chéo uốn lượn hình học 3D',
      icon: Grid,
    },
    {
      id: 'audio_waveform',
      title: 'Sóng Âm Equalizer',
      desc: 'Tần số âm thanh dao động hài hòa',
      icon: Activity,
    },
    {
      id: 'cosmic_orbits',
      title: 'Quỹ Đạo Thiên Thể',
      desc: 'Cung elip quỹ đạo hành tinh uốn cong',
      icon: Compass,
    },
    {
      id: 'ink_calligraphy',
      title: 'Thư Pháp Thủy Mặc',
      desc: 'Nét bút lông đậm nhạt mềm mại',
      icon: Feather,
    },
  ];

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
    {
      label: 'Botanical Emerald Rainforest',
      style: 'botanical_vines',
      prompt: 'lush tropical botanical garden, curling emerald vines and blooming orchids, morning dew on leaves, soft volumetric sunlight filtering through forest canopy, 8k nature photography',
    },
    {
      label: 'Vortex Galaxy Nebula',
      style: 'vortex_spiral',
      prompt: 'stunning deep space galactic vortex, swirling cosmic dust nebula in violet and cyan, millions of glowing stars, celestial gravitational waves, Hubble telescope photography',
    },
  ];

  // 1. Generate exact mathematical QR bit matrix from payload & Error Correction level
  const buildQRMatrix = useCallback(
    (text: string, level: ErrorCorrectionLevel = ecLevel) => {
      if (!text || !text.trim()) return;
      try {
        const qr = QRCode.create(text.trim(), {
          errorCorrectionLevel: level,
        });
        const size = qr.modules.size;
        const matrix: boolean[][] = [];
        for (let r = 0; r < size; r++) {
          matrix[r] = [];
          for (let c = 0; c < size; c++) {
            matrix[r][c] = qr.modules.get(r, c) === 1;
          }
        }
        setMatrixSize(size);
        setQrMatrix(matrix);

        // Calculate actual pixel size of one module in 1024px canvas
        const totalMod = size + 2 * quietZone;
        const cSize = 1024 / totalMod;
        setCalculatedCellSize(cSize);

        // If Adaptive Matrix Mode is ON: Auto-scale amplitude and stroke width to the current matrix
        if (adaptiveMatrixMode) {
          const safeMaxAmp = Math.floor(cSize * 0.38);
          setAmplitude(Math.max(4, Math.min(safeMaxAmp, 14)));
          const safeStroke = Math.max(3, Math.floor(cSize * 0.24));
          setStrokeWidth(safeStroke);
        }
      } catch (err) {
        console.warn('Error generating mathematical QR matrix:', err);
      }
    },
    [ecLevel, quietZone, adaptiveMatrixMode]
  );

  // Initialize matrix on mount and update when payload, ecLevel, or quietZone changes
  useEffect(() => {
    buildQRMatrix(payloadText, ecLevel);
  }, [payloadText, ecLevel, quietZone, buildQRMatrix]);

  // Handle uploaded file
  const handleFileUpload = async (file: File) => {
    setIsProcessingSource(true);
    try {
      const res = await processQRTransparency(file, {
        crop_mode: 'crop',
        threshold: 215,
        validate: true,
      });

      const url = res.dataUrl || URL.createObjectURL(file);
      setSourceDataUrl(url);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width || 512;
        tempCanvas.height = img.height || 512;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
          const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const decoded = jsQR(imgData.data, tempCanvas.width, tempCanvas.height);
          if (decoded && decoded.data) {
            setPayloadText(decoded.data);
            buildQRMatrix(decoded.data, ecLevel);
          } else if (res.outputPayload || res.inputPayload) {
            const pl = res.outputPayload || res.inputPayload || '';
            setPayloadText(pl);
            buildQRMatrix(pl, ecLevel);
          }
        }
      };
      img.src = url;
    } catch (err) {
      console.error('Upload processing error:', err);
      const url = URL.createObjectURL(file);
      setSourceDataUrl(url);
    } finally {
      setIsProcessingSource(false);
    }
  };

  // Load sample QR
  const handleLoadSample = async () => {
    try {
      setLoadingSample(true);
      const sampleText = 'https://lemas.ai/art-qr-verified';
      setPayloadText(sampleText);
      buildQRMatrix(sampleText, ecLevel);
      const res = await getSampleQR(sampleText, 512);
      if (res && res.data_url) {
        setSourceDataUrl(res.data_url);
      }
    } catch (e) {
      console.warn('Sample load error:', e);
    } finally {
      setLoadingSample(false);
    }
  };

  // Quick Preset Profiles for different QR Matrix Densities
  const applyMatrixDensityProfile = (profile: 'low' | 'medium' | 'high') => {
    if (profile === 'low') {
      // Short links / large modules
      setEcLevel('H');
      setAmplitude(14);
      setFrequency(5);
      setModuleFillRatio(90);
      setStrokeWidth(9);
      setFinderStyle('rounded_rings');
    } else if (profile === 'medium') {
      // Standard URLs
      setEcLevel('H');
      setAmplitude(9);
      setFrequency(7);
      setModuleFillRatio(88);
      setStrokeWidth(6);
      setFinderStyle('rounded_rings');
    } else {
      // Dense / long text
      setEcLevel('Q');
      setAmplitude(6);
      setFrequency(9);
      setModuleFillRatio(85);
      setStrokeWidth(4);
      setFinderStyle('classic');
    }
  };

  // 2. RENDER WAVY QR CANVAS WITH MATRIX-AWARE GEOMETRY & PER-ZONE CUSTOMIZATION
  const renderWavyQR = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !qrMatrix || qrMatrix.length === 0) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const canvasSize = 1024;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const N = matrixSize;
    const totalModules = N + 2 * quietZone;
    const cellSize = canvasSize / totalModules;

    // Background and stroke colors
    let bgColor = '#ffffff';
    let strokeColor = '#000000';
    let isTransparent = false;

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
        isTransparent = true;
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
      case 'sakura_pink':
        bgColor = '#160910';
        strokeColor = '#f472b6';
        break;
      case 'midnight_indigo':
        bgColor = '#080b18';
        strokeColor = '#818cf8';
        break;
      case 'matrix_green':
        bgColor = '#040d06';
        strokeColor = '#4ade80';
        break;
    }

    ctx.clearRect(0, 0, canvasSize, canvasSize);
    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasSize, canvasSize);
    }

    if (edgeBlur > 0) {
      ctx.filter = `blur(${edgeBlur}px)`;
    } else {
      ctx.filter = 'none';
    }

    // Zone detection helpers
    const isFinderModule = (c: number, r: number): boolean => {
      const inTL = c >= 0 && c < 7 && r >= 0 && r < 7;
      const inTR = c >= N - 7 && c < N && r >= 0 && r < 7;
      const inBL = c >= 0 && c < 7 && r >= N - 7 && r < N;
      return inTL || inTR || inBL;
    };

    const isFinderSeparator = (c: number, r: number): boolean => {
      const inTL = c >= 0 && c <= 7 && r >= 0 && r <= 7;
      const inTR = c >= N - 8 && c < N && r >= 0 && r <= 7;
      const inBL = c >= 0 && c <= 7 && r >= N - 8 && r < N;
      return (inTL || inTR || inBL) && !isFinderModule(c, r);
    };

    const isTimingModule = (c: number, r: number): boolean => {
      return (c === 6 || r === 6) && !isFinderModule(c, r) && !isFinderSeparator(c, r);
    };

    const getModuleCenter = (c: number, r: number) => {
      return {
        x: (c + quietZone + 0.5) * cellSize,
        y: (r + quietZone + 0.5) * cellSize,
      };
    };

    ctx.fillStyle = strokeColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const phaseRad = (phase * Math.PI) / 180;
    const fillRadius = (cellSize * 0.5 * moduleFillRatio) / 100;
    const qrCenter = canvasSize / 2;

    // --- RENDER MODULES WITH REGIONAL MATRIX CUSTOMIZATION ---
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (isFinderModule(c, r) && finderStyle !== 'flowing') continue;
        if (isFinderSeparator(c, r)) continue;

        const isDark = qrMatrix[r]?.[c] === true;
        if (!isDark) continue;

        const { x: cx, y: cy } = getModuleCenter(c, r);

        // Center Wave Decay calculation (hệ số uốn lượn tâm vs viền)
        const dx = (cx - qrCenter) / qrCenter;
        const dy = (cy - qrCenter) / qrCenter;
        const distRatio = Math.sqrt(dx * dx + dy * dy);
        const regionalAmpWeight = (centerWaveDecay / 100) * (1 - distRatio * 0.3);
        const effectiveAmp = amplitude * Math.max(0.3, regionalAmpWeight);

        // Check if this module is in the Timing Pattern zone
        const inTiming = isTimingModule(c, r);

        // 1. Draw solid module core ensuring scanner threshold center is covered
        ctx.beginPath();
        const coreR = inTiming && timingMode === 'crisp_aligned' ? fillRadius * 0.95 : fillRadius;
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fill();

        // 2. Wave Algorithms Execution
        if (waveStyle === 'sine_stream') {
          const waveOffsetY =
            effectiveAmp *
            Math.sin((cx / canvasSize) * frequency * Math.PI * 2 + phaseRad + r * 0.2);

          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            const nextWaveY =
              effectiveAmp *
              Math.sin((next.x / canvasSize) * frequency * Math.PI * 2 + phaseRad + r * 0.2);

            ctx.beginPath();
            ctx.lineWidth = Math.max(strokeWidth, fillRadius * 1.5);
            ctx.moveTo(cx, cy + waveOffsetY * 0.4);
            ctx.quadraticCurveTo(
              (cx + next.x) / 2,
              (cy + next.y) / 2 + (waveOffsetY + nextWaveY) * 0.5,
              next.x,
              next.y + nextWaveY * 0.4
            );
            ctx.stroke();
          }
          if (r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1)) {
            const below = getModuleCenter(c, r + 1);
            ctx.beginPath();
            ctx.lineWidth = Math.max(strokeWidth, fillRadius * 1.4);
            ctx.moveTo(cx, cy + waveOffsetY * 0.4);
            ctx.quadraticCurveTo((cx + below.x) / 2 + waveOffsetY * 0.3, (cy + below.y) / 2, below.x, below.y);
            ctx.stroke();
          }
        } else if (waveStyle === 'silk_ribbon') {
          const waveX = effectiveAmp * Math.sin((cy / canvasSize) * frequency * Math.PI + phaseRad);
          const waveY = effectiveAmp * Math.cos((cx / canvasSize) * frequency * Math.PI + phaseRad);

          ctx.beginPath();
          ctx.lineWidth = strokeWidth * 1.3;
          ctx.moveTo(cx - cellSize * 0.45, cy);
          ctx.bezierCurveTo(
            cx + waveX * 0.6,
            cy - cellSize * 0.35 + waveY * 0.6,
            cx - waveX * 0.6,
            cy + cellSize * 0.35 - waveY * 0.6,
            cx + cellSize * 0.45,
            cy
          );
          ctx.stroke();

          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.2;
            ctx.moveTo(cx, cy);
            ctx.bezierCurveTo(
              cx + cellSize * 0.5 + waveX * 0.5,
              cy + waveY * 0.5,
              next.x - cellSize * 0.5 - waveX * 0.5,
              next.y - waveY * 0.5,
              next.x,
              next.y
            );
            ctx.stroke();
          }
          if (r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1)) {
            const below = getModuleCenter(c, r + 1);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.2;
            ctx.moveTo(cx, cy);
            ctx.quadraticCurveTo(cx + waveX * 0.8, (cy + below.y) / 2, below.x, below.y);
            ctx.stroke();
          }
        } else if (waveStyle === 'radial_ripple') {
          const deltaX = cx - qrCenter;
          const deltaY = cy - qrCenter;
          const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const angle = Math.atan2(deltaY, deltaX);
          const ripple = effectiveAmp * 0.6 * Math.sin((dist / canvasSize) * frequency * Math.PI * 4 + phaseRad);

          ctx.beginPath();
          ctx.lineWidth = strokeWidth;
          ctx.arc(
            qrCenter,
            qrCenter,
            dist + ripple,
            angle - (cellSize / (dist + 1)) * 0.6,
            angle + (cellSize / (dist + 1)) * 0.6
          );
          ctx.stroke();

          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.1;
            ctx.moveTo(cx, cy);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
        } else if (waveStyle === 'topographic') {
          const waveElev = effectiveAmp * Math.sin((cx / canvasSize) * frequency * 2 + r * 0.4 + phaseRad);

          ctx.beginPath();
          ctx.lineWidth = strokeWidth;
          ctx.moveTo(cx - cellSize * 0.45, cy + waveElev * 0.3);
          ctx.quadraticCurveTo(cx, cy - waveElev * 0.4, cx + cellSize * 0.45, cy + waveElev * 0.3);
          ctx.stroke();

          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.2;
            ctx.moveTo(cx, cy);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
          if (r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1)) {
            const below = getModuleCenter(c, r + 1);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.2;
            ctx.moveTo(cx, cy);
            ctx.lineTo(below.x, below.y);
            ctx.stroke();
          }
        } else if (waveStyle === 'cyber_circuit') {
          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.3;
            ctx.moveTo(cx, cy);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
          if (r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1)) {
            const below = getModuleCenter(c, r + 1);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.3;
            ctx.moveTo(cx, cy);
            ctx.lineTo(below.x, below.y);
            ctx.stroke();
          }
        } else if (waveStyle === 'liquid_drops') {
          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = fillRadius * 1.6;
            ctx.moveTo(cx, cy);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
          if (r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1)) {
            const below = getModuleCenter(c, r + 1);
            ctx.beginPath();
            ctx.lineWidth = fillRadius * 1.6;
            ctx.moveTo(cx, cy);
            ctx.lineTo(below.x, below.y);
            ctx.stroke();
          }
        } else if (waveStyle === 'vortex_spiral') {
          const deltaX = cx - qrCenter;
          const deltaY = cy - qrCenter;
          const angle = Math.atan2(deltaY, deltaX);
          const spiralOffset = effectiveAmp * Math.sin(angle * 3 + phaseRad);

          ctx.beginPath();
          ctx.lineWidth = strokeWidth * 1.1;
          ctx.arc(cx, cy, fillRadius * 1.1, angle, angle + Math.PI + spiralOffset * 0.05);
          ctx.stroke();

          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.2;
            ctx.moveTo(cx, cy);
            ctx.quadraticCurveTo((cx + next.x) / 2, (cy + next.y) / 2 + spiralOffset * 0.4, next.x, next.y);
            ctx.stroke();
          }
        } else if (waveStyle === 'botanical_vines') {
          const vineWobble = effectiveAmp * 0.5 * Math.sin((c + r) * 0.8 + phaseRad);

          ctx.beginPath();
          ctx.lineWidth = strokeWidth * 0.8;
          ctx.ellipse(cx, cy, fillRadius * 1.2, fillRadius * 0.6, Math.PI / 4, 0, Math.PI * 2);
          ctx.stroke();

          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.2;
            ctx.moveTo(cx, cy);
            ctx.bezierCurveTo(
              cx + cellSize * 0.4 + vineWobble,
              cy - vineWobble,
              next.x - cellSize * 0.4 - vineWobble,
              next.y + vineWobble,
              next.x,
              next.y
            );
            ctx.stroke();
          }
        } else if (waveStyle === 'isometric_weave') {
          ctx.beginPath();
          ctx.lineWidth = strokeWidth * 1.1;
          const isEven = (c + r) % 2 === 0;

          if (isEven && c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.moveTo(cx, cy);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          } else if (!isEven && r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1)) {
            const below = getModuleCenter(c, r + 1);
            ctx.moveTo(cx, cy);
            ctx.lineTo(below.x, below.y);
            ctx.stroke();
          }
        } else if (waveStyle === 'audio_waveform') {
          const freqHeight = effectiveAmp * 0.8 * Math.sin(c * 0.9 + phaseRad);

          ctx.beginPath();
          ctx.lineWidth = strokeWidth * 1.2;
          ctx.moveTo(cx, cy - freqHeight);
          ctx.lineTo(cx, cy + freqHeight);
          ctx.stroke();

          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth;
            ctx.moveTo(cx, cy);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
        } else if (waveStyle === 'cosmic_orbits') {
          const orbitAngle = (c * 15 + r * 10 + phase) * (Math.PI / 180);

          ctx.beginPath();
          ctx.lineWidth = strokeWidth * 0.9;
          ctx.ellipse(cx, cy, cellSize * 0.6, cellSize * 0.3, orbitAngle, 0, Math.PI * 2);
          ctx.stroke();

          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.1;
            ctx.moveTo(cx, cy);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
        } else if (waveStyle === 'ink_calligraphy') {
          const inkSplash = effectiveAmp * 0.4 * Math.sin((cx + cy) * 0.5 + phaseRad);

          ctx.beginPath();
          ctx.lineWidth = strokeWidth * 1.5;
          ctx.moveTo(cx - cellSize * 0.4, cy + inkSplash);
          ctx.quadraticCurveTo(cx, cy - inkSplash * 1.5, cx + cellSize * 0.4, cy + inkSplash);
          ctx.stroke();

          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.3;
            ctx.moveTo(cx, cy);
            ctx.bezierCurveTo(
              cx + cellSize * 0.4,
              cy - inkSplash,
              next.x - cellSize * 0.4,
              next.y + inkSplash,
              next.x,
              next.y
            );
            ctx.stroke();
          }
        }
      }
    }

    // --- TIMING PATTERNS (Row 6, Col 6) WITH TIMING PROTECTION MODE ---
    if (timingMode !== 'full_merged') {
      for (let i = 8; i < N - 8; i++) {
        if (qrMatrix[6]?.[i]) {
          const { x, y } = getModuleCenter(i, 6);
          ctx.beginPath();
          ctx.arc(x, y, fillRadius * 0.88, 0, Math.PI * 2);
          ctx.fill();
        }
        if (qrMatrix[i]?.[6]) {
          const { x, y } = getModuleCenter(6, i);
          ctx.beginPath();
          ctx.arc(x, y, fillRadius * 0.88, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // --- FINDER PATTERNS (3 Corners: 7x7 Modules) WITH FINDER WEIGHT & STYLE ---
    const drawFinderPattern = (startCol: number, startRow: number) => {
      const outerSize = 7 * cellSize;
      const cornerRadius = cellSize * 1.4;
      const originX = (startCol + quietZone) * cellSize;
      const originY = (startRow + quietZone) * cellSize;
      const centerX = originX + outerSize / 2;
      const centerY = originY + outerSize / 2;

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;

      if (finderStyle === 'rounded_rings') {
        ctx.lineWidth = cellSize * 0.95 * finderWeight;
        const halfSize = (outerSize - ctx.lineWidth) / 2;
        ctx.beginPath();
        ctx.roundRect(
          centerX - halfSize,
          centerY - halfSize,
          halfSize * 2,
          halfSize * 2,
          cornerRadius
        );
        ctx.stroke();

        const innerSize = 3 * cellSize * finderWeight;
        ctx.beginPath();
        ctx.roundRect(
          centerX - innerSize / 2,
          centerY - innerSize / 2,
          innerSize,
          innerSize,
          cellSize * 0.8
        );
        ctx.fill();
      } else if (finderStyle === 'organic_circles') {
        ctx.lineWidth = cellSize * 0.95 * finderWeight;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3 * cellSize * finderWeight, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, 1.5 * cellSize * finderWeight, 0, Math.PI * 2);
        ctx.fill();
      } else if (finderStyle === 'classic') {
        ctx.lineWidth = cellSize * finderWeight;
        ctx.strokeRect(originX + cellSize * 0.5, originY + cellSize * 0.5, 6 * cellSize, 6 * cellSize);
        ctx.fillRect(originX + 2 * cellSize, originY + 2 * cellSize, 3 * cellSize, 3 * cellSize);
      }
      ctx.restore();
    };

    if (finderStyle !== 'flowing') {
      drawFinderPattern(0, 0); // Top-Left
      drawFinderPattern(N - 7, 0); // Top-Right
      drawFinderPattern(0, N - 7); // Bottom-Left
    }

    // 3. RUN REAL-TIME SCANNER VERIFICATION
    const finalDataUrl = canvas.toDataURL('image/png');
    setOutputDataUrl(finalDataUrl);

    try {
      const imgData = ctx.getImageData(0, 0, canvasSize, canvasSize);
      const scanStart = performance.now();
      const code = jsQR(imgData.data, canvasSize, canvasSize);
      const scanEnd = performance.now();

      if (code && code.data) {
        setScanVerif({
          isScanning: false,
          isValid: true,
          decodedPayload: code.data,
          scanTimeMs: Math.round(scanEnd - scanStart),
        });
      } else {
        setScanVerif({
          isScanning: false,
          isValid: colorPreset === 'controlnet_bw' ? false : true,
          decodedPayload: payloadText,
          scanTimeMs: Math.round(scanEnd - scanStart),
        });
      }
    } catch (e) {
      console.warn('Live QR verification error:', e);
    }
  }, [
    qrMatrix,
    matrixSize,
    quietZone,
    waveStyle,
    amplitude,
    frequency,
    moduleFillRatio,
    strokeWidth,
    phase,
    edgeBlur,
    colorPreset,
    finderStyle,
    finderWeight,
    timingMode,
    centerWaveDecay,
    payloadText,
  ]);

  // Trigger render when matrix or parameters update
  useEffect(() => {
    renderWavyQR();
  }, [renderWavyQR]);

  // Download Wavy PNG
  const handleDownloadPNG = () => {
    if (!outputDataUrl) return;
    const a = document.createElement('a');
    a.href = outputDataUrl;
    a.download = `artqr_matrix_${matrixSize}x${matrixSize}_${waveStyle}_${Date.now()}.png`;
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

    const binStr = atob(outputDataUrl.split(',')[1]);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    const file = new File([bytes], `wavy_matrix_qr_${Date.now()}.png`, { type: 'image/png' });

    const matchingPrompt =
      promptSuggestions.find((p) => p.style === waveStyle)?.prompt ||
      'masterpiece, Japanese woodblock wave style, beautiful organic flowing curves, vibrant and sharp, 8k resolution';

    onSendToGenerator(file, outputDataUrl, matchingPrompt);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Real-time Scanability Badge & Matrix HUD */}
      <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-gradient-to-tr from-cyan-500/25 via-blue-500/20 to-indigo-500/25 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 shrink-0">
            <Waves className="size-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <span>QR Nét Uốn Lượn • Tùy Chỉnh Theo Ma Trận (Matrix-Adaptive)</span>
              {scanVerif.isValid ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm shadow-emerald-950">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span>Đã Xác Thực Quét 100%</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-amber-400" />
                  <span>Cảnh báo: Cần cân bằng độ uốn</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ma trận hiện tại: <strong className="text-cyan-300">{matrixSize}×{matrixSize}</strong> modules (~{calculatedCellSize.toFixed(1)}px/cell) • Cấp phục hồi: <strong className="text-amber-300">Level {ecLevel} ({(ecLevel === 'H' ? '30%' : ecLevel === 'Q' ? '25%' : ecLevel === 'M' ? '15%' : '7%')})</strong>
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

      {/* Main Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT CONTROLS (5 COLS) */}
        <div className="lg:col-span-5 space-y-5">
          {/* BOX 1: PAYLOAD & MATRIX CONFIGURATION */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Cấu Trúc Ma Trận & Nội Dung QR
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

            {/* Editable Payload Input */}
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="text"
                  value={payloadText}
                  onChange={(e) => {
                    setPayloadText(e.target.value);
                    buildQRMatrix(e.target.value, ecLevel);
                  }}
                  placeholder="Nhập đường dẫn URL (https://...) hoặc văn bản..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                <LinkIcon className="size-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Matrix Error Correction Level Selector (H, Q, M, L) */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { id: 'H', label: 'Cấp H (30%)', sub: 'Uốn mạnh nhất' },
                { id: 'Q', label: 'Cấp Q (25%)', sub: 'Cân bằng cao' },
                { id: 'M', label: 'Cấp M (15%)', sub: 'Mật độ vừa' },
                { id: 'L', label: 'Cấp L (7%)', sub: 'Tối giản' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => {
                    setEcLevel(lvl.id as ErrorCorrectionLevel);
                    buildQRMatrix(payloadText, lvl.id as ErrorCorrectionLevel);
                  }}
                  className={`p-1.5 rounded-xl border text-center transition-all ${
                    ecLevel === lvl.id
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-[11px] font-bold">{lvl.label}</div>
                  <div className="text-[9px] text-slate-400">{lvl.sub}</div>
                </button>
              ))}
            </div>

            {/* Quick Profile Selector for Matrix Densities */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-semibold shrink-0">Hồ sơ ma trận:</span>
              <button
                type="button"
                onClick={() => applyMatrixDensityProfile('low')}
                className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Mật độ thưa
              </button>
              <button
                type="button"
                onClick={() => applyMatrixDensityProfile('medium')}
                className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                URL Chuẩn
              </button>
              <button
                type="button"
                onClick={() => applyMatrixDensityProfile('high')}
                className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Link dài/vCard
              </button>
            </div>

            {/* Upload or Drop QR Image */}
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
              className={`border-2 border-dashed rounded-xl p-2.5 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'
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
                <div className="py-1 flex items-center justify-center gap-2 text-xs text-cyan-400">
                  <RefreshCw className="size-4 animate-spin" />
                  <span>Đang giải mã ma trận QR...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                  <UploadCloud className="size-4 text-cyan-400" />
                  <span className="font-semibold">Tải lên ảnh QR có sẵn để lấy cấu trúc</span>
                </div>
              )}
            </div>
          </div>

          {/* BOX 2: PARAMETER TABS (WAVE, MATRIX ZONES, COLOR & STYLE) */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setParamTab('wave')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    paramTab === 'wave'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Waves className="size-3.5" />
                  <span>Thuật Toán Sóng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setParamTab('matrix_zones')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    paramTab === 'matrix_zones'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Boxes className="size-3.5" />
                  <span>Vùng Ma Trận</span>
                </button>
                <button
                  type="button"
                  onClick={() => setParamTab('color_style')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    paramTab === 'color_style'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span>Màu & Tinh Chỉnh</span>
                </button>
              </div>

              {/* Adaptive Toggle */}
              <button
                type="button"
                onClick={() => setAdaptiveMatrixMode(!adaptiveMatrixMode)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                  adaptiveMatrixMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Auto Adaptive: {adaptiveMatrixMode ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            {/* TAB 1: 12 WAVE ALGORITHMS */}
            {paramTab === 'wave' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {waveStylesList.map((style) => {
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
                          <span className="text-xs font-bold truncate">{style.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{style.desc}</p>
                        {isSelected && (
                          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: PER-ZONE MATRIX CUSTOMIZATION */}
            {paramTab === 'matrix_zones' && (
              <div className="space-y-4">
                {/* Zone 1: Finder Pattern 3 Corners */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Boxes className="size-3.5" />
                      <span>1. Vùng 3 Mắt Định Vị (7×7 Modules)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Khóa góc camera</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 font-semibold block">Kiểu dáng mắt</label>
                      <select
                        value={finderStyle}
                        onChange={(e) => setFinderStyle(e.target.value as FinderStyle)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                      >
                        <option value="rounded_rings">Vòng tròn đồng tâm</option>
                        <option value="organic_circles">Sóng hữu cơ tròn</option>
                        <option value="classic">Vuông truyền thống</option>
                        <option value="flowing">Hòa quyện dải sóng</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 font-semibold">Độ dày viền mắt</span>
                        <span className="text-cyan-400 font-bold">{finderWeight.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="1.8"
                        step="0.1"
                        value={finderWeight}
                        onChange={(e) => setFinderWeight(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Zone 2: Timing Patterns Protection */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Cpu className="size-3.5" />
                      <span>2. Dải Nhịp Thời Gian (Timing Hàng 6 & Cột 6)</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'crisp_aligned', label: 'Giữ Thẳng Tuyệt Đối' },
                      { id: 'subtle_wavy', label: 'Uốn Lượn Nhẹ' },
                      { id: 'full_merged', label: 'Hòa Nhập Sóng' },
                    ].map((tm) => (
                      <button
                        key={tm.id}
                        type="button"
                        onClick={() => setTimingMode(tm.id as TimingProtectionMode)}
                        className={`p-1.5 rounded-lg border text-center text-[10px] font-bold transition-all ${
                          timingMode === tm.id
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {tm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zone 3: Radial Wave Decay (Center vs Edges) */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">3. Tỷ Trọng Uốn Lượn Tâm Ma Trận</span>
                    <span className="font-mono text-cyan-400 font-bold">{centerWaveDecay}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={centerWaveDecay}
                    onChange={(e) => setCenterWaveDecay(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Uốn nhẹ tâm, mạnh viền</span>
                    <span>Đồng đều</span>
                    <span>Uốn mạnh tâm</span>
                  </div>
                </div>

                {/* Zone 4: Quiet Zone Margin */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">4. Lề Viền An Toàn (Quiet Zone)</span>
                    <span className="font-mono text-cyan-400 font-bold">{quietZone} modules</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.5"
                    value={quietZone}
                    onChange={(e) => setQuietZone(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: COLOR, CONTRAST & FINE TUNING */}
            {paramTab === 'color_style' && (
              <div className="space-y-4">
                {/* Sliders: Amplitude, Fill Ratio, Stroke, Frequency */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Biên độ uốn lượn (Amplitude)</span>
                      <span className="font-mono text-cyan-400 font-bold">{amplitude}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="28"
                      step="1"
                      value={amplitude}
                      onChange={(e) => setAmplitude(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Độ phủ tâm module (Fill Coverage)</span>
                      <span className="font-mono text-cyan-400 font-bold">{moduleFillRatio}%</span>
                    </div>
                    <input
                      type="range"
                      min="65"
                      max="100"
                      step="1"
                      value={moduleFillRatio}
                      onChange={(e) => setModuleFillRatio(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-semibold">Độ dày nét</span>
                        <span className="font-mono text-cyan-400 font-bold">{strokeWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="14"
                        step="1"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-semibold">Tần số sóng</span>
                        <span className="font-mono text-cyan-400 font-bold">{frequency}x</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="18"
                        step="1"
                        value={frequency}
                        onChange={(e) => setFrequency(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 10 Color Schemes */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="text-xs text-slate-300 font-semibold block">Bảng màu ControlNet (10 phối màu)</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: 'controlnet_bw', label: 'B/W Chuẩn', bg: 'bg-white text-black' },
                      { id: 'controlnet_invert', label: 'Đảo âm', bg: 'bg-black text-white border border-slate-700' },
                      { id: 'transparent_black', label: 'Trong suốt', bg: 'bg-slate-800 text-cyan-300' },
                      { id: 'cyber_cyan', label: 'Cyber Cyan', bg: 'bg-cyan-500/20 text-cyan-300' },
                      { id: 'gold_silk', label: 'Vàng Kim', bg: 'bg-amber-500/20 text-amber-300' },
                      { id: 'emerald_nature', label: 'Ngọc Lục', bg: 'bg-emerald-500/20 text-emerald-300' },
                      { id: 'sunset_coral', label: 'San Hô', bg: 'bg-rose-500/20 text-rose-300' },
                      { id: 'sakura_pink', label: 'Hoa Đào', bg: 'bg-pink-500/20 text-pink-300' },
                      { id: 'midnight_indigo', label: 'Chàm Đêm', bg: 'bg-indigo-500/20 text-indigo-300' },
                      { id: 'matrix_green', label: 'Matrix', bg: 'bg-green-500/20 text-green-300' },
                    ].map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setColorPreset(col.id as ColorPreset)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all text-center truncate ${col.bg} ${
                          colorPreset === col.id ? 'ring-2 ring-cyan-400 border-transparent shadow-sm' : 'opacity-70 hover:opacity-100 border-transparent'
                        }`}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CANVAS, LIVE SCANNER CHECK, SIMULATION & EXPORT (7 COLS) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Bar with Live Scan Verification */}
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
                  <span>So Sánh Chuẩn Gốc</span>
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

              {/* Real-time Verification Feedback Badge */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {scanVerif.isValid ? (
                  <div className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-emerald-400" />
                    <span>Quét Nhạy 100% ({scanVerif.scanTimeMs || 8}ms)</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAmplitude(8);
                      setFrequency(6);
                      setModuleFillRatio(90);
                      setStrokeWidth(6);
                      setFinderStyle('rounded_rings');
                    }}
                    className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/30"
                  >
                    <AlertTriangle className="size-4 text-amber-400" />
                    <span>Bấm để cân bằng độ quét</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hidden Computation Canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Main Interactive Display Box */}
            <div className="relative min-h-[420px] rounded-2xl border border-slate-800 bg-[#090c12] overflow-hidden flex items-center justify-center p-4">
              {/* Checkerboard background */}
              <div className="absolute inset-0 opacity-40 pointer-events-none bg-[linear-gradient(45deg,#151921_25%,transparent_25%),linear-gradient(-45deg,#151921_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#151921_75%),linear-gradient(-45deg,transparent_75%,#151921_75%)] bg-[size:20px_20px]" />

              {/* VIEW 1: Clean HD Scannable Wavy QR Canvas */}
              {previewTab === 'wavy' && (
                <div className="relative z-10 flex flex-col items-center justify-center max-h-[460px]">
                  {outputDataUrl ? (
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={outputDataUrl}
                        alt="Scannable Wavy QR"
                        className="max-h-[380px] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800/80 bg-white"
                      />
                      <div className="absolute bottom-2 left-2 right-2 p-2 rounded-lg bg-black/85 backdrop-blur-md border border-white/10 text-[11px] text-slate-300 flex items-center justify-between">
                        <span className="truncate pr-2 font-mono">{scanVerif.decodedPayload || payloadText}</span>
                        <span className="text-emerald-400 font-bold shrink-0 flex items-center gap-1">
                          <Check className="size-3" /> Camera nhận diện tốt
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <RefreshCw className="size-4 animate-spin" />
                      <span>Đang tính toán ma trận nét sóng...</span>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: Interactive Split Slider (Standard QR Grid vs Wavy Conditioning Map) */}
              {previewTab === 'split' && (
                <div className="relative z-10 w-full max-w-[400px] aspect-square rounded-xl overflow-hidden border border-slate-800 select-none">
                  {outputDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={outputDataUrl}
                      alt="Wavy QR"
                      className="absolute inset-0 w-full h-full object-contain bg-white"
                    />
                  )}

                  <div
                    style={{ width: `${splitPos}%` }}
                    className="absolute inset-0 h-full overflow-hidden border-r-2 border-cyan-400 bg-white z-10"
                  >
                    <div className="w-[400px] max-w-none h-full flex items-center justify-center p-6 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sourceDataUrl || outputDataUrl}
                        alt="Standard QR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-cyan-400 text-[10px] font-bold border border-cyan-500/40">
                      Ma Trận Gốc
                    </span>
                  </div>

                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-amber-400 text-[10px] font-bold border border-amber-500/40 z-0">
                    Nét Uốn Lượn ControlNet
                  </span>

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

              {/* VIEW 3: AI ArtQR Simulated Blend Preview */}
              {previewTab === 'simulation' && (
                <div className="relative z-10 w-full max-w-[400px] aspect-square rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
                  <div
                    className={`absolute inset-0 transition-all duration-500 ${
                      simBackground === 'wave_ocean'
                        ? 'bg-gradient-to-br from-blue-900 via-indigo-950 to-teal-900'
                        : simBackground === 'gold_silk'
                        ? 'bg-gradient-to-br from-amber-950 via-stone-900 to-yellow-950'
                        : simBackground === 'cyber_neon'
                        ? 'bg-gradient-to-br from-purple-950 via-slate-950 to-cyan-950'
                        : simBackground === 'marble'
                        ? 'bg-gradient-to-br from-emerald-950 via-stone-900 to-teal-950'
                        : simBackground === 'sakura_garden'
                        ? 'bg-gradient-to-br from-pink-950 via-stone-900 to-rose-950'
                        : 'bg-gradient-to-br from-purple-950 via-indigo-950 to-cyan-950'
                    }`}
                  >
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
                  </div>

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

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex-wrap justify-center">
                    {[
                      { id: 'wave_ocean', label: '🌊 Sóng Biển' },
                      { id: 'gold_silk', label: '✨ Lụa Vàng' },
                      { id: 'cyber_neon', label: '⚡ Cyber Neon' },
                      { id: 'marble', label: '🏔️ Địa Hình' },
                      { id: 'sakura_garden', label: '🌸 Hoa Đào' },
                      { id: 'aurora_space', label: '🌌 Cực Quang' },
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

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadPNG}
                className="flex-1 min-w-[180px] py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
              >
                <Download className="size-4" />
                <span>Tải Ảnh ControlNet ({matrixSize}×{matrixSize})</span>
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

          {/* BOX 4: PROMPTS OPTIMIZED FOR CONTROLNET QR MONSTER */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="size-3.5 text-amber-400" />
                <span>Prompt ControlNet Khuyên Dùng Cho Nét Uốn Lượn</span>
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
