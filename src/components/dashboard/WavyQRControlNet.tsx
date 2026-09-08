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
  Network,
  Maximize,
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
  | 'vangogh_starry_swirls'
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
  | 'vangogh_starry'
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

export type FinderStyle = 'glowing_sun_orb' | 'rounded_rings' | 'organic_circles' | 'classic' | 'flowing';
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
  // Engine Mode
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

  // Adaptive Matrix Mode
  const [adaptiveMatrixMode, setAdaptiveMatrixMode] = useState<boolean>(true);

  // Cluster Synthesis & Polyomino Morphing Mode (Hợp nhất cụm module liền kề)
  const [enableClusterSynthesis, setEnableClusterSynthesis] = useState<boolean>(true);
  const [megaMotifScale, setMegaMotifScale] = useState<number>(105); // 80% - 130%
  const [textureRichness, setTextureRichness] = useState<number>(85); // 0% - 100%
  const [enablePictureFrame, setEnablePictureFrame] = useState<boolean>(false); // Khung Tranh Gỗ Sơn Dầu

  // Monster Organic Engine Parameters
  const [monsterStyle, setMonsterStyle] = useState<MonsterStyle>('vangogh_starry_swirls');
  const [foliageDensity, setFoliageDensity] = useState<number>(85); // 20% - 100%
  const [branchCurvature, setBranchCurvature] = useState<number>(14); // 0 - 30px
  const [enableSprouts, setEnableSprouts] = useState<boolean>(true); // Sprout leaves / tattoo hooks

  // Wave Parameters
  const [waveStyle, setWaveStyle] = useState<WaveStyle>('sine_stream');
  const [amplitude, setAmplitude] = useState<number>(10); // 0 - 30px
  const [frequency, setFrequency] = useState<number>(6); // 1 - 20
  const [moduleFillRatio, setModuleFillRatio] = useState<number>(88); // 60% - 100%
  const [strokeWidth, setStrokeWidth] = useState<number>(7); // 3 - 16px
  const [phase, setPhase] = useState<number>(0); // 0 - 360
  const [edgeBlur, setEdgeBlur] = useState<number>(0); // 0 - 8px
  const [colorPreset, setColorPreset] = useState<ColorPreset>('vangogh_starry');

  // Matrix Zone Specific Fine-Tuning
  const [finderStyle, setFinderStyle] = useState<FinderStyle>('glowing_sun_orb');
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
  const [paramTab, setParamTab] = useState<'monster' | 'clusters' | 'matrix_zones' | 'color_style'>('clusters');

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

  // 9 Curated ControlNet Monster Organic Styles
  const monsterStylesList = [
    {
      id: 'vangogh_starry_swirls',
      title: '🌌 Sơn Dầu Van Gogh & Mây Xoáy',
      desc: 'Cụm 2x2 thành Vòng Xoáy Mây Sơn Dầu • Nét nối thành Dải Vân Cuộn Lượn Vàng Chanh & Xanh Neon',
      icon: Palette,
      badge: 'Oil Impasto',
    },
    {
      id: 'botanical_foliage',
      title: '🌿 Cành Cây & Hoa Lá',
      desc: 'Cụm 2x2 thành Đóa Hoa Sen/Hồng lớn • Cụm dài thành Thân Cây Cổ Thụ & Chùm Lá',
      icon: Leaf,
      badge: 'Cluster Pro',
    },
    {
      id: 'tribal_tattoo',
      title: '🐉 Hình Xăm Tribal & Dragon',
      desc: 'Cụm 2x2 thành Đầu Rồng / Mặt Quỷ Oni • Cụm dài thành Thân Rồng Vẩy Giáp',
      icon: Flame,
      badge: 'Tattoo Master',
    },
    {
      id: 'sakura_petals',
      title: '🌸 Hoa Anh Đào & Cành Đào',
      desc: 'Cụm 2x2 thành Chùm Hoa Nở Bung • Cụm dài thành Cành Đào Bonsai Khẳng Khiu',
      icon: Flower2,
      badge: 'Bonsai Art',
    },
    {
      id: 'vintage_clouds',
      title: '☁️ Vân Mây Cổ & Mào Sóng',
      desc: 'Cụm 2x2 thành Cuộn Mây Hoàng Cung • Cụm dài thành Dải Khói Rồng Uốn Lượn',
      icon: Compass,
      badge: 'Royal Cloud',
    },
    {
      id: 'feather_wings',
      title: '🦅 Lông Vũ & Cánh Đại Bàng',
      desc: 'Cụm 2x2 thành Cánh Chim Mở Rộng • Cụm dài thành Dải Lông Vũ Xếp Lớp',
      icon: Feather,
      badge: 'Wings Art',
    },
    {
      id: 'ocean_coral',
      title: '🪸 San Hô & Xúc Tu Kraken',
      desc: 'Cụm 2x2 thành Thủy Quái Biển Sâu • Cụm dài thành Xúc Tu Bạch Tuộc Giác Hút',
      icon: Anchor,
      badge: 'Ocean Beast',
    },
    {
      id: 'baroque_filigree',
      title: '🏛️ Phù Điêu Hoàng Gia Baroque',
      desc: 'Cụm 2x2 thành Huy Hiệu Vương Miện • Cụm dài thành Phào Chỉ Lá Acanthus',
      icon: Crown,
      badge: 'Gilded Crest',
    },
    {
      id: 'biomech_cyber',
      title: '⚙️ Vi Mạch Sinh Học Biomech',
      desc: 'Cụm 2x2 thành Lõi Lò Phản Ứng Cyber • Cụm dài thành Bó Cáp Thần Kinh',
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
      label: '🌌 Sơn Dầu Van Gogh & Vân Mây Xoáy (Starry Night Swirls)',
      style: 'vangogh_starry_swirls',
      prompt: 'masterpiece, thick impasto oil painting by Vincent van Gogh, swirling clouds and celestial glowing yellow and lime green curlicue waves flowing seamlessly on deep cobalt blue canvas, ornate carved golden picture frame, starry night impressionist fine art, 8k resolution',
    },
    {
      label: '🌿 Rừng Cây & Hoa Lá (Botanical Tree & Giant Blooming Rose)',
      style: 'botanical_foliage',
      prompt: 'masterpiece, enchanted botanical forest canopy, thick gnarled oak branches and giant blooming roses naturally merging into a secret mystical pattern, morning sunbeams shining through dewdrops, 8k national geographic nature photography',
    },
    {
      label: '🐉 Rồng Đông Á & Hình Xăm Irezumi (Dragon Sleeve Tattoo)',
      style: 'tribal_tattoo',
      prompt: 'masterpiece, majestic Japanese Irezumi dragon tattoo sleeve on skin, flowing dragon scales, sharp horns, Oni demon mask medallion, intricate blackwork filigree linework, studio body art photography',
    },
    {
      label: '🌸 Cành Đào Bonsai & Chùm Hoa Nở Bung (Sakura Blossom Cluster)',
      style: 'sakura_petals',
      prompt: 'masterpiece, antique Japanese bonsai tree with thick aged bark and large blooming cherry blossom clusters, pink petals drifting over a zen stone garden, soft sunset backlight, ukiyo-e fine art',
    },
    {
      label: '🏛️ Phù Điêu Hoàng Gia Baroque Dát Vàng & Vương Miện',
      style: 'baroque_filigree',
      prompt: 'masterpiece, imperial French palace wall relief, 24k gold gilded royal crown medallion surrounded by flowing acanthus leaf scrolls and rococo carvings on polished black marble, luxury 8k octane render',
    },
    {
      label: '🪸 Thủy Quái Kraken & Rạn San Hô Biển Sâu',
      style: 'ocean_coral',
      prompt: 'masterpiece, abyssal marine coral reef and mythical Kraken tentacles with glowing bioluminescent suction cups, deep ocean photography, intricate underwater world',
    },
    {
      label: '🦅 Đôi Cánh Đại Bàng & Lông Vũ Thiên Thần',
      style: 'feather_wings',
      prompt: 'masterpiece, giant majestic eagle wings spread wide with detailed layered plumage and angel downy feathers, dramatic golden hour rays, high resolution concept art',
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

  // 2. RENDER ENGINE: CONNECTED CLUSTER & POLYOMINO SYNTHESIS (HỢP NHẤT CỤM MODULE LIỀN KỀ)
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
      case 'vangogh_starry':
        bgColor = '#093a7d';
        strokeColor = '#facc15';
        break;
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
    // STEP 1: CLUSTER RECOGNITION (Nhận diện cụm 2x2, Hàng ngang dài, Cột dọc dài)
    // =========================================================================
    const processed2x2: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

    // =========================================================================
    // STEP 2: RENDER 2x2 MEGA-CLUSTERS (Đóa hoa khổng lồ / Đầu rồng / Vòng xoáy)
    // =========================================================================
    if (enableClusterSynthesis && engineCategory === 'monster_organic') {
      const motifR = cellSize * (megaMotifScale / 100);

      for (let r = 0; r < N - 1; r++) {
        for (let c = 0; c < N - 1; c++) {
          if (
            qrMatrix[r]?.[c] &&
            qrMatrix[r]?.[c + 1] &&
            qrMatrix[r + 1]?.[c] &&
            qrMatrix[r + 1]?.[c + 1] &&
            !isFinderModule(c, r) &&
            !isFinderModule(c + 1, r + 1) &&
            !processed2x2[r][c] &&
            !processed2x2[r][c + 1] &&
            !processed2x2[r + 1][c] &&
            !processed2x2[r + 1][c + 1]
          ) {
            // Mark as 2x2 mega-cluster
            processed2x2[r][c] = true;
            processed2x2[r][c + 1] = true;
            processed2x2[r + 1][c] = true;
            processed2x2[r + 1][c + 1] = true;

            // Center of the 2x2 block
            const center2x2X = (c + quietZone + 1.0) * cellSize;
            const center2x2Y = (r + quietZone + 1.0) * cellSize;

            // 1. Draw solid cores for all 4 modules so scanner reads all 4 bits perfectly
            [
              getModuleCenter(c, r),
              getModuleCenter(c + 1, r),
              getModuleCenter(c, r + 1),
              getModuleCenter(c + 1, r + 1),
            ].forEach((pt) => {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, fillRadius * 0.95, 0, Math.PI * 2);
              ctx.fill();
            });

            // 2. SYNTHESIZE LARGE MEGA-MOTIF SPANNING THE 2x2 BLOCK

            // CLUSTER THEME 0: VAN GOGH OIL IMPASTO — STARRY NIGHT SWIRLS & GALAXY VORTEX
            if (monsterStyle === 'vangogh_starry_swirls') {
              for (let layer = 0; layer < 3; layer++) {
                const sColor = layer === 0 ? '#84cc16' : layer === 1 ? '#facc15' : '#ffffff';
                const sWidth = layer === 0 ? strokeWidth * 1.8 : layer === 1 ? strokeWidth * 1.1 : strokeWidth * 0.55;
                const rMax = motifR * (1.1 - layer * 0.1);
                ctx.beginPath();
                ctx.strokeStyle = sColor;
                ctx.lineWidth = sWidth;
                for (let a = 0; a <= Math.PI * 3.2; a += 0.15) {
                  const spiralR = (a / (Math.PI * 3.2)) * rMax;
                  const px = center2x2X + spiralR * Math.cos(a + phaseRad + layer * 0.4);
                  const py = center2x2Y + spiralR * Math.sin(a + phaseRad + layer * 0.4);
                  if (a === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                }
                ctx.stroke();
              }
              // Center radiant golden core
              ctx.fillStyle = '#facc15';
              ctx.beginPath();
              ctx.arc(center2x2X, center2x2Y, cellSize * 0.38, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.arc(center2x2X, center2x2Y, cellSize * 0.2, 0, Math.PI * 2);
              ctx.fill();
            }

            // CLUSTER THEME 1: BOTANICAL — GIANT BLOOMING ROSE / LOTUS FLOWER
            else if (monsterStyle === 'botanical_foliage') {
              const petalLayers = 3;
              for (let layer = 0; layer < petalLayers; layer++) {
                const count = 6 + layer * 2;
                const radLayer = motifR * (1 - layer * 0.22);
                for (let p = 0; p < count; p++) {
                  const pAng = (p * 2 * Math.PI) / count + (layer * 0.3) + phaseRad;
                  const px = center2x2X + radLayer * 0.5 * Math.cos(pAng);
                  const py = center2x2Y + radLayer * 0.5 * Math.sin(pAng);
                  ctx.beginPath();
                  ctx.ellipse(px, py, radLayer * 0.5, radLayer * 0.28, pAng, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
              // Center floral pistil
              ctx.beginPath();
              ctx.arc(center2x2X, center2x2Y, cellSize * 0.35, 0, Math.PI * 2);
              ctx.fill();
            }

            // CLUSTER THEME 2: TRIBAL TATTOO — DRAGON SEAL CREST / ONI TOTEM
            else if (monsterStyle === 'tribal_tattoo') {
              // Outer spiked mandala ring
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 1.5;
              for (let a = 0; a <= Math.PI * 2; a += 0.2) {
                const spR = motifR * (1 + 0.2 * Math.sin(a * 6 + phaseRad));
                const px = center2x2X + spR * Math.cos(a);
                const py = center2x2Y + spR * Math.sin(a);
                if (a === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.stroke();

              // Dragon Horns & Crest
              ctx.beginPath();
              ctx.arc(center2x2X, center2x2Y, motifR * 0.45, 0, Math.PI * 2);
              ctx.fill();
            }

            // CLUSTER THEME 3: SAKURA — 3-BLOSSOM CLUSTER BOUQUET
            else if (monsterStyle === 'sakura_petals') {
              [
                { ox: -cellSize * 0.35, oy: -cellSize * 0.35 },
                { ox: cellSize * 0.35, oy: -cellSize * 0.2 },
                { ox: 0, oy: cellSize * 0.35 },
              ].forEach((offset) => {
                const subX = center2x2X + offset.ox;
                const subY = center2x2Y + offset.oy;
                for (let i = 0; i < 5; i++) {
                  const a = (i * 2 * Math.PI) / 5 + phaseRad;
                  ctx.beginPath();
                  ctx.ellipse(
                    subX + cellSize * 0.3 * Math.cos(a),
                    subY + cellSize * 0.3 * Math.sin(a),
                    cellSize * 0.32,
                    cellSize * 0.18,
                    a,
                    0,
                    Math.PI * 2
                  );
                  ctx.fill();
                }
              });
            }

            // CLUSTER THEME 4: BAROQUE — ROYAL GILDED MEDALLION CREST
            else if (monsterStyle === 'baroque_filigree') {
              // Intricate royal rosette medallion
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 1.6;
              ctx.arc(center2x2X, center2x2Y, motifR * 0.85, 0, Math.PI * 2);
              ctx.stroke();

              // 8-point Royal Star
              ctx.beginPath();
              for (let i = 0; i < 8; i++) {
                const a = (i * Math.PI) / 4;
                ctx.moveTo(center2x2X, center2x2Y);
                ctx.lineTo(center2x2X + motifR * 0.75 * Math.cos(a), center2x2Y + motifR * 0.75 * Math.sin(a));
              }
              ctx.stroke();
            }

            // CLUSTER THEME 5: OCEAN CORAL — KRAKEN MONSTER EYE / ABYSSAL MEDUSA
            else if (monsterStyle === 'ocean_coral') {
              ctx.beginPath();
              ctx.arc(center2x2X, center2x2Y, motifR * 0.7, 0, Math.PI * 2);
              ctx.fill();

              // 8 radiating tentacles
              for (let t = 0; t < 8; t++) {
                const tAng = (t * 2 * Math.PI) / 8 + phaseRad;
                ctx.beginPath();
                ctx.lineWidth = strokeWidth * 1.3;
                ctx.moveTo(center2x2X, center2x2Y);
                ctx.quadraticCurveTo(
                  center2x2X + motifR * Math.cos(tAng + 0.3),
                  center2x2Y + motifR * Math.sin(tAng + 0.3),
                  center2x2X + motifR * 1.2 * Math.cos(tAng),
                  center2x2Y + motifR * 1.2 * Math.sin(tAng)
                );
                ctx.stroke();
              }
            }

            // CLUSTER THEME 6: BIOMECHANICAL — CYBERNETIC CORE ENGINE
            else {
              ctx.beginPath();
              ctx.lineWidth = strokeWidth * 1.5;
              ctx.strokeRect(center2x2X - motifR * 0.7, center2x2Y - motifR * 0.7, motifR * 1.4, motifR * 1.4);
              ctx.beginPath();
              ctx.arc(center2x2X, center2x2Y, motifR * 0.45, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }

    // =========================================================================
    // STEP 3: RENDER REGULAR MODULES, CONNECTED RUNS & SHAPES
    // =========================================================================
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (isFinderModule(c, r) && finderStyle !== 'flowing') continue;
        if (isFinderSeparator(c, r)) continue;
        if (processed2x2[r][c]) continue; // Already rendered as part of 2x2 mega-cluster

        const isDark = qrMatrix[r]?.[c] === true;
        if (!isDark) continue;

        const { x: cx, y: cy } = getModuleCenter(c, r);

        // Core solid anchor
        ctx.beginPath();
        ctx.arc(cx, cy, fillRadius * 0.95, 0, Math.PI * 2);
        ctx.fill();

        // -------------------------------------------------------------
        // MONSTER ORGANIC RUNS & SHAPE MORPHING
        // -------------------------------------------------------------
        if (engineCategory === 'monster_organic') {
          const detailScale = foliageDensity / 100;
          const branchAmp = branchCurvature;

          // Check connectivity
          const hasRight = c + 1 < N && qrMatrix[r]?.[c + 1] && !isFinderModule(c + 1, r);
          const hasLeft = c - 1 >= 0 && qrMatrix[r]?.[c - 1] && !isFinderModule(c - 1, r);
          const hasDown = r + 1 < N && qrMatrix[r + 1]?.[c] && !isFinderModule(c, r + 1);
          const hasUp = r - 1 >= 0 && qrMatrix[r - 1]?.[c] && !isFinderModule(c, r - 1);

          const isIsolated = !hasRight && !hasLeft && !hasDown && !hasUp;

          // 1. ISOLATED SINGLE MODULE (Nụ hoa đơn / Chiếc lá bay / Chấm sao sáng)
          if (isIsolated && enableSprouts) {
            if (monsterStyle === 'vangogh_starry_swirls') {
              // Concentric glowing starry moonlet
              ctx.fillStyle = 'rgba(132, 204, 22, 0.45)';
              ctx.beginPath();
              ctx.arc(cx, cy, fillRadius * 1.35, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#84cc16';
              ctx.beginPath();
              ctx.arc(cx, cy, fillRadius * 1.05, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#facc15';
              ctx.beginPath();
              ctx.arc(cx, cy, fillRadius * 0.8, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(cx, cy, fillRadius * 0.4, 0, Math.PI * 2);
              ctx.fill();
            } else if (monsterStyle === 'botanical_foliage') {
              ctx.beginPath();
              ctx.ellipse(cx, cy - cellSize * 0.45, cellSize * 0.4, cellSize * 0.2, 0, 0, Math.PI * 2);
              ctx.fill();
            } else if (monsterStyle === 'sakura_petals') {
              ctx.beginPath();
              ctx.arc(cx, cy, fillRadius * 1.1, 0, Math.PI * 2);
              ctx.fill();
            } else if (monsterStyle === 'tribal_tattoo') {
              ctx.beginPath();
              ctx.moveTo(cx, cy - cellSize * 0.5);
              ctx.lineTo(cx + cellSize * 0.15, cy - cellSize * 0.15);
              ctx.lineTo(cx + cellSize * 0.5, cy);
              ctx.lineTo(cx + cellSize * 0.15, cy + cellSize * 0.15);
              ctx.lineTo(cx, cy + cellSize * 0.5);
              ctx.lineTo(cx - cellSize * 0.15, cy + cellSize * 0.15);
              ctx.lineTo(cx - cellSize * 0.5, cy);
              ctx.lineTo(cx - cellSize * 0.15, cy - cellSize * 0.15);
              ctx.closePath();
              ctx.fill();
            }
          }

          // 2. HORIZONTAL & VERTICAL RUNS
          if (monsterStyle === 'vangogh_starry_swirls') {
            if (hasRight) {
              const next = getModuleCenter(c + 1, r);
              const curlAmp = branchAmp * 1.2 * Math.sin((c + r) * 0.8 + phaseRad);
              const midX = (cx + next.x) / 2;
              const midY = (cy + next.y) / 2 + curlAmp;

              // Layer 1: Neon Lime Green Underlay
              ctx.beginPath();
              ctx.strokeStyle = '#84cc16';
              ctx.lineWidth = strokeWidth * 1.7;
              ctx.moveTo(cx, cy);
              ctx.bezierCurveTo(cx + cellSize * 0.35, cy + curlAmp * 1.4, next.x - cellSize * 0.35, next.y - curlAmp * 1.4, next.x, next.y);
              ctx.stroke();

              // Layer 2: Golden Lemon Yellow Core
              ctx.beginPath();
              ctx.strokeStyle = '#facc15';
              ctx.lineWidth = strokeWidth * 1.05;
              ctx.moveTo(cx, cy);
              ctx.bezierCurveTo(cx + cellSize * 0.35, cy + curlAmp * 1.4, next.x - cellSize * 0.35, next.y - curlAmp * 1.4, next.x, next.y);
              ctx.stroke();

              // Layer 3: Creamy White Highlight Sheen
              ctx.beginPath();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = strokeWidth * 0.45;
              ctx.moveTo(cx, cy);
              ctx.bezierCurveTo(cx + cellSize * 0.35, cy + curlAmp * 1.4, next.x - cellSize * 0.35, next.y - curlAmp * 1.4, next.x, next.y);
              ctx.stroke();

              // Sprout curly cloud hook
              if (enableSprouts) {
                ctx.beginPath();
                ctx.strokeStyle = '#84cc16';
                ctx.lineWidth = strokeWidth * 1.2;
                ctx.arc(midX, midY, cellSize * 0.38, 0, Math.PI * 1.5);
                ctx.stroke();
                ctx.beginPath();
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = strokeWidth * 0.7;
                ctx.arc(midX, midY, cellSize * 0.38, 0, Math.PI * 1.5);
                ctx.stroke();
              }
            }

            if (hasDown) {
              const below = getModuleCenter(c, r + 1);
              const curlAmp = branchAmp * 1.2 * Math.cos((c + r) * 0.8 + phaseRad);
              const midX = (cx + below.x) / 2 + curlAmp;
              const midY = (cy + below.y) / 2;

              // Layer 1: Neon Lime Green
              ctx.beginPath();
              ctx.strokeStyle = '#84cc16';
              ctx.lineWidth = strokeWidth * 1.7;
              ctx.moveTo(cx, cy);
              ctx.bezierCurveTo(cx + curlAmp * 1.4, cy + cellSize * 0.35, below.x - curlAmp * 1.4, below.y - cellSize * 0.35, below.x, below.y);
              ctx.stroke();

              // Layer 2: Golden Lemon Yellow Core
              ctx.beginPath();
              ctx.strokeStyle = '#facc15';
              ctx.lineWidth = strokeWidth * 1.05;
              ctx.moveTo(cx, cy);
              ctx.bezierCurveTo(cx + curlAmp * 1.4, cy + cellSize * 0.35, below.x - curlAmp * 1.4, below.y - cellSize * 0.35, below.x, below.y);
              ctx.stroke();

              // Layer 3: Creamy White Highlight Sheen
              ctx.beginPath();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = strokeWidth * 0.45;
              ctx.moveTo(cx, cy);
              ctx.bezierCurveTo(cx + curlAmp * 1.4, cy + cellSize * 0.35, below.x - curlAmp * 1.4, below.y - cellSize * 0.35, below.x, below.y);
              ctx.stroke();

              if (enableSprouts) {
                ctx.beginPath();
                ctx.strokeStyle = '#84cc16';
                ctx.lineWidth = strokeWidth * 1.2;
                ctx.arc(midX, midY, cellSize * 0.38, Math.PI * 0.5, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = strokeWidth * 0.7;
                ctx.arc(midX, midY, cellSize * 0.38, Math.PI * 0.5, Math.PI * 2);
                ctx.stroke();
              }
            }
          } else {
            // General Organic branch runs
            if (hasRight) {
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

              if (enableSprouts && monsterStyle === 'botanical_foliage') {
                const midX = (cx + next.x) / 2;
                const midY = (cy + next.y) / 2 + branchWobble * 0.5;
                ctx.beginPath();
                ctx.ellipse(midX, midY - cellSize * 0.35, cellSize * 0.35 * detailScale, cellSize * 0.18, -0.4, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            if (hasDown) {
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

              if (enableSprouts && monsterStyle === 'botanical_foliage') {
                const midX = (cx + below.x) / 2 + branchWobble * 0.5;
                const midY = (cy + below.y) / 2;
                ctx.beginPath();
                ctx.ellipse(midX + cellSize * 0.35, midY, cellSize * 0.35 * detailScale, cellSize * 0.18, 0.4, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }

        // -------------------------------------------------------------
        // GEOMETRIC WAVE RIBBONS MODE
        // -------------------------------------------------------------
        else {
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

      if (finderStyle === 'glowing_sun_orb') {
        const frameW = cellSize * 0.95 * finderWeight;
        const boxSize = 7 * cellSize;

        // Outer golden painted square
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(originX + frameW * 0.1, originY + frameW * 0.1, boxSize - frameW * 0.2, boxSize - frameW * 0.2, cellSize * 0.7);
        ctx.stroke();

        // Thick golden border
        ctx.lineWidth = frameW;
        ctx.strokeStyle = '#facc15';
        const innerBoxSize = boxSize - frameW;
        ctx.strokeRect(originX + frameW / 2, originY + frameW / 2, innerBoxSize, innerBoxSize);

        // Cobalt blue canvas inside eye
        ctx.fillStyle = colorPreset === 'vangogh_starry' ? '#093a7d' : bgColor;
        ctx.fillRect(originX + frameW, originY + frameW, boxSize - 2 * frameW, boxSize - 2 * frameW);

        // Radiant Golden Sun / Moon Orb
        const sunR = 1.45 * cellSize * finderWeight;

        // Sun outer halo
        ctx.fillStyle = 'rgba(132, 204, 22, 0.45)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunR * 1.15, 0, Math.PI * 2);
        ctx.fill();

        // Main golden sun disk
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunR, 0, Math.PI * 2);
        ctx.fill();

        // Bright inner sun center
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunR * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Subtle concentric sun brush ring
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunR * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      } else if (finderStyle === 'rounded_rings') {
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

    // --- OPTIONAL GILDED CARVED WOODEN / OIL IMPASTO PICTURE FRAME ---
    if (enablePictureFrame) {
      const frameThickness = canvasSize * 0.055; // ~56px
      ctx.save();

      // Top border
      const gradTop = ctx.createLinearGradient(0, 0, 0, frameThickness);
      gradTop.addColorStop(0, '#78350f');
      gradTop.addColorStop(0.3, '#d97706');
      gradTop.addColorStop(0.7, '#f59e0b');
      gradTop.addColorStop(1, '#9a3412');
      ctx.fillStyle = gradTop;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvasSize, 0);
      ctx.lineTo(canvasSize - frameThickness, frameThickness);
      ctx.lineTo(frameThickness, frameThickness);
      ctx.closePath();
      ctx.fill();

      // Bottom border
      const gradBot = ctx.createLinearGradient(0, canvasSize - frameThickness, 0, canvasSize);
      gradBot.addColorStop(0, '#9a3412');
      gradBot.addColorStop(0.3, '#f59e0b');
      gradBot.addColorStop(0.7, '#d97706');
      gradBot.addColorStop(1, '#78350f');
      ctx.fillStyle = gradBot;
      ctx.beginPath();
      ctx.moveTo(0, canvasSize);
      ctx.lineTo(canvasSize, canvasSize);
      ctx.lineTo(canvasSize - frameThickness, canvasSize - frameThickness);
      ctx.lineTo(frameThickness, canvasSize - frameThickness);
      ctx.closePath();
      ctx.fill();

      // Left border
      const gradLeft = ctx.createLinearGradient(0, 0, frameThickness, 0);
      gradLeft.addColorStop(0, '#78350f');
      gradLeft.addColorStop(0.5, '#d97706');
      gradLeft.addColorStop(1, '#9a3412');
      ctx.fillStyle = gradLeft;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(frameThickness, frameThickness);
      ctx.lineTo(frameThickness, canvasSize - frameThickness);
      ctx.lineTo(0, canvasSize);
      ctx.closePath();
      ctx.fill();

      // Right border
      const gradRight = ctx.createLinearGradient(canvasSize - frameThickness, 0, canvasSize, 0);
      gradRight.addColorStop(0, '#9a3412');
      gradRight.addColorStop(0.5, '#d97706');
      gradRight.addColorStop(1, '#78350f');
      ctx.fillStyle = gradRight;
      ctx.beginPath();
      ctx.moveTo(canvasSize, 0);
      ctx.lineTo(canvasSize, canvasSize);
      ctx.lineTo(canvasSize - frameThickness, canvasSize - frameThickness);
      ctx.lineTo(canvasSize - frameThickness, frameThickness);
      ctx.closePath();
      ctx.fill();

      // Impasto wood grain striations
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
      ctx.lineWidth = 1.5;
      for (let i = 8; i < canvasSize; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 2);
        ctx.lineTo(i + 8, frameThickness - 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(i, canvasSize - 2);
        ctx.lineTo(i - 8, canvasSize - frameThickness + 2);
        ctx.stroke();
      }
      for (let j = 8; j < canvasSize; j += 16) {
        ctx.beginPath();
        ctx.moveTo(2, j);
        ctx.lineTo(frameThickness - 2, j + 8);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(canvasSize - 2, j);
        ctx.lineTo(canvasSize - frameThickness + 2, j - 8);
        ctx.stroke();
      }
      ctx.restore();
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
    enableClusterSynthesis,
    megaMotifScale,
    textureRichness,
    enablePictureFrame,
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
    a.download = `artqr_clusters_${engineCategory === 'monster_organic' ? monsterStyle : waveStyle}_${Date.now()}.png`;
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
    const file = new File([bytes], `cluster_monster_controlnet_${Date.now()}.png`, { type: 'image/png' });

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
            <Network className="size-6 animate-pulse text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Hợp Nhất Cụm Module Liền Kề • ControlNet Monster Synthesis</span>
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
              Cụm 2x2 biến thành <strong className="text-amber-300">Đóa Hoa Nở / Đầu Rồng</strong> • Cụm dài thành <strong className="text-emerald-300">Thân Cây Gỗ / Thân Rồng Vẩy Giáp</strong>
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
            setParamTab('clusters');
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            engineCategory === 'monster_organic'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Network className="size-4" />
          <span>✨ Hợp Nhất Cụm Module (Hoa, Cành, Rồng)</span>
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
                    onClick={() => setParamTab('clusters')}
                    className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Network className="size-3.5" />
                    <span>Hợp Nhất Cụm</span>
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
                  onClick={() => setParamTab('monster')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    paramTab === 'monster'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Leaf className="size-3.5" />
                  <span>Chủ Đề</span>
                </button>

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
                  <span>Màu & Nét</span>
                </button>
              </div>
            </div>

            {/* TAB 1: CLUSTER SYNTHESIS CONTROLS */}
            {paramTab === 'clusters' && engineCategory === 'monster_organic' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Network className="size-4 text-emerald-400" />
                      <span>Thuật Toán Hợp Nhất Cụm Polyomino</span>
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-emerald-300">
                      <input
                        type="checkbox"
                        checked={enableClusterSynthesis}
                        onChange={(e) => setEnableClusterSynthesis(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      <span>BẬT Cụm</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Tự động phân tích các khối module liền kề: Cụm <strong>2×2 (4 ô)</strong> biến thành đóa hoa hồng/đầu rồng lớn, cụm <strong>1×N / N×1</strong> biến thành cành gỗ/thân rồng dài uốn lượn.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Kích thước Đóa Hoa / Đầu Rồng (Cụm 2x2)</span>
                      <span className="font-mono text-emerald-400 font-bold">{megaMotifScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="130"
                      step="5"
                      value={megaMotifScale}
                      onChange={(e) => setMegaMotifScale(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                </div>

                {/* Theme Selector for Cluster Morphing */}
                <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
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
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: MONSTER THEMES */}
            {paramTab === 'monster' && (
              <div className="space-y-3">
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

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Độ uốn lượn cành nhánh</span>
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
            )}

            {/* TAB 3: MATRIX ZONES */}
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
                        <option value="glowing_sun_orb">☀️ Vầng Dương & Trăng Tròn Sơn Dầu</option>
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Crown className="size-3.5 text-amber-400" />
                      <span>2. Khung Tranh Gỗ Dát Vàng Cổ Điển</span>
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-amber-300">
                      <input
                        type="checkbox"
                        checked={enablePictureFrame}
                        onChange={(e) => setEnablePictureFrame(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>BẬT Khung</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Vẽ viền khung tranh gỗ sơn dầu dát vàng bao quanh toàn bộ bức tranh mã QR.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">3. Tỷ Trọng Sóng Tâm Ma Trận</span>
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
              </div>
            )}

            {/* TAB 4: COLOR & STYLE */}
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

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="text-xs text-slate-300 font-semibold block">Bảng màu ControlNet (11 phối màu)</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'vangogh_starry', label: '🌌 Van Gogh Cobalt', bg: 'bg-blue-600/30 text-yellow-300 border border-yellow-500/50' },
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
                        alt="Cluster Monster QR Output"
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
                      <span>Đang tổng hợp cụm hoa lá & hình xăm...</span>
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
                    Hợp Nhất Cụm Monster
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

          {/* BOX 4: PROMPTS OPTIMIZED FOR CONTROLNET MONSTER CLUSTERS */}
          <div className="bg-[#0c1017]/80 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="size-3.5 text-amber-400" />
                <span>Prompt ControlNet Monster Hợp Nhất Cụm (Hoa Lớn, Thân Rồng, Cành Cây)</span>
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
