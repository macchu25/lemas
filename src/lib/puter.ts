declare global {
  interface Window {
    puter?: {
      auth?: {
        isSignedIn: () => boolean;
        signIn: () => Promise<unknown>;
        signOut: () => Promise<void>;
        getUser: () => Promise<{ id?: string; username?: string; email?: string } | null>;
      };
      ai?: {
        txt2img: (
          promptOrOptions: string | { prompt: string; ratio?: { w: number; h: number }; quality?: string; model?: string; input_image?: string; input_image_mime_type?: string },
          options?: Record<string, unknown>,
        ) => Promise<HTMLImageElement | HTMLCanvasElement | Blob | string | { src?: string; url?: string }>;
        chat?: (prompt: string, options?: Record<string, unknown>) => Promise<unknown>;
      };
    };
  }
}

export interface PuterUser {
  id?: string;
  username?: string;
  email?: string;
}

export async function isPuterSignedIn(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (await waitForPuter(4000)) {
    return !!window.puter?.auth?.isSignedIn?.();
  }
  return false;
}

export async function getPuterUser(): Promise<PuterUser | null> {
  if (typeof window === 'undefined') return null;
  if (await waitForPuter(4000)) {
    try {
      if (window.puter?.auth?.isSignedIn?.()) {
        return await window.puter.auth.getUser();
      }
    } catch {}
  }
  return null;
}

export async function signInPuter(): Promise<PuterUser | null> {
  if (typeof window === 'undefined') return null;
  if (await waitForPuter(4000)) {
    try {
      if (window.puter?.auth?.signIn) {
        await window.puter.auth.signIn();
        return await getPuterUser();
      }
    } catch (err) {
      console.warn('[Puter Auth] Sign in cancelled or failed:', err);
    }
  }
  return null;
}

export async function signOutPuter(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (window.puter?.auth?.signOut) {
      await window.puter.auth.signOut();
    }
  } catch {}
}

export type AspectRatio = '16:9' | '1:1' | '9:16' | '4:3' | '3:2';

export interface ImageGenOptions {
  model?: string;
  ratio?: AspectRatio;
  style?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}

export interface GeneratedImageResult {
  url: string;
  source: 'PUTER' | 'POLLINATIONS' | 'CANVAS';
  prompt: string;
  model: string;
  ratio: AspectRatio;
  createdAt: string;
}

export const IMAGE_STYLES = [
  { id: 'cinematic', label: 'Cinematic 8K', promptSuffix: ', cinematic lighting, 8k resolution, photorealistic masterpiece, 35mm photograph, depth of field' },
  { id: 'anime', label: 'Anime / Manga', promptSuffix: ', vibrant anime style, studio ghibli inspired, clean lineart, makoto shinkai aesthetic, detailed background' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', promptSuffix: ', cyberpunk aesthetic, neon glow, futuristic city, volumetric smoke, high tech, octane render' },
  { id: '3d_render', label: '3D Pixar Render', promptSuffix: ', 3d stylized character, pixar aesthetic, unreal engine 5, ray tracing, cute lighting, vibrant colors' },
  { id: 'photoreal', label: 'Photorealistic DSLR', promptSuffix: ', hyperrealistic photo, sony a7 iv, f/1.8 lens, natural sunlight, ultra sharp focus' },
  { id: 'fantasy', label: 'Fantasy Concept', promptSuffix: ', ethereal fantasy concept art, artstation trending, matte painting, mystical glowing atmosphere' },
  { id: 'oil_paint', label: 'Oil Painting', promptSuffix: ', thick impasto oil painting, textured brushstrokes, classical art masterpiece, rich colors' },
  { id: 'minimal', label: 'Minimalist Vector', promptSuffix: ', flat vector illustration, minimalist, clean geometric shapes, modern pastel palette' },
];

export const ASPECT_RATIOS: Record<AspectRatio, { label: string; w: number; h: number; pxW: number; pxH: number }> = {
  '1:1': { label: '1:1 (Vuông)', w: 1, h: 1, pxW: 1024, pxH: 1024 },
  '16:9': { label: '16:9 (Ngang / Video)', w: 16, h: 9, pxW: 1280, pxH: 720 },
  '9:16': { label: '9:16 (Dọc / Story)', w: 9, h: 16, pxW: 720, pxH: 1280 },
  '4:3': { label: '4:3 (Tiêu chuẩn)', w: 4, h: 3, pxW: 1024, pxH: 768 },
  '3:2': { label: '3:2 (Nhiếp ảnh)', w: 3, h: 2, pxW: 1080, pxH: 720 },
};

export const AVAILABLE_MODELS = [
  { id: 'gpt-image-2', name: 'GPT Image 2.0 (Flagship)', provider: 'OpenAI / Puter', badge: 'Ultra Quality' },
  { id: 'black-forest-labs/flux-schnell', name: 'FLUX.1 Schnell', provider: 'Black Forest Labs', badge: 'Fast 15ms' },
  { id: 'stabilityai/stable-diffusion-3-medium', name: 'Stable Diffusion 3.5', provider: 'Stability AI', badge: 'Artistic' },
  { id: 'gpt-image-1.5', name: 'GPT Image 1.5', provider: 'OpenAI', badge: 'Balanced' },
];

export async function waitForPuter(timeoutMs = 15000): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.puter?.ai?.txt2img) return true;

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (window.puter?.ai?.txt2img) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('Could not read generated image'));
    reader.readAsDataURL(blob);
  });
}

async function puterImageResultToURL(result: HTMLImageElement | HTMLCanvasElement | Blob | string | { src?: string; url?: string }): Promise<string> {
  if (typeof result === 'string') return result;
  if (result instanceof Blob) return blobToDataURL(result);
  if (result instanceof HTMLCanvasElement) return result.toDataURL('image/png');
  if (result instanceof HTMLImageElement) return result.src;
  if (result?.src) return result.src;
  if (result?.url) return result.url;
  throw new Error('Puter.js không trả về ảnh hợp lệ');
}

export async function generatePuterArtQR(file: File, prompt: string): Promise<string> {
  if (!(await waitForPuter(8000)) || !window.puter?.ai?.txt2img) {
    throw new Error('Puter.js chưa sẵn sàng. Hãy tải lại trang và thử lại.');
  }
  const inputImage = await blobToDataURL(file);
  const result = await window.puter.ai.txt2img(prompt, {
    provider: 'openai-image-generation',
    model: 'gpt-image-1.5',
    ratio: { w: 1, h: 1 },
    quality: 'high',
    input_image: inputImage,
  });
  return puterImageResultToURL(result);
}

function validateImageLoad(url: string, timeoutMs = 25000): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(true);
      }
    };

    img.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(false);
      }
    };

    img.src = url;
  });
}

export async function generateImage(
  prompt: string,
  options: ImageGenOptions = {}
): Promise<GeneratedImageResult> {
  const trimmed = prompt.trim();
  if (!trimmed) throw new Error('Vui lòng nhập mô tả ảnh (prompt)');

  const ratio = options.ratio || '16:9';
  const ratioConfig = ASPECT_RATIOS[ratio] || ASPECT_RATIOS['16:9'];
  const width = options.width || ratioConfig.pxW;
  const height = options.height || ratioConfig.pxH;

  // Append style modifiers if chosen
  let fullPrompt = trimmed;
  if (options.style && options.style !== 'none') {
    const styleObj = IMAGE_STYLES.find((s) => s.id === options.style);
    if (styleObj) {
      fullPrompt += styleObj.promptSuffix;
    }
  }
  if (options.negativePrompt && options.negativePrompt.trim()) {
    fullPrompt += `. Avoid: ${options.negativePrompt.trim()}`;
  }

  const selectedModel = options.model || 'gpt-image-2';
  const candidateModels = Array.from(
    new Set([
      selectedModel,
      'gpt-image-2',
      'black-forest-labs/flux-schnell',
      'gpt-image-1.5',
      'stabilityai/stable-diffusion-3-medium',
    ].filter(Boolean))
  );

  // 1. Try Puter.js AI txt2img pipeline silently (no popup)
  if (typeof window !== 'undefined' && (await waitForPuter(4000))) {
    const txt2img = window.puter?.ai?.txt2img;
    if (txt2img) {
      for (const model of candidateModels) {
        try {
          const res = await txt2img(fullPrompt, {
            model,
            ratio: { w: ratioConfig.w, h: ratioConfig.h },
          });

          if (typeof res === 'string' && (res.startsWith('data:') || res.startsWith('http'))) {
            return {
              url: res,
              source: 'PUTER',
              prompt: trimmed,
              model,
              ratio,
              createdAt: new Date().toISOString(),
            };
          }
          if (res && typeof res === 'object') {
            const anyRes = res as { src?: string; url?: string };
            if (anyRes.src && typeof anyRes.src === 'string' && anyRes.src.length > 20) {
              return {
                url: anyRes.src,
                source: 'PUTER',
                prompt: trimmed,
                model,
                ratio,
                createdAt: new Date().toISOString(),
              };
            }
            if (anyRes.url && typeof anyRes.url === 'string') {
              return {
                url: anyRes.url,
                source: 'PUTER',
                prompt: trimmed,
                model,
                ratio,
                createdAt: new Date().toISOString(),
              };
            }
          }
          if (res instanceof Blob) {
            return {
              url: await blobToDataURL(res),
              source: 'PUTER',
              prompt: trimmed,
              model,
              ratio,
              createdAt: new Date().toISOString(),
            };
          }
          if (res instanceof HTMLCanvasElement) {
            return {
              url: res.toDataURL('image/webp', 0.95),
              source: 'PUTER',
              prompt: trimmed,
              model,
              ratio,
              createdAt: new Date().toISOString(),
            };
          }
        } catch (modelErr) {
          console.warn(`[Puter.js] Model ${model} failed, trying next fallback:`, modelErr);
        }
      }
    }
  }

  // 2. High-speed Pollinations.AI FLUX fallback
  const seed = Math.floor(Math.random() * 10000000);
  const encodedPrompt = encodeURIComponent(fullPrompt.slice(0, 1500));
  const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

  const isValid = await validateImageLoad(fallbackUrl, 30000);
  if (isValid) {
    return {
      url: fallbackUrl,
      source: 'POLLINATIONS',
      prompt: trimmed,
      model: 'Flux.1 Pro (Edge)',
      ratio,
      createdAt: new Date().toISOString(),
    };
  }

  throw new Error('Không thể khởi tạo ảnh qua máy chủ. Vui lòng kiểm tra lại kết nối mạng và thử lại sau giây lát!');
}
