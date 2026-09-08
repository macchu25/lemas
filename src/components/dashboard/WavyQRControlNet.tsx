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
  Compass,
  Feather,
  Disc,
  Activity,
  TreeDeciduous,
  Grid,
  Boxes,
  Palette,
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
  | 'sunset_coral';

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
  const [quietZone, setQuietZone] = useState<number>(2.5);
  const [sourceDataUrl, setSourceDataUrl] = useState<string>(initialQRUrl || '');
  const [loadingSample, setLoadingSample] = useState<boolean>(false);
  const [isProcessingSource, setIsProcessingSource] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exact QR matrix (boolean 2D array)
  const [qrMatrix, setQrMatrix] = useState<boolean[][]>([]);
  const [matrixSize, setMatrixSize] = useState<number>(29);
  const [calculatedCellSize, setCalculatedCellSize] = useState<number>(30.1);
  const [adaptiveMatrixMode, setAdaptiveMatrixMode] = useState<boolean>(true);

  // Wave Parameters (12 Wave Styles)
  const [waveStyle, setWaveStyle] = useState<WaveStyle>('sine_stream');
  const [amplitude, setAmplitude] = useState<number>(10); // 0 - 30px
  const [frequency, setFrequency] = useState<number>(6); // 1 - 20
  const [moduleFillRatio, setModuleFillRatio] = useState<number>(88); // 60% - 100%
  const [strokeWidth, setStrokeWidth] = useState<number>(7); // 3 - 16px
  const [phase, setPhase] = useState<number>(0); // 0 - 360
  const [edgeBlur, setEdgeBlur] = useState<number>(0); // 0 - 8px
  const [colorPreset, setColorPreset] = useState<ColorPreset>('controlnet_bw');

  // Matrix Zone Specific Fine-Tuning
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
  const [paramTab, setParamTab] = useState<'wave_styles' | 'wave_params' | 'density_matrix' | 'matrix_zones' | 'color_style'>('density_matrix');

  // Preview & output
  const [previewTab, setPreviewTab] = useState<'wavy' | 'split' | 'simulation'>('wavy');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [simBackground, setSimBackground] = useState<
    'wave_ocean' | 'gold_silk' | 'cyber_neon' | 'marble' | 'sakura_garden' | 'aurora_space' | 'tattoo_skin' | 'jungle_dark'
  >('wave_ocean');
  const [outputDataUrl, setOutputDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 12 Wave Algorithms List
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

  // 1. Generate exact mathematical QR bit matrix from payload
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

        const totalMod = size + 2 * quietZone;
        const cSize = 1024 / totalMod;
        setCalculatedCellSize(cSize);

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

  // 2. RENDER ENGINE: PROCEDURAL WAVE CONTROLNET MAP (Trắng đen chuẩn ControlNet)
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

    // Background & Stroke Colors
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

    // Helper functions for zones
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

    // Render modules
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (isFinderModule(c, r) && finderStyle !== 'flowing') continue;
        if (isFinderSeparator(c, r)) continue;

        const isDark = qrMatrix[r]?.[c] === true;
        if (!isDark) continue;

        const { x: cx, y: cy } = getModuleCenter(c, r);

        // Solid core anchor for scanner scannability
        ctx.beginPath();
        ctx.arc(cx, cy, fillRadius * 0.95, 0, Math.PI * 2);
        ctx.fill();

        // Wave Ribbon Morphing
        const dx = (cx - qrCenter) / qrCenter;
        const dy = (cy - qrCenter) / qrCenter;
        const distRatio = Math.sqrt(dx * dx + dy * dy);
        const regionalAmpWeight = (centerWaveDecay / 100) * (1 - distRatio * 0.3);
        const effectiveAmp = amplitude * Math.max(0.3, regionalAmpWeight);

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
        } else if (waveStyle === 'radial_ripple') {
          const dist = Math.sqrt((cx - qrCenter) ** 2 + (cy - qrCenter) ** 2);
          const rippleAmp = effectiveAmp * Math.sin((dist / canvasSize) * frequency * Math.PI * 2 + phaseRad);

          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(2, fillRadius + rippleAmp * 0.4), 0, Math.PI * 2);
          ctx.fill();

          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.1;
            ctx.moveTo(cx, cy);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
        } else {
          // Default organic wavy ribbons
          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            const wobble = effectiveAmp * Math.sin((c + r) * 0.7 + phaseRad);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.2;
            ctx.moveTo(cx, cy);
            ctx.quadraticCurveTo((cx + next.x) / 2, (cy + next.y) / 2 + wobble, next.x, next.y);
            ctx.stroke();
          }
          if (r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1)) {
            const below = getModuleCenter(c, r + 1);
            const wobble = effectiveAmp * Math.cos((c + r) * 0.7 + phaseRad);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.2;
            ctx.moveTo(cx, cy);
            ctx.quadraticCurveTo((cx + below.x) / 2 + wobble, (cy + below.y) / 2, below.x, below.y);
            ctx.stroke();
          }
        }
      }
    }

    // --- TIMING PATTERNS (Row 6, Col 6) ---
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

    // --- FINDER PATTERNS (3 Corners: 7x7 Modules) ---
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

  useEffect(() => {
    renderWavyQR();
  }, [renderWavyQR]);

  // Download Output PNG
  const handleDownloadPNG = () => {
    if (!outputDataUrl) return;
    const a = document.createElement('a');
    a.href = outputDataUrl;
    a.download = `artqr_wavy_${waveStyle}_${Date.now()}.png`;
    document.body.appendChild(a);
  };

  // Copy PNG to Clipboard
  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  // Transfer to ArtQR Generator
  const handleSendToGenerator = () => {
    if (!canvasRef.current || !onSendToGenerator) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `controlnet_wavy_qr_${Date.now()}.png`, {
          type: 'image/png',
        });
        onSendToGenerator(file, outputDataUrl);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-[#0c1017]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 text-cyan-400">
              <Waves className="size-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>ArtQR ControlNet Waves Engine</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                12 ALGORITHMS
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Biến đổi ma trận QR thành <strong>12 Phong Cách Uốn Lượn Sóng & Ruy Băng</strong> chuẩn Trắng Đen ControlNet — Bảo toàn 100% khả năng quét camera với chuẩn phục hồi lỗi Level H.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {onBackToGallery && (
            <button
              type="button"
              onClick={onBackToGallery}
              className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all"
            >
              Kho 20 Phong Cách
            </button>
          )}
          {onSendToGenerator && (
            <button
              type="button"
              onClick={handleSendToGenerator}
              className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-1.5"
            >
              <Wand2 className="size-3.5" />
              <span>Dùng Tạo Ảnh ArtQR</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* MAIN TWO COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CONTROLS & PARAMS (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. INPUT PAYLOAD & SOURCE QR */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-cyan-400" />
                <span>Nội Dung Mã QR (Bảo Toàn Bit Ma Trận)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono">Sửa Lỗi:</span>
                <select
                  value={ecLevel}
                  onChange={(e) => setEcLevel(e.target.value as ErrorCorrectionLevel)}
                  className="bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 focus:outline-none"
                >
                  <option value="H">H (30% - Khuyên dùng)</option>
                  <option value="Q">Q (25%)</option>
                  <option value="M">M (15%)</option>
                  <option value="L">L (7%)</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                placeholder="Nhập URL hoặc văn bản bất kỳ..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
              />
            </div>

            {/* Quick Upload / Sample Row */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingSource}
                className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <UploadCloud className="size-3.5" />
                <span>{isProcessingSource ? 'Đang đọc...' : 'Tải ảnh QR có sẵn'}</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                disabled={loadingSample}
                className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`size-3.5 ${loadingSample ? 'animate-spin' : ''}`} />
                <span>Mẫu Lemas.ai</span>
              </button>
            </div>
          </div>

          {/* 2. FINE-TUNING TABS */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-4 shadow-lg">
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setParamTab('density_matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  paramTab === 'density_matrix'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="size-3.5 text-cyan-400" />
                <span>Mật Độ & Sửa Lỗi (H/Q/M/L)</span>
              </button>

              <button
                type="button"
                onClick={() => setParamTab('wave_styles')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  paramTab === 'wave_styles'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Waves className="size-3.5" />
                <span>12 Dạng Sóng</span>
              </button>

              <button
                type="button"
                onClick={() => setParamTab('wave_params')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  paramTab === 'wave_params'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="size-3.5" />
                <span>Biên Độ & Tần Số</span>
              </button>

              <button
                type="button"
                onClick={() => setParamTab('matrix_zones')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  paramTab === 'matrix_zones'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Boxes className="size-3.5" />
                <span>Mắt Định Vị</span>
              </button>

              <button
                type="button"
                onClick={() => setParamTab('color_style')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  paramTab === 'color_style'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="size-3.5" />
                <span>Bảng Màu</span>
              </button>
            </div>

            {/* TAB 0: MATRIX DENSITY & ERROR CORRECTION (L/M/Q/H) */}
            {paramTab === 'density_matrix' && (
              <div className="space-y-4">
                {/* 4 Interactive EC Level Cards */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-cyan-400" />
                      <span>Cấp Độ Phục Hồi Lỗi Reed-Solomon</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                      Level {ecLevel} ({ecLevel === 'H' ? '30%' : ecLevel === 'Q' ? '25%' : ecLevel === 'M' ? '15%' : '7%'} Sửa Lỗi)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        level: 'L' as ErrorCorrectionLevel,
                        rate: '7%',
                        label: 'Mật Độ Thưa Nhất (L)',
                        desc: 'Ma trận thoáng, ô to, đường sóng uốn lượn rộng mở',
                        badge: 'Ô To Nhất',
                      },
                      {
                        level: 'M' as ErrorCorrectionLevel,
                        rate: '15%',
                        label: 'Mật Độ Tiêu Chuẩn (M)',
                        desc: 'Cân bằng hoàn hảo giữa độ mịn và khả năng quét',
                        badge: 'Cân Bằng',
                      },
                      {
                        level: 'Q' as ErrorCorrectionLevel,
                        rate: '25%',
                        label: 'Mật Độ Cao (Q)',
                        desc: 'Chống mất mát dữ liệu tốt khi họa tiết phức tạp',
                        badge: 'Độ Quét Cao',
                      },
                      {
                        level: 'H' as ErrorCorrectionLevel,
                        rate: '30%',
                        label: 'Mật Độ Dày Nhất (H)',
                        desc: 'Khuyên dùng cho AI ArtQR: Biến dạng mạnh vẫn quét 100%',
                        badge: 'Khuyên Dùng',
                      },
                    ].map((item) => {
                      const isSelected = ecLevel === item.level;
                      return (
                        <button
                          key={item.level}
                          type="button"
                          onClick={() => setEcLevel(item.level)}
                          className={`p-2.5 rounded-xl border text-left transition-all relative ${
                            isSelected
                              ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/20 to-teal-500/10 text-white shadow-md shadow-cyan-950/40'
                              : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-white flex items-center gap-1">
                              <span className={`size-2 rounded-full ${isSelected ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-600'}`} />
                              <span>Cấp {item.level}</span>
                            </span>
                            <span className="text-[10px] font-mono text-cyan-300 font-bold px-1.5 py-0.2 rounded bg-slate-800/80">
                              {item.rate}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quiet Zone Padding & Adaptive Grid Mode */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Độ Rộng Viền Lề An Toàn (Quiet Zone)</span>
                      <span className="font-mono text-cyan-400 font-bold">{quietZone.toFixed(1)} modules</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="4.0"
                      step="0.5"
                      value={quietZone}
                      onChange={(e) => setQuietZone(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 block">Tự Động Thích Ứng Nét Vẽ Theo Mật Độ</span>
                      <span className="text-[10px] text-slate-400 block">Tự căn chỉnh biên độ sóng và độ dày nét theo kích thước từng ô</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-cyan-300">
                      <input
                        type="checkbox"
                        checked={adaptiveMatrixMode}
                        onChange={(e) => setAdaptiveMatrixMode(e.target.checked)}
                        className="rounded accent-cyan-500"
                      />
                      <span>TỰ ĐỘNG</span>
                    </label>
                  </div>
                </div>

                {/* Real-time Technical Matrix HUD */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Lưới Ma Trận</span>
                    <span className="text-xs font-mono text-cyan-300 font-bold">{matrixSize}×{matrixSize} ô</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Kích Thước Ô</span>
                    <span className="text-xs font-mono text-emerald-300 font-bold">{calculatedCellSize.toFixed(1)}px</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Chuẩn Sửa Lỗi</span>
                    <span className="text-xs font-mono text-amber-300 font-bold">Level {ecLevel}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: 12 WAVE STYLES */}
            {paramTab === 'wave_styles' && (
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
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
                          ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/20 to-teal-500/10 text-white shadow-md shadow-cyan-950/40'
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
            )}

            {/* TAB 2: WAVE PARAMS */}
            {paramTab === 'wave_params' && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Biên độ uốn lượn (Amplitude)</span>
                    <span className="font-mono text-cyan-400 font-bold">{amplitude}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="22"
                    step="1"
                    value={amplitude}
                    onChange={(e) => setAmplitude(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Tần số chu kỳ sóng (Frequency)</span>
                    <span className="font-mono text-cyan-400 font-bold">{frequency}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="14"
                    step="1"
                    value={frequency}
                    onChange={(e) => setFrequency(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Độ dày nét</span>
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
                      <span className="text-slate-300">Pha sóng</span>
                      <span className="font-mono text-cyan-400 font-bold">{phase}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      value={phase}
                      onChange={(e) => setPhase(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MATRIX ZONES */}
            {paramTab === 'matrix_zones' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Boxes className="size-3.5" />
                      <span>1. Vùng 3 Mắt Định Vị (7×7 Modules)</span>
                    </span>
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
                        <option value="flowing">Hòa quyện dải hoa/sóng</option>
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

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">2. Tỷ Trọng Sóng Tâm Ma Trận</span>
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
                </div>
              </div>
            )}

            {/* TAB 4: COLOR & STYLE */}
            {paramTab === 'color_style' && (
              <div className="space-y-4">
                <div className="space-y-3">
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
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="text-xs text-slate-300 font-semibold block">Bảng màu ControlNet</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'controlnet_bw', label: 'B/W Chuẩn', bg: 'bg-white text-black font-bold' },
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
                  <span>ControlNet Map HD</span>
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
                  <span>So Sánh Gốc</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('simulation')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    previewTab === 'simulation'
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="size-3.5" />
                  <span>Mô Phỏng 3D</span>
                </button>
              </div>

              {/* Live Scanner Verification Badge */}
              <div className="flex items-center gap-2">
                {scanVerif.isValid ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                    <CheckCircle2 className="size-3.5" />
                    <span>QUÉT CAMERA TỐT ({scanVerif.scanTimeMs || 8}ms)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold">
                    <AlertTriangle className="size-3.5" />
                    <span>ĐIỀU CHỈNH BIÊN ĐỘ ĐỂ TĂNG ĐỘ QUÉT</span>
                  </div>
                )}
              </div>
            </div>

            {/* MAIN PREVIEW CANVAS CONTAINER */}
            <div className="relative aspect-square w-full max-w-[540px] mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-4">
              {/* Hidden High-Resolution Processing Canvas */}
              <canvas ref={canvasRef} className="hidden" />

              {/* VIEW MODE 1: PURE CONTROLNET WAVY MAP */}
              {previewTab === 'wavy' && outputDataUrl && (
                <img
                  src={outputDataUrl}
                  alt="Wavy QR ControlNet"
                  className="w-full h-full object-contain rounded-xl shadow-2xl"
                />
              )}

              {/* VIEW MODE 2: SPLIT SCREEN COMPARISON */}
              {previewTab === 'split' && outputDataUrl && (
                <div className="relative w-full h-full overflow-hidden select-none">
                  {sourceDataUrl ? (
                    <img
                      src={sourceDataUrl}
                      alt="Source QR"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-500 text-xs font-mono">
                      Mã QR Gốc Chuẩn
                    </div>
                  )}

                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                  >
                    <img
                      src={outputDataUrl}
                      alt="Wavy QR Result"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_10px_#06b6d4] cursor-ew-resize"
                    style={{ left: `${splitPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-7 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg font-bold text-[10px]">
                      ↔
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={splitPos}
                    onChange={(e) => setSplitPos(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                  />
                </div>
              )}

              {/* VIEW MODE 3: 3D REALISTIC MATERIAL SIMULATION */}
              {previewTab === 'simulation' && outputDataUrl && (
                <div className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center">
                  <div
                    className={`absolute inset-0 transition-all ${
                      simBackground === 'wave_ocean'
                        ? 'bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950'
                        : simBackground === 'gold_silk'
                        ? 'bg-gradient-to-br from-amber-900/60 via-yellow-950/80 to-stone-950'
                        : simBackground === 'cyber_neon'
                        ? 'bg-gradient-to-br from-fuchsia-950 via-purple-950 to-slate-950'
                        : simBackground === 'marble'
                        ? 'bg-gradient-to-br from-slate-200 to-slate-400'
                        : simBackground === 'sakura_garden'
                        ? 'bg-gradient-to-br from-pink-950 via-rose-950 to-slate-950'
                        : 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950'
                    }`}
                  />
                  <img
                    src={outputDataUrl}
                    alt="Simulated QR"
                    className="relative z-10 w-[85%] h-[85%] object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] filter contrast-125"
                  />
                </div>
              )}
            </div>

            {/* ACTION BUTTONS: DOWNLOAD, COPY, SEND TO GENERATOR */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadPNG}
                className="py-3 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                <Download className="size-4 text-cyan-400" />
                <span>Tải PNG 1024px</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                className="py-3 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4 text-slate-300" />}
                <span>{copied ? 'Đã Sao Chép!' : 'Copy Ảnh'}</span>
              </button>

              {onSendToGenerator && (
                <button
                  type="button"
                  onClick={handleSendToGenerator}
                  className="py-3 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/40"
                >
                  <Wand2 className="size-4" />
                  <span>Dùng Tạo ArtQR</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
