import { API_BASE, getStoredToken } from './api';
import { artQRRequest } from './artqr_transport';

export interface Placement {
  x: number;
  y: number;
  size: number;
}

export interface ArtQRPreset {
  id: string;
  slug: string;
  name: string;
  description: string;
  preview_url: string;
  reference_image_url?: string;
  price_credits?: number;
  price_vnd?: number;
  material?: string;
  dark_color?: string;
  texture_strength?: number;
  contrast_strength?: number;
  quiet_zone_modules?: number;
  colors?: string[];
  prompt: string;
  negative_prompt?: string;
  conditioning_scale?: number;
  guidance_scale?: number;
  enabled?: boolean;
  placement?: Placement;
}

export interface OutputImage {
  url: string;
  verified: boolean;
  seed?: number;
  conditioning_scale?: number;
}

export interface ArtQRJobResponse {
  job_id: string;
  status:
    | 'queued'
    | 'processing'
    | 'decoding'
    | 'analyzing_style'
    | 'generating'
    | 'validating'
    | 'retrying'
    | 'completed'
    | 'failed'
    | string;
  progress: number;
  preset_id?: string;
  placement?: Placement;
  prompt?: string;
  attempts?: number;
  max_attempts?: number;
  rejected_count?: number;
  images?: OutputImage[];
  error?: string;
}

// Fetch all available Art QR Presets
export async function getArtQRPresets(): Promise<ArtQRPreset[]> {
  try {
    const res = await fetch(`${API_BASE}/api/art-qr/presets`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.presets || [];
  } catch (err) {
    console.error('getArtQRPresets error:', err);
    return [];
  }
}

export interface StyleAnalysis {
  style: string;
  palette: string[];
  lighting: string;
  texture: string;
  prompt?: string;
  generated_prompt?: string;
  patch_prompt?: string;
  subject_details?: Record<string, any>;
  qr_region_analysis?: Record<string, any>;
  integration_strategy?: string[];
  composition?: Record<string, any>;
  raw_json?: string;
}

// Analyze uploaded reference image via Vision AI (GPT-4o)
export async function analyzeStyle(
  referenceFile: File,
  placement?: Placement
): Promise<StyleAnalysis> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append('reference_image', referenceFile);
  if (placement) {
    formData.append('placement', JSON.stringify(placement));
  }

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const data = await artQRRequest(`${API_BASE}/api/art-qr/analyze-style`, {
    method: 'POST',
    headers,
    body: formData,
  }, 45000);

  return (data as unknown) as StyleAnalysis;
}

// Submit a new Art QR generation request
export async function submitArtQRGeneration(
  qrFile: File,
  options: {
    referenceFile?: File | null;
    presetId?: string;
    customPrompt?: string;
    placement: Placement;
  }
): Promise<{ jobId: string; status: string; progress: number }> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append('qr_image', qrFile);

  if (options.referenceFile) {
    formData.append('reference_image', options.referenceFile);
  }
  if (options.presetId) {
    formData.append('preset_id', options.presetId);
  }
  if (options.customPrompt) {
    formData.append('custom_prompt', options.customPrompt);
  }
  formData.append('placement', JSON.stringify(options.placement));

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const data = await artQRRequest(`${API_BASE}/api/art-qr/generate`, {
    method: 'POST', headers, body: formData,
  }, 60000);
  if (typeof data.jobId !== 'string' || !data.jobId.trim()) {
    throw new Error('API không trả mã tác vụ Art QR hợp lệ.');
  }
  return { jobId: data.jobId, status: 'queued', progress: 5 };
}

export interface ArtQRResult {
  success: boolean;
  image: string;
  expected_payload: string;
  decoded_payload: string;
  qr_valid: boolean;
  preset: string;
  background_removed: boolean;
  fallback_mode?: boolean;
  retry_count: number;
  processing_ms: number;
  error?: string;
}

// Generate Art QR synchronously with deterministic scannability guarantee
export async function generateArtQRSync(
  qrFile: File,
  options: {
    referenceFile?: File | null;
    presetId?: string;
    customPrompt?: string;
    placement?: Placement;
  }
): Promise<ArtQRResult> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append('qr_image', qrFile);

  if (options.referenceFile) {
    formData.append('reference_image', options.referenceFile);
  }
  if (options.presetId) {
    formData.append('preset_id', options.presetId);
  }
  if (options.customPrompt) {
    formData.append('custom_prompt', options.customPrompt);
  }
  if (options.placement) {
    formData.append('placement', JSON.stringify(options.placement));
  }

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 phút client-side timeout

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/art-qr/generate?sync=true`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Hết thời gian chờ phản hồi từ máy chủ (>5 phút). Vui lòng thử lại.');
    }
    throw new Error('Không thể kết nối đến máy chủ Art QR. Kiểm tra mạng hoặc thử lại sau.');
  }
  clearTimeout(timeoutId);

  const data = await res.json();
  if (!res.ok && !data.error) {
    throw new Error(`Server returned HTTP ${res.status}`);
  }
  return data as ArtQRResult;
}

// Admin: Save or update an Art QR preset
export async function saveArtQRPreset(preset: Partial<ArtQRPreset>): Promise<any> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/art-qr/admin/presets`, {
    method: 'POST',
    headers,
    body: JSON.stringify(preset),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

// Admin: Delete an Art QR preset
export async function deleteArtQRPreset(id: string): Promise<any> {
  const token = getStoredToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/art-qr/admin/presets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

// Admin: Upload reference scene image
export async function uploadSceneImage(file: File): Promise<{ url: string; filename: string }> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append('scene_image', file);

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/art-qr/admin/upload-scene`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  // Ensure returned URL is absolute if it refers to backend assets
  let finalUrl = data.url || '';
  if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('data:')) {
    const clean = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`;
    finalUrl = `${API_BASE}${clean}`;
  }

  return {
    url: finalUrl,
    filename: data.filename,
  };
}

/**
 * Resolves a preset preview or reference scene URL so that uploaded assets
 * on the backend API server are correctly fetched across domains (e.g. Vercel vs Railway/VPS).
 */
export function getPresetAssetUrl(url?: string): string {
  if (!url) return '/presets/doraemon_bread_scene.jpg';
  // Absolute URLs or data URLs remain untouched
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  // If it points to an uploaded preset scene or asset on the backend
  if (url.startsWith('/presets/') || url.startsWith('presets/') || url.startsWith('/assets/')) {
    const clean = url.startsWith('/') ? url : `/${url}`;
    // If it's the built-in doraemon scene, both frontend public and backend have it, but API_BASE guarantees load
    return `${API_BASE}${clean}`;
  }
  return url;
}

export interface UserArtQRHistoryItem {
  id: string;
  user_id: string;
  preset_id: string;
  preset_name?: string;
  custom_prompt?: string;
  image_url: string;
  original_payload?: string;
  decoded_payload?: string;
  scannable?: boolean;
  cost_usd?: number;
  created_at: string;
}

export async function getUserArtQRHistory(): Promise<UserArtQRHistoryItem[]> {
  const token = getStoredToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/api/user/art-qr/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function deleteUserArtQRHistory(id: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token || !id) return false;
  try {
    const res = await fetch(`${API_BASE}/api/user/art-qr/history/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}



