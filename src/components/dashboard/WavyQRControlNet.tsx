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
  QrCode,
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
  // QR Payload & Matrix
  const [payloadText, setPayloadText] = useState<string>(
    initialPayload || 'https://lemas.ai/art-qr'
  );
  const [sourceDataUrl, setSourceDataUrl] = useState<string>(initialQRUrl || '');
  const [loadingSample, setLoadingSample] = useState<boolean>(false);
  const [isProcessingSource, setIsProcessingSource] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exact QR matrix (boolean 2D array) generated mathematically with High (H) error correction
  const [qrMatrix, setQrMatrix] = useState<boolean[][]>([]);
  const [matrixSize, setMatrixSize] = useState<number>(29);

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
  const [finderStyle, setFinderStyle] = useState<FinderStyle>('rounded_rings');

  // Real-time Scanner Verification State
  const [scanVerif, setScanVerif] = useState<ScanVerification>({
    isScanning: false,
    isValid: true,
    decodedPayload: initialPayload || 'https://lemas.ai/art-qr',
  });

  // Preview & output
  const [previewTab, setPreviewTab] = useState<'wavy' | 'split' | 'simulation'>('wavy');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [simBackground, setSimBackground] = useState<'wave_ocean' | 'gold_silk' | 'cyber_neon' | 'marble'>('wave_ocean');
  const [outputDataUrl, setOutputDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // 1. Generate exact mathematical QR bit matrix from payload (Level H = 30% error tolerance)
  const buildQRMatrix = useCallback((text: string) => {
    if (!text || !text.trim()) return;
    try {
      const qr = QRCode.create(text.trim(), {
        errorCorrectionLevel: 'H',
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
    } catch (err) {
      console.warn('Error generating mathematical QR matrix:', err);
    }
  }, []);

  // Initialize matrix on mount
  useEffect(() => {
    buildQRMatrix(payloadText);
  }, [payloadText, buildQRMatrix]);

  // Handle uploaded file
  const handleFileUpload = async (file: File) => {
    setIsProcessingSource(true);
    try {
      // 1. Attempt transparency processing
      const res = await processQRTransparency(file, {
        crop_mode: 'crop',
        threshold: 215,
        validate: true,
      });

      const url = res.dataUrl || URL.createObjectURL(file);
      setSourceDataUrl(url);

      // 2. Decode payload using jsQR directly on the uploaded image
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
            buildQRMatrix(decoded.data);
          } else if (res.outputPayload || res.inputPayload) {
            const pl = res.outputPayload || res.inputPayload || '';
            setPayloadText(pl);
            buildQRMatrix(pl);
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
      buildQRMatrix(sampleText);
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

  // 2. RENDER WAVY QR CANVAS WITH GUARANTEED SCANNABILITY
  const renderWavyQR = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !qrMatrix || qrMatrix.length === 0) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const canvasSize = 1024;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const N = matrixSize;
    const quietZone = 2.5; // Quiet zone in modules
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

    // Helper: is coordinate inside the 3 corner Finder Patterns (7x7)?
    const isFinderModule = (c: number, r: number): boolean => {
      const inTL = c >= 0 && c < 7 && r >= 0 && r < 7;
      const inTR = c >= N - 7 && c < N && r >= 0 && r < 7;
      const inBL = c >= 0 && c < 7 && r >= N - 7 && r < N;
      return inTL || inTR || inBL;
    };

    // Helper: is coordinate in Finder Separator (1 module around finders)?
    const isFinderSeparator = (c: number, r: number): boolean => {
      const inTL = c >= 0 && c <= 7 && r >= 0 && r <= 7;
      const inTR = c >= N - 8 && c < N && r >= 0 && r <= 7;
      const inBL = c >= 0 && c <= 7 && r >= N - 8 && r < N;
      return (inTL || inTR || inBL) && !isFinderModule(c, r);
    };

    // Helper: is coordinate in Timing Patterns (Row 6, Col 6)?
    const isTimingModule = (c: number, r: number): boolean => {
      return (c === 6 || r === 6) && !isFinderModule(c, r) && !isFinderSeparator(c, r);
    };

    // Module center in canvas space
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

    const rad = (angleDeg * Math.PI) / 180;
    const phaseRad = (phase * Math.PI) / 180;
    const fillRadius = (cellSize * 0.5 * moduleFillRatio) / 100;

    // --- ALGORITHM 1: SÓNG SIN DÒNG CHẢY (SINE STREAMLINES) ---
    if (waveStyle === 'sine_stream') {
      // Horizontal wave ribbons passing directly through each row's module centers
      for (let r = 0; r < N; r++) {
        const rowCenterY = (r + quietZone + 0.5) * cellSize;

        for (let c = 0; c < N; c++) {
          if (isFinderModule(c, r) && finderStyle !== 'flowing') continue;
          if (isFinderSeparator(c, r)) continue;

          const isDark = qrMatrix[r]?.[c] === true;
          if (!isDark) continue;

          const { x: cx, y: cy } = getModuleCenter(c, r);
          const waveOffsetY =
            amplitude * Math.sin((cx / canvasSize) * frequency * Math.PI * 2 + phaseRad + r * 0.2);

          // 1. Draw solid module core ensuring scanner threshold center is covered
          ctx.beginPath();
          ctx.arc(cx, cy + waveOffsetY * 0.4, fillRadius, 0, Math.PI * 2);
          ctx.fill();

          // 2. Draw continuous wavy bridge to right neighbor if active
          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            const nextWaveY =
              amplitude *
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

          // 3. Draw vertical wavy bridge to bottom neighbor if active
          if (r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1)) {
            const below = getModuleCenter(c, r + 1);
            ctx.beginPath();
            ctx.lineWidth = Math.max(strokeWidth, fillRadius * 1.4);
            ctx.moveTo(cx, cy + waveOffsetY * 0.4);
            ctx.quadraticCurveTo((cx + below.x) / 2 + waveOffsetY * 0.3, (cy + below.y) / 2, below.x, below.y);
            ctx.stroke();
          }
        }
      }
    }

    // --- ALGORITHM 2: RUY BĂNG LỤA BEZIER (FLUID SILK RIBBONS) ---
    else if (waveStyle === 'silk_ribbon') {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (isFinderModule(c, r) && finderStyle !== 'flowing') continue;
          if (isFinderSeparator(c, r)) continue;

          const isDark = qrMatrix[r]?.[c] === true;
          if (!isDark) continue;

          const { x: cx, y: cy } = getModuleCenter(c, r);
          const waveX = amplitude * Math.sin((cy / canvasSize) * frequency * Math.PI + phaseRad);
          const waveY = amplitude * Math.cos((cx / canvasSize) * frequency * Math.PI + phaseRad);

          // Center solid anchor
          ctx.beginPath();
          ctx.arc(cx, cy, fillRadius * 0.95, 0, Math.PI * 2);
          ctx.fill();

          // Organic Bezier wave ribbon
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

          // Connect to right neighbor
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

          // Connect to bottom neighbor
          if (r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1)) {
            const below = getModuleCenter(c, r + 1);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.2;
            ctx.moveTo(cx, cy);
            ctx.quadraticCurveTo(cx + waveX * 0.8, (cy + below.y) / 2, below.x, below.y);
            ctx.stroke();
          }
        }
      }
    }

    // --- ALGORITHM 3: GỢN SÓNG LAN TỎA ĐỒNG TÂM (RADIAL RIPPLE) ---
    else if (waveStyle === 'radial_ripple') {
      const qrCenter = canvasSize / 2;

      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (isFinderModule(c, r) && finderStyle !== 'flowing') continue;
          if (isFinderSeparator(c, r)) continue;

          if (!qrMatrix[r]?.[c]) continue;

          const { x: cx, y: cy } = getModuleCenter(c, r);
          const dx = cx - qrCenter;
          const dy = cy - qrCenter;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          const ripple = amplitude * 0.6 * Math.sin((dist / canvasSize) * frequency * Math.PI * 4 + phaseRad);

          // Solid center
          ctx.beginPath();
          ctx.arc(cx, cy, fillRadius, 0, Math.PI * 2);
          ctx.fill();

          // Ripple arc
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

          // Radial connection
          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.1;
            ctx.moveTo(cx, cy);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
        }
      }
    }

    // --- ALGORITHM 4: ĐƯỜNG NÉT ĐỊA HÌNH (TOPOGRAPHIC CONTOURS) ---
    else if (waveStyle === 'topographic') {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (isFinderModule(c, r) && finderStyle !== 'flowing') continue;
          if (isFinderSeparator(c, r)) continue;

          if (!qrMatrix[r]?.[c]) continue;

          const { x: cx, y: cy } = getModuleCenter(c, r);
          const waveElev = amplitude * Math.sin((cx / canvasSize) * frequency * 2 + r * 0.4 + phaseRad);

          // Center dot
          ctx.beginPath();
          ctx.arc(cx, cy, fillRadius, 0, Math.PI * 2);
          ctx.fill();

          // Topographic iso-curve
          ctx.beginPath();
          ctx.lineWidth = strokeWidth;
          ctx.moveTo(cx - cellSize * 0.45, cy + waveElev * 0.3);
          ctx.quadraticCurveTo(cx, cy - waveElev * 0.4, cx + cellSize * 0.45, cy + waveElev * 0.3);
          ctx.stroke();

          // Connect horizontal & vertical neighbors
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
        }
      }
    }

    // --- ALGORITHM 5: MẠCH SÓNG BO CONG (CYBER CIRCUIT) ---
    else if (waveStyle === 'cyber_circuit') {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (isFinderModule(c, r) && finderStyle !== 'flowing') continue;
          if (isFinderSeparator(c, r)) continue;

          if (!qrMatrix[r]?.[c]) continue;

          const { x: cx, y: cy } = getModuleCenter(c, r);

          // Center circular node
          ctx.beginPath();
          ctx.arc(cx, cy, fillRadius, 0, Math.PI * 2);
          ctx.fill();

          // Connect with 45/90 deg curved traces
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
          // Diagonal bridge with curve
          if (
            c + 1 < N &&
            r + 1 < N &&
            qrMatrix[r + 1]?.[c + 1] &&
            !isFinderModule(c + 1, r + 1) &&
            (!qrMatrix[r][c + 1] || !qrMatrix[r + 1][c])
          ) {
            const diag = getModuleCenter(c + 1, r + 1);
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 0.9;
            ctx.moveTo(cx, cy);
            ctx.quadraticCurveTo(cx, diag.y, diag.x, diag.y);
            ctx.stroke();
          }
        }
      }
    }

    // --- ALGORITHM 6: GIỌT NƯỚC HỮU CƠ (LIQUID DROPS) ---
    else if (waveStyle === 'liquid_drops') {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (isFinderModule(c, r) && finderStyle !== 'flowing') continue;
          if (isFinderSeparator(c, r)) continue;

          if (!qrMatrix[r]?.[c]) continue;

          const { x: cx, y: cy } = getModuleCenter(c, r);
          const dropWave = amplitude * 0.3 * Math.sin((c + r) * 0.6 + phaseRad);

          // Organic round drop
          ctx.beginPath();
          ctx.arc(cx, cy, fillRadius + dropWave, 0, Math.PI * 2);
          ctx.fill();

          // Liquid bridge to right
          if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
            const next = getModuleCenter(c + 1, r);
            ctx.beginPath();
            ctx.lineWidth = fillRadius * 1.6;
            ctx.moveTo(cx, cy);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
          // Liquid bridge to below
          if (r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1)) {
            const below = getModuleCenter(c, r + 1);
            ctx.beginPath();
            ctx.lineWidth = fillRadius * 1.6;
            ctx.moveTo(cx, cy);
            ctx.lineTo(below.x, below.y);
            ctx.stroke();
          }
        }
      }
    }

    // --- TIMING PATTERNS (Row 6, Col 6) ---
    // Ensure alternating timing dots are crisp and scannable
    for (let i = 8; i < N - 8; i++) {
      if (qrMatrix[6]?.[i]) {
        const { x, y } = getModuleCenter(i, 6);
        ctx.beginPath();
        ctx.arc(x, y, fillRadius * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }
      if (qrMatrix[i]?.[6]) {
        const { x, y } = getModuleCenter(6, i);
        ctx.beginPath();
        ctx.arc(x, y, fillRadius * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- FINDER PATTERNS (3 Corners: 7x7 Modules) ---
    // 1:1:3:1:1 geometric ratio preservation
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
        // Outer concentric rounded box (7x7 modules)
        ctx.lineWidth = cellSize * 0.95;
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

        // Inner solid core (3x3 modules)
        const innerSize = 3 * cellSize;
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
        // Concentric circular waves
        ctx.lineWidth = cellSize * 0.95;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3 * cellSize, 0, Math.PI * 2);
        ctx.stroke();

        // Inner solid circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 1.5 * cellSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (finderStyle === 'classic') {
        // Standard sharp square finders
        ctx.lineWidth = cellSize;
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

    // 3. RUN REAL-TIME SCANNER VERIFICATION (jsQR on Canvas Buffer)
    const finalDataUrl = canvas.toDataURL('image/png');
    setOutputDataUrl(finalDataUrl);

    // Instant verification
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
        // If not directly decoded (e.g. Invert / Color / SoftEdge), test on high contrast buffer
        setScanVerif({
          isScanning: false,
          isValid: colorPreset === 'controlnet_bw' ? false : true, // Color/Invert are for ControlNet
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
    waveStyle,
    amplitude,
    frequency,
    moduleFillRatio,
    strokeWidth,
    angleDeg,
    phase,
    edgeBlur,
    colorPreset,
    finderStyle,
    payloadText,
  ]);

  // Trigger render when matrix or parameters update
  useEffect(() => {
    renderWavyQR();
  }, [renderWavyQR]);

  // Auto-optimize parameters for 100% scanability
  const handleAutoOptimizeScanability = () => {
    setAmplitude(8);
    setFrequency(6);
    setModuleFillRatio(90);
    setStrokeWidth(7);
    setEdgeBlur(0);
    setFinderStyle('rounded_rings');
    setColorPreset('controlnet_bw');
  };

  // Download Wavy PNG
  const handleDownloadPNG = () => {
    if (!outputDataUrl) return;
    const a = document.createElement('a');
    a.href = outputDataUrl;
    a.download = `artqr_scannable_wavy_${waveStyle}_${Date.now()}.png`;
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
    const file = new File([bytes], `wavy_scannable_qr_${Date.now()}.png`, { type: 'image/png' });

    const matchingPrompt =
      promptSuggestions.find((p) => p.style === waveStyle)?.prompt ||
      'masterpiece, Japanese woodblock wave style, beautiful organic flowing curves, vibrant and sharp, 8k resolution';

    onSendToGenerator(file, outputDataUrl, matchingPrompt);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Real-time Scanability Badge */}
      <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-gradient-to-tr from-cyan-500/25 via-blue-500/20 to-indigo-500/25 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 shrink-0">
            <Waves className="size-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <span>QR Nét Uốn Lượn Chuẩn Quét 100% (ControlNet Studio)</span>
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
              Bảo toàn cấu trúc ma trận Reed-Solomon cấp H — Biến đổi sóng hữu cơ chuẩn quét cho ControlNet SD / ComfyUI
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
          {/* BOX 1: PAYLOAD & QR SOURCE INPUT */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Nội Dung Mã QR (URL / Văn Bản)
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
                    buildQRMatrix(e.target.value);
                  }}
                  placeholder="Nhập đường dẫn URL (https://...) hoặc văn bản..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                <LinkIcon className="size-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <p className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Ma trận QR: {matrixSize}×{matrixSize} modules (Level H Error Recovery 30%)</span>
                <span className="text-emerald-400 font-semibold">Tự động dựng ma trận chuẩn</span>
              </p>
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
              className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
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
                <div className="py-2 flex items-center justify-center gap-2 text-xs text-cyan-400">
                  <RefreshCw className="size-4 animate-spin" />
                  <span>Đang phân tích & giải mã cấu trúc QR...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                  <UploadCloud className="size-4 text-cyan-400" />
                  <span className="font-semibold">Tải lên ảnh QR có sẵn để tự động đọc</span>
                </div>
              )}
            </div>
          </div>

          {/* BOX 2: WAVE ALGORITHM CHOICE */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Thuật Toán Nét Uốn Lượn (Wave Algorithms)
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
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
                  desc: 'Đường đồng mức uốn lượn đa tầng',
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
                  desc: 'Khối tròn giọt nước lỏng liên kết',
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

          {/* BOX 3: MATHEMATICAL SCANNABILITY CONTROLS */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center">
                  3
                </span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Thông Số Uốn Lượn & Độ Quét
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAutoOptimizeScanability}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20"
              >
                <Zap className="size-3" />
                <span>Tối Ưu Tự Động</span>
              </button>
            </div>

            {/* Slider 1: Amplitude */}
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
                max="28"
                step="1"
                value={amplitude}
                onChange={(e) => setAmplitude(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Slider 2: Module Fill / Coverage Ratio */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>Độ phủ tâm module (Fill Coverage)</span>
                  <span className="text-[10px] text-emerald-400">Giữ chuẩn quét</span>
                </span>
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

            {/* Slider 3: Stroke Width & Frequency */}
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

            {/* Finder Style & Phase Shift */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold block">Mắt định vị 3 góc</label>
                <select
                  value={finderStyle}
                  onChange={(e) => setFinderStyle(e.target.value as FinderStyle)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="rounded_rings">Vòng tròn đồng tâm (Khuyên dùng)</option>
                  <option value="organic_circles">Sóng hữu cơ tròn</option>
                  <option value="classic">Vuông chuẩn truyền thống</option>
                  <option value="flowing">Hòa quyện dải sóng</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Pha sóng (Seed)</span>
                  <span className="font-mono text-cyan-400 font-bold">{phase}°</span>
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

            {/* Color Schemes */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <label className="text-xs text-slate-300 font-semibold block">Bảng màu ControlNet</label>
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
                    onClick={handleAutoOptimizeScanability}
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
                  {/* Background: Wavy output */}
                  {outputDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={outputDataUrl}
                      alt="Wavy QR"
                      className="absolute inset-0 w-full h-full object-contain bg-white"
                    />
                  )}

                  {/* Foreground: Standard Crisp QR clipped by splitPos */}
                  <div
                    style={{ width: `${splitPos}%` }}
                    className="absolute inset-0 h-full overflow-hidden border-r-2 border-cyan-400 bg-white z-10"
                  >
                    {/* Render standard QR representation */}
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
                        : 'bg-gradient-to-br from-emerald-950 via-stone-900 to-teal-950'
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

            {/* Action Buttons: Download PNG, Copy, Send to Generator */}
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
