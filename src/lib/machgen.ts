export type AspectRatio = '16:9' | '1:1' | '9:16' | '4:3' | '3:2';

export interface ImageGenOptions {
  model?: string;
  ratio?: AspectRatio;
  style?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  enhance?: boolean;
}

export interface GeneratedImageResult {
  url: string;
  source: 'MACHGEN';
  prompt: string;
  model: string;
  ratio: AspectRatio;
  createdAt: string;
  seed?: number;
}

export const IMAGE_STYLES = [
  {
    id: 'cinematic',
    label: 'Cinematic 8K',
    promptSuffix: ', cinematic lighting, 8k resolution, photorealistic masterpiece, 35mm film photograph, depth of field, sharp details, octane render',
  },
  {
    id: 'photoreal',
    label: 'Photorealistic DSLR',
    promptSuffix: ', hyperrealistic photo, sony a7 iv, f/1.8 lens, natural sunlight, ultra sharp focus, highly detailed skin textures, realistic reflection',
  },
  {
    id: 'anime',
    label: 'Anime / Manga',
    promptSuffix: ', vibrant anime style, studio ghibli inspired, clean lineart, makoto shinkai aesthetic, detailed background, rich colors',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk Neon',
    promptSuffix: ', cyberpunk aesthetic, neon glow, futuristic night city, volumetric smoke, high tech holographic reflections, octane render',
  },
  {
    id: '3d_render',
    label: '3D Pixar Render',
    promptSuffix: ', 3d stylized character, pixar aesthetic, unreal engine 5, ray tracing, cute volumetric lighting, vibrant smooth textures',
  },
  {
    id: 'fantasy',
    label: 'Fantasy Concept',
    promptSuffix: ', ethereal fantasy concept art, artstation trending, matte painting, mystical glowing atmosphere, hyperdetailed world',
  },
  {
    id: 'oil_paint',
    label: 'Oil Painting',
    promptSuffix: ', thick impasto oil painting, textured brushstrokes, classical art masterpiece, rich vibrant colors, museum canvas quality',
  },
  {
    id: 'minimal',
    label: 'Minimalist Vector',
    promptSuffix: ', flat vector illustration, minimalist clean geometric shapes, modern pastel palette, elegant composition',
  },
];

export const ASPECT_RATIOS: Record<AspectRatio, { label: string; w: number; h: number; pxW: number; pxH: number }> = {
  '1:1': { label: '1:1 (Vuông)', w: 1, h: 1, pxW: 1024, pxH: 1024 },
  '16:9': { label: '16:9 (Ngang / Video)', w: 16, h: 9, pxW: 1280, pxH: 720 },
  '9:16': { label: '9:16 (Dọc / Story)', w: 9, h: 16, pxW: 720, pxH: 1280 },
  '4:3': { label: '4:3 (Tiêu chuẩn)', w: 4, h: 3, pxW: 1024, pxH: 768 },
  '3:2': { label: '3:2 (Nhiếp ảnh)', w: 3, h: 2, pxW: 1080, pxH: 720 },
};

export const AVAILABLE_MODELS = [
  {
    id: 'flux',
    name: 'MachGen FLUX.1 Pro',
    provider: 'MachGen Core',
    badge: 'Flagship Ultra',
    desc: 'Độ chân thực cực cao, bắt trọn từng chi tiết mô tả và ánh sáng.',
  },
  {
    id: 'turbo',
    name: 'MachGen Turbo 2.0',
    provider: 'MachGen Engine',
    badge: 'Tốc độ cao 4K',
    desc: 'Tạo ảnh siêu nhanh 4K với bố cục điện ảnh và màu sắc tương phản.',
  },
  {
    id: 'flux-realism',
    name: 'MachGen Photorealism',
    provider: 'MachGen Optical',
    badge: 'Nhiếp ảnh DSLR',
    desc: 'Tái tạo ảnh chụp chân thực, gương mặt tự nhiên, màu da sắc nét.',
  },
  {
    id: 'flux-anime',
    name: 'MachGen Anime Master',
    provider: 'MachGen Studio',
    badge: 'Hoạt hình Anime',
    desc: 'Phong cách hoạt hình Nhật Bản đỉnh cao của Makoto Shinkai & Ghibli.',
  },
  {
    id: 'flux-3d',
    name: 'MachGen 3D Render',
    provider: 'MachGen 3D Lab',
    badge: 'Unreal Engine 5',
    desc: 'Mô hình 3D Pixar, nhân vật hoạt hình sống động và ray tracing.',
  },
];

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('Could not read image blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate high-definition AI image via MachGen Engine
 */
export async function generateMachGenImage(
  prompt: string,
  options?: ImageGenOptions
): Promise<GeneratedImageResult> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    throw new Error('Vui lòng nhập mô tả ảnh (Prompt)');
  }

  const ratio = options?.ratio || '16:9';
  const ratioConfig = ASPECT_RATIOS[ratio] || ASPECT_RATIOS['16:9'];
  const width = options?.width || ratioConfig.pxW;
  const height = options?.height || ratioConfig.pxH;
  const model = options?.model || 'flux';
  const seed = options?.seed || Math.floor(Math.random() * 9999999);

  // Apply style suffix
  let finalPrompt = cleanPrompt;
  if (options?.style) {
    const styleObj = IMAGE_STYLES.find((s) => s.id === options.style);
    if (styleObj) {
      finalPrompt += styleObj.promptSuffix;
    }
  }

  // Handle negative prompt if provided
  let negativeParam = '';
  if (options?.negativePrompt?.trim()) {
    negativeParam = `&negative_prompt=${encodeURIComponent(options.negativePrompt.trim())}`;
  }

  const encodedPrompt = encodeURIComponent(finalPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${encodeURIComponent(
    model
  )}&nologo=true&enhance=true${negativeParam}`;

  // Fetch image as blob for instant zero-latency caching and offline download
  try {
    const response = await fetch(imageUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'force-cache',
    });

    if (!response.ok) {
      throw new Error(`MachGen Engine phản hồi lỗi HTTP ${response.status}`);
    }

    const blob = await response.blob();
    if (blob.size < 100) {
      throw new Error('Ảnh trả về không hợp lệ');
    }

    const dataUrl = await blobToDataURL(blob);

    return {
      url: dataUrl,
      source: 'MACHGEN',
      prompt: cleanPrompt,
      model,
      ratio,
      seed,
      createdAt: new Date().toISOString(),
    };
  } catch (err: any) {
    // Fallback directly to direct image URL if blob fetch was blocked
    return {
      url: imageUrl,
      source: 'MACHGEN',
      prompt: cleanPrompt,
      model,
      ratio,
      seed,
      createdAt: new Date().toISOString(),
    };
  }
}
