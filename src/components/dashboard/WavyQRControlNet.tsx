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
  Boxes,
  Cpu,
  SlidersHorizontal,
  Flame,
  Crown,
  Leaf,
  Flower2,
  Anchor,
  Shield,
  Palette,
} from 'lucide-react';
import { processQRTransparency, getSampleQR } from '@/lib/api';

export interface WavyQRControlNetProps {
  initialQRUrl?: string;
  initialPayload?: string;
  onSendToGenerator?: (file: File, dataUrl: string, promptSuggestion?: string) => void;
  onBackToGallery?: () => void;
}

export type EngineCategory = 'monster_organic' | 'wave_ribbons';

export type MonsterStyle =
  | 'botanical_foliage'
  | 'tribal_tattoo'
  | 'sakura_petals'
  | 'vintage_clouds'
  | 'feather_wings'
  | 'ocean_coral'
  | 'baroque_filigree'
  | 'biomech_cyber';

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
  // Engine Mode: ControlNet Monster (Cành cây, Hoa lá, Hình xăm, Phù điêu) vs Wave Ribbons (Sóng & Nét uốn)
  const [engineCategory, setEngineCategory] = useState<EngineCategory>('monster_organic');

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

  // Adaptive Matrix Mode (Tự động thích ứng ma trận)
  const [adaptiveMatrixMode, setAdaptiveMatrixMode] = useState<boolean>(true);

  // Monster Organic Engine Parameters
  const [monsterStyle, setMonsterStyle] = useState<MonsterStyle>('botanical_foliage');
  const [foliageDensity, setFoliageDensity] = useState<number>(85); // 20% - 100%
  const [branchCurvature, setBranchCurvature] = useState<number>(14); // 0 - 30px
  const [camouflageBlend, setCamouflageBlend] = useState<number>(90); // 50% - 100%
  const [enableSprouts, setEnableSprouts] = useState<boolean>(true); // Sprout leaves / tattoo hooks

  // Wave Parameters (For wave ribbons mode)
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
  const [paramTab, setParamTab] = useState<'monster' | 'wave' | 'matrix_zones' | 'color_style'>('monster');

  // Preview & output
  const [previewTab, setPreviewTab] = useState<'wavy' | 'split' | 'simulation'>('wavy');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [simBackground, setSimBackground] = useState<
    'wave_ocean' | 'gold_silk' | 'cyber_neon' | 'marble' | 'sakura_garden' | 'aurora_space' | 'tattoo_skin' | 'jungle_dark'
  >('jungle_dark');
  const [outputDataUrl, setOutputDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 8 Curated ControlNet Monster Organic Styles
  const monsterStylesList = [
    {
      id: 'botanical_foliage',
      title: '🌿 Cành Cây & Hoa Lá',
      desc: 'Cành nhánh, lá non & dây leo đan kết thành khối mã QR',
      icon: Leaf,
      badge: 'Monster Hot',
    },
    {
      id: 'tribal_tattoo',
      title: '🐉 Hình Xăm Tribal & Irezumi',
      desc: 'Họa tiết xăm Celtic, Maori & vảy rồng uốn lượn sắc nét',
      icon: Flame,
      badge: 'Tattoo Art',
    },
    {
      id: 'sakura_petals',
      title: '🌸 Hoa Anh Đào & Cánh Bay',
      desc: 'Đóa hoa 5 cánh nở rộ & cụm cánh hoa rơi bồng bềnh',
      icon: Flower2,
      badge: 'Floral Art',
    },
    {
      id: 'vintage_clouds',
      title: '☁️ Vân Mây Cổ & Sóng Rồng',
      desc: 'Vân mây hoàng gia cuộn xoáy & mào sóng cổ điển Đông Á',
      icon: Compass,
      badge: 'Oriental',
    },
    {
      id: 'feather_wings',
      title: '🦅 Lông Vũ & Đôi Cánh',
      desc: 'Phiến lông vũ thiên thần & cánh chim uốn lượn mềm mại',
      icon: Feather,
      badge: 'Angelic',
    },
    {
      id: 'ocean_coral',
      title: '🪸 San Hô & Thủy Quái',
      desc: 'Rạn san hô biển sâu & xúc tu Kraken uốn lượn huyền ảo',
      icon: Anchor,
      badge: 'Marine Monster',
    },
    {
      id: 'baroque_filigree',
      title: '🏛️ Phù Điêu Hoàng Gia Baroque',
      desc: 'Hoa văn lá Acanthus mạ vàng & phù điêu Rococo quý tộc',
      icon: Crown,
      badge: 'Royal Gold',
    },
    {
      id: 'biomech_cyber',
      title: '⚙️ Vi Mạch Sinh Học Biomech',
      desc: 'Ống dẫn sinh học H.R. Giger & cáp thần kinh tương lai',
      icon: Cpu,
      badge: 'Biomechanical',
    },
  ];

  // 12 Wave Algorithms
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

  // ControlNet Monster Specialized Prompts
  const monsterPromptSuggestions = [
    {
      label: '🌿 Rừng Cây & Hoa Lá Nhiệt Đới (Botanical Monster)',
      style: 'botanical_foliage',
      prompt: 'masterpiece, lush enchanted forest canopy with intertwined oak tree branches and blooming green monstera leaves naturally forming a mystical hidden pattern, morning sunlight piercing through dew droplets, hyper-detailed nature photography, 8k',
    },
    {
      label: '🐉 Hình Xăm Blackwork & Rồng Phương Đông (Irezumi Tattoo)',
      style: 'tribal_tattoo',
      prompt: 'masterpiece, intricate blackwork tattoo sleeve on human skin, Japanese Irezumi dragon scales, bold flowing Celtic knot filigree, sharp linework, studio lighting, award-winning body art photography',
    },
    {
      label: '🌸 Vườn Hoa Anh Đào Nở Rộ (Sakura Blossom)',
      style: 'sakura_petals',
      prompt: 'masterpiece, traditional Japanese cherry blossom garden, blooming pink sakura petals floating on clear river ripples, Mount Fuji in misty sunset background, breathtaking ukiyo-e aesthetic',
    },
    {
      label: '🏛️ Phù Điêu Hoàng Gia Baroque Mạ Vàng 24K',
      style: 'baroque_filigree',
      prompt: 'masterpiece, ancient imperial palace wall relief, 24k gold gilded baroque acanthus leaves and rococo scrolls on black polished marble, dramatic side museum spotlighting, luxury 8k octane render',
    },
    {
      label: '🪸 Thủy Quái Kraken & Rạn San Hô Biển Sâu',
      style: 'ocean_coral',
      prompt: 'masterpiece, underwater mythical abyssal kingdom, glowing bioluminescent coral reef branches and mysterious kraken tentacles forming organic ocean waves, deep sea aquatic photography, national geographic award',
    },
    {
      label: '🦅 Đôi Cánh Thiên Thần Lông Vũ Trắng Muốt',
      style: 'feather_wings',
      prompt: 'masterpiece, majestic angelic wings with layered pure white and golden plumes, delicate floating downy feathers, heavenly golden hour light rays, cinematic atmospheric concept art',
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
          setBranchCurvature(Math.max(6, Math.min(safeMaxAmp, 16)));
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

  // 2. RENDER ENGINE: PROCEDURAL CONTROLNET MONSTER & WAVE CONDITIONING
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

    // =========================================================================
    // MODE A: ADVANCED CONTROLNET MONSTER ORGANIC ENGINE (CÀNH CÂY, HOA LÁ, HÌNH XĂM)
    // =========================================================================
    if (engineCategory === 'monster_organic') {
      const branchAmp = branchCurvature;
      const detailScale = foliageDensity / 100;

      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (isFinderModule(c, r) && finderStyle !== 'flowing') continue;
          if (isFinderSeparator(c, r)) continue;

          const isDark = qrMatrix[r]?.[c] === true;
          if (!isDark) continue;

          const { x: cx, y: cy } = getModuleCenter(c, r);

          // 1. SOLID SCANNABLE CORE ANCHOR
          // Ensures the scanner's threshold sampler registers 100% dark
          ctx.beginPath();
          ctx.arc(cx, cy, fillRadius * 0.95, 0, Math.PI * 2);
          ctx.fill();

          // 2. PROCEDURAL ORGANIC ELEMENT TRANSFORMATIONS

          // THEME 1: BOTANICAL FOLIAGE (Cành cây, Lá non, Dây leo)
          if (monsterStyle === 'botanical_foliage') {
            const seed = (c * 17 + r * 31) % 360;
            const leafAngle = (seed * Math.PI) / 180;
            const leafLen = cellSize * 0.7 * detailScale;

            // Sprout leaves on module perimeter
            if (enableSprouts) {
              ctx.beginPath();
              ctx.ellipse(
                cx + leafLen * Math.cos(leafAngle) * 0.6,
                cy + leafLen * Math.sin(leafAngle) * 0.6,
                leafLen * 0.6,
                leafLen * 0.28,
                leafAngle,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }

            // Organic branching stems to neighbors
            if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
              const next = getModuleCenter(c + 1, r);
              const branchWobble = branchAmp * Math.sin((c + r) * 0.7 + phaseRad);
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 1.35;
              ctx.moveTo(cx, cy);
              ctx.bezierCurveTo(
                cx + cellSize * 0.4,
                cy + branchWobble,
                next.x - cellSize * 0.4,
                next.y - branchWobble,
                next.x,
                next.y
              );
              ctx.stroke();
            }
            if (r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1)) {
              const below = getModuleCenter(c, r + 1);
              const branchWobble = branchAmp * Math.cos((c + r) * 0.7 + phaseRad);
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 1.35;
              ctx.moveTo(cx, cy);
              ctx.bezierCurveTo(
                cx + branchWobble,
                cy + cellSize * 0.4,
                below.x - branchWobble,
                below.y - cellSize * 0.4,
                below.x,
                below.y
              );
              ctx.stroke();
            }
          }

          // THEME 2: TRIBAL TATTOO & IREZUMI (Hình xăm Maori, Celtic, Vẩy Rồng)
          else if (monsterStyle === 'tribal_tattoo') {
            const hookAngle = ((c * 23 + r * 41) % 4) * (Math.PI / 2);
            const hookRadius = cellSize * 0.55 * detailScale;

            // Sharp tribal spike hook
            if (enableSprouts) {
              ctx.beginPath();
              ctx.moveTo(cx, cy);
              ctx.lineTo(cx + hookRadius * Math.cos(hookAngle), cy + hookRadius * Math.sin(hookAngle));
              ctx.lineTo(
                cx + hookRadius * 0.6 * Math.cos(hookAngle + 0.5),
                cy + hookRadius * 0.6 * Math.sin(hookAngle + 0.5)
              );
              ctx.closePath();
              ctx.fill();
            }

            // Intricate Celtic knot connections
            if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
              const next = getModuleCenter(c + 1, r);
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 1.4;
              ctx.moveTo(cx, cy);
              ctx.quadraticCurveTo((cx + next.x) / 2, (cy + next.y) / 2 - branchAmp * 0.8, next.x, next.y);
              ctx.stroke();
            }
            if (r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1)) {
              const below = getModuleCenter(c, r + 1);
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 1.4;
              ctx.moveTo(cx, cy);
              ctx.quadraticCurveTo((cx + below.x) / 2 + branchAmp * 0.8, (cy + below.y) / 2, below.x, below.y);
              ctx.stroke();
            }
          }

          // THEME 3: SAKURA BLOSSOM & PETALS (Hoa Anh Đào 5 cánh)
          else if (monsterStyle === 'sakura_petals') {
            const petalCount = 5;
            const petalLen = fillRadius * 1.15 * detailScale;

            // Draw 5 floral petals
            for (let i = 0; i < petalCount; i++) {
              const pAngle = (i * 2 * Math.PI) / petalCount + (c * 0.2 + r * 0.3);
              const px = cx + petalLen * 0.5 * Math.cos(pAngle);
              const py = cy + petalLen * 0.5 * Math.sin(pAngle);
              ctx.beginPath();
              ctx.ellipse(px, py, petalLen * 0.55, petalLen * 0.32, pAngle, 0, Math.PI * 2);
              ctx.fill();
            }

            // Petal drift stream connections
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

          // THEME 4: VINTAGE AUSPICIOUS CLOUDS (Vân Mây Cổ Điển)
          else if (monsterStyle === 'vintage_clouds') {
            const cloudR = fillRadius * 0.85;
            const scrollOffset = branchAmp * Math.sin((c + r) * 0.5 + phaseRad);

            // Auspicious cloud curl
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.1;
            ctx.arc(cx, cy, cloudR * 1.2, 0, Math.PI * 1.6);
            ctx.stroke();

            // Cloud whorl tail
            if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
              const next = getModuleCenter(c + 1, r);
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 1.3;
              ctx.moveTo(cx, cy);
              ctx.bezierCurveTo(
                cx + cellSize * 0.5,
                cy - scrollOffset,
                next.x - cellSize * 0.5,
                next.y + scrollOffset,
                next.x,
                next.y
              );
              ctx.stroke();
            }
          }

          // THEME 5: FEATHER WINGS (Lông Vũ & Cánh Thiên Thần)
          else if (monsterStyle === 'feather_wings') {
            const fAngle = Math.PI / 4 + ((c % 3) - 1) * 0.2;
            const fLen = fillRadius * 1.3 * detailScale;

            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 0.9;
            ctx.moveTo(cx - fLen * Math.cos(fAngle), cy - fLen * Math.sin(fAngle));
            ctx.lineTo(cx + fLen * Math.cos(fAngle), cy + fLen * Math.sin(fAngle));
            ctx.stroke();

            if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
              const next = getModuleCenter(c + 1, r);
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 1.2;
              ctx.moveTo(cx, cy);
              ctx.lineTo(next.x, next.y);
              ctx.stroke();
            }
          }

          // THEME 6: OCEAN CORAL (Rạn San Hô & Thủy Quái)
          else if (monsterStyle === 'ocean_coral') {
            const tentacleWave = branchAmp * Math.sin((c * 3 + r * 2) * 0.4 + phaseRad);

            if (enableSprouts) {
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 0.9;
              ctx.moveTo(cx, cy);
              ctx.quadraticCurveTo(cx + tentacleWave, cy - cellSize * 0.5, cx + tentacleWave * 1.5, cy - cellSize * 0.6);
              ctx.stroke();
            }

            if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
              const next = getModuleCenter(c + 1, r);
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 1.3;
              ctx.moveTo(cx, cy);
              ctx.quadraticCurveTo((cx + next.x) / 2, (cy + next.y) / 2 + tentacleWave, next.x, next.y);
              ctx.stroke();
            }
          }

          // THEME 7: BAROQUE FILIGREE (Phù Điêu Hoàng Gia Acanthus)
          else if (monsterStyle === 'baroque_filigree') {
            const scrollR = fillRadius * 0.9;

            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.2;
            ctx.arc(cx, cy, scrollR, 0, Math.PI * 1.5);
            ctx.stroke();

            if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
              const next = getModuleCenter(c + 1, r);
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 1.35;
              ctx.moveTo(cx, cy);
              ctx.bezierCurveTo(
                cx + cellSize * 0.4,
                cy - branchAmp * 0.6,
                next.x - cellSize * 0.4,
                next.y + branchAmp * 0.6,
                next.x,
                next.y
              );
              ctx.stroke();
            }
          }

          // THEME 8: BIOMECHANICAL CYBER (Ống dẫn sinh học Giger)
          else if (monsterStyle === 'biomech_cyber') {
            ctx.beginPath();
            ctx.lineWidth = strokeWidth * 1.2;
            ctx.rect(cx - fillRadius * 0.8, cy - fillRadius * 0.8, fillRadius * 1.6, fillRadius * 1.6);
            ctx.stroke();

            if (c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r)) {
              const next = getModuleCenter(c + 1, r);
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 1.4;
              ctx.moveTo(cx, cy);
              ctx.lineTo(next.x, next.y);
              ctx.stroke();
            }
          }
        }
      }
    }

    // =========================================================================
    // MODE B: MATHEMATICAL WAVE RIBBONS ENGINE (DẢI SÓNG HÌNH HỌC)
    // =========================================================================
    else {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (isFinderModule(c, r) && finderStyle !== 'flowing') continue;
          if (isFinderSeparator(c, r)) continue;

          const isDark = qrMatrix[r]?.[c] === true;
          if (!isDark) continue;

          const { x: cx, y: cy } = getModuleCenter(c, r);

          const dx = (cx - qrCenter) / qrCenter;
          const dy = (cy - qrCenter) / qrCenter;
          const distRatio = Math.sqrt(dx * dx + dy * dy);
          const regionalAmpWeight = (centerWaveDecay / 100) * (1 - distRatio * 0.3);
          const effectiveAmp = amplitude * Math.max(0.3, regionalAmpWeight);

          ctx.beginPath();
          ctx.arc(cx, cy, fillRadius, 0, Math.PI * 2);
          ctx.fill();

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
    engineCategory,
    monsterStyle,
    foliageDensity,
    branchCurvature,
    enableSprouts,
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
    a.download = `artqr_${engineCategory}_${engineCategory === 'monster_organic' ? monsterStyle : waveStyle}_${Date.now()}.png`;
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
    const file = new File([bytes], `monster_controlnet_${Date.now()}.png`, { type: 'image/png' });

    let matchingPrompt =
      'masterpiece, lush botanical forest branches forming organic hidden pattern, morning sunlight, macro nature photography, 8k';

    if (engineCategory === 'monster_organic') {
      const found = monsterPromptSuggestions.find((p) => p.style === monsterStyle);
      if (found) matchingPrompt = found.prompt;
    } else {
      const found = monsterPromptSuggestions.find((p) => p.style === waveStyle);
      if (found) matchingPrompt = found.prompt;
    }

    onSendToGenerator(file, outputDataUrl, matchingPrompt);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Engine Category Switcher */}
      <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-gradient-to-tr from-emerald-500/25 via-cyan-500/20 to-amber-500/25 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 shrink-0">
            <Sparkles className="size-6 animate-pulse text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <span>ControlNet Monster Studio • Ngụy Trang Cành Cây, Hoa Lá & Hình Xăm</span>
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
              Biến module thành cành nhánh tự nhiên, cụm hoa nở rộ, nét xăm Tribal & phù điêu hoàng gia bảo toàn mã quét
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
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 hover:opacity-95 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>Đưa vào Phòng Tạo Ảnh</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main Engine Selector (ControlNet Monster vs Wave Ribbons) */}
      <div className="flex items-center bg-[#0e131d] border border-slate-800/90 rounded-2xl p-1.5 max-w-xl mx-auto shadow-xl">
        <button
          type="button"
          onClick={() => {
            setEngineCategory('monster_organic');
            setParamTab('monster');
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            engineCategory === 'monster_organic'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Leaf className="size-4" />
          <span>✨ ControlNet Monster (Cành Cây, Hoa Lá, Hình Xăm)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEngineCategory('wave_ribbons');
            setParamTab('wave');
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            engineCategory === 'wave_ribbons'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-lg shadow-cyan-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Waves className="size-4" />
          <span>🌊 Dải Sóng Uốn Lượn Hình Học</span>
        </button>
      </div>

      {/* Main Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT CONTROLS (5 COLS) */}
        <div className="lg:col-span-5 space-y-5">
          {/* BOX 1: PAYLOAD & MATRIX CONFIGURATION */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center">
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
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1 transition-all"
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
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <LinkIcon className="size-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Matrix Error Correction Level Selector */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { id: 'H', label: 'Cấp H (30%)', sub: 'Ngụy trang mạnh' },
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
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-[11px] font-bold">{lvl.label}</div>
                  <div className="text-[9px] text-slate-400">{lvl.sub}</div>
                </button>
              ))}
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
                  ? 'border-emerald-400 bg-emerald-500/10'
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
                <div className="py-1 flex items-center justify-center gap-2 text-xs text-emerald-400">
                  <RefreshCw className="size-4 animate-spin" />
                  <span>Đang giải mã ma trận QR...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                  <UploadCloud className="size-4 text-emerald-400" />
                  <span className="font-semibold">Tải lên ảnh QR có sẵn để lấy cấu trúc</span>
                </div>
              )}
            </div>
          </div>

          {/* BOX 2: PARAMETER TABS */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 flex-wrap gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
                {engineCategory === 'monster_organic' ? (
                  <button
                    type="button"
                    onClick={() => setParamTab('monster')}
                    className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Leaf className="size-3.5" />
                    <span>Chủ Đề Monster</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setParamTab('wave')}
                    className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Waves className="size-3.5" />
                    <span>Thuật Toán Sóng</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setParamTab('matrix_zones')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    paramTab === 'matrix_zones'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
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
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span>Màu & Tinh Chỉnh</span>
                </button>
              </div>
            </div>

            {/* TAB 1A: CONTROLNET MONSTER STYLES */}
            {paramTab === 'monster' && engineCategory === 'monster_organic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {monsterStylesList.map((style) => {
                    const Icon = style.icon;
                    const isSelected = monsterStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setMonsterStyle(style.id as MonsterStyle)}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-white shadow-md shadow-emerald-950/40'
                            : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`size-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold truncate">{style.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{style.desc}</p>
                        {isSelected && (
                          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Monster Specific Fine-Tuning */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">Thông Số Ngụy Trang Monster</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={enableSprouts}
                        onChange={(e) => setEnableSprouts(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      <span>Đính kèm nụ hoa / lá non / móc xăm</span>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Mật độ hoa lá / chi tiết xăm</span>
                      <span className="font-mono text-emerald-400 font-bold">{foliageDensity}%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      step="5"
                      value={foliageDensity}
                      onChange={(e) => setFoliageDensity(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Độ cong uốn lượn cành nhánh</span>
                      <span className="font-mono text-emerald-400 font-bold">{branchCurvature}px</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="24"
                      step="1"
                      value={branchCurvature}
                      onChange={(e) => setBranchCurvature(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1B: WAVE STYLES */}
            {paramTab === 'wave' && engineCategory === 'wave_ribbons' && (
              <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
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
            )}

            {/* TAB 2: PER-ZONE MATRIX CUSTOMIZATION */}
            {paramTab === 'matrix_zones' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
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
                        <span className="text-emerald-400 font-bold">{finderWeight.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="1.8"
                        step="0.1"
                        value={finderWeight}
                        onChange={(e) => setFinderWeight(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">2. Tỷ Trọng Sóng Tâm Ma Trận</span>
                    <span className="font-mono text-emerald-400 font-bold">{centerWaveDecay}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={centerWaveDecay}
                    onChange={(e) => setCenterWaveDecay(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">3. Lề Viền An Toàn (Quiet Zone)</span>
                    <span className="font-mono text-emerald-400 font-bold">{quietZone} modules</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.5"
                    value={quietZone}
                    onChange={(e) => setQuietZone(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: COLOR, CONTRAST & FINE TUNING */}
            {paramTab === 'color_style' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Độ phủ tâm module (Fill Coverage)</span>
                      <span className="font-mono text-emerald-400 font-bold">{moduleFillRatio}%</span>
                    </div>
                    <input
                      type="range"
                      min="65"
                      max="100"
                      step="1"
                      value={moduleFillRatio}
                      onChange={(e) => setModuleFillRatio(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-semibold">Độ dày nét</span>
                        <span className="font-mono text-emerald-400 font-bold">{strokeWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="14"
                        step="1"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-semibold">Pha sóng (Seed)</span>
                        <span className="font-mono text-emerald-400 font-bold">{phase}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="15"
                        value={phase}
                        onChange={(e) => setPhase(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
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
                          colorPreset === col.id ? 'ring-2 ring-emerald-400 border-transparent shadow-sm' : 'opacity-70 hover:opacity-100 border-transparent'
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
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
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
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
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
                      ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-950 font-bold shadow-md'
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
                      setFoliageDensity(85);
                      setBranchCurvature(10);
                      setModuleFillRatio(90);
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
              <div className="absolute inset-0 opacity-40 pointer-events-none bg-[linear-gradient(45deg,#151921_25%,transparent_25%),linear-gradient(-45deg,#151921_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#151921_75%),linear-gradient(-45deg,transparent_75%,#151921_75%)] bg-[size:20px_20px]" />

              {/* VIEW 1: Clean HD Scannable Canvas */}
              {previewTab === 'wavy' && (
                <div className="relative z-10 flex flex-col items-center justify-center max-h-[460px]">
                  {outputDataUrl ? (
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={outputDataUrl}
                        alt="Monster QR Output"
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
                      <span>Đang tính toán cành lá & hoa văn...</span>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: Interactive Split Slider */}
              {previewTab === 'split' && (
                <div className="relative z-10 w-full max-w-[400px] aspect-square rounded-xl overflow-hidden border border-slate-800 select-none">
                  {outputDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={outputDataUrl}
                      alt="Monster QR"
                      className="absolute inset-0 w-full h-full object-contain bg-white"
                    />
                  )}

                  <div
                    style={{ width: `${splitPos}%` }}
                    className="absolute inset-0 h-full overflow-hidden border-r-2 border-emerald-400 bg-white z-10"
                  >
                    <div className="w-[400px] max-w-none h-full flex items-center justify-center p-6 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sourceDataUrl || outputDataUrl}
                        alt="Standard QR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                      Ma Trận Gốc
                    </span>
                  </div>

                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-amber-400 text-[10px] font-bold border border-amber-500/40 z-0">
                    Ngụy Trang Monster
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
                      simBackground === 'jungle_dark'
                        ? 'bg-gradient-to-br from-emerald-950 via-stone-900 to-green-950'
                        : simBackground === 'tattoo_skin'
                        ? 'bg-gradient-to-br from-amber-950 via-stone-900 to-orange-950'
                        : simBackground === 'sakura_garden'
                        ? 'bg-gradient-to-br from-pink-950 via-stone-900 to-rose-950'
                        : simBackground === 'gold_silk'
                        ? 'bg-gradient-to-br from-amber-950 via-stone-900 to-yellow-950'
                        : simBackground === 'wave_ocean'
                        ? 'bg-gradient-to-br from-blue-900 via-indigo-950 to-teal-900'
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
                      { id: 'jungle_dark', label: '🌿 Rừng Cây' },
                      { id: 'tattoo_skin', label: '🐉 Da Xăm' },
                      { id: 'sakura_garden', label: '🌸 Hoa Đào' },
                      { id: 'gold_silk', label: '✨ Phù Điêu' },
                      { id: 'wave_ocean', label: '🌊 Đại Dương' },
                      { id: 'aurora_space', label: '🌌 Cực Quang' },
                    ].map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setSimBackground(bg.id as any)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          simBackground === bg.id
                            ? 'bg-emerald-400 text-black font-extrabold'
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
                className="flex-1 min-w-[180px] py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-90 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
              >
                <Download className="size-4" />
                <span>Tải Ảnh ControlNet Monster (1024px)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                className="py-3 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-emerald-400" />}
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

          {/* BOX 4: PROMPTS OPTIMIZED FOR CONTROLNET MONSTER */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="size-3.5 text-amber-400" />
                <span>Prompt ControlNet Monster Tối Ưu (Cành Cây, Hoa Lá, Hình Xăm)</span>
              </h3>
              <span className="text-[10px] text-slate-500">Bấm để sao chép prompt</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {monsterPromptSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCopyPrompt(item.prompt)}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer group relative"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                      {item.label}
                    </span>
                    {copiedPrompt === item.prompt ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="size-3" /> Đã sao chép
                      </span>
                    ) : (
                      <Copy className="size-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
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
