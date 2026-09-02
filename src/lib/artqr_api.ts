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
  colors: string[];
  prompt: string;
  negative_prompt: string;
  conditioning_scale: number;
  guidance_scale: number;
}

export interface OutputImage {
  url: string;
  verified: boolean;
  seed?: number;
  conditioning_scale?: number;
}

export interface ArtQRJobResponse {
  job_id: string;
  status: 'queued' | 'decoding' | 'analyzing_style' | 'generating' | 'validating' | 'completed' | 'failed';
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

// Submit a new Art QR generation request
export async function submitArtQRGeneration(
  qrFile: File,
  options: {
    referenceFile?: File | null;
    presetId?: string;
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

// Fetch Art QR Job status by ID
export async function getArtQRJob(jobId: string, signal?: AbortSignal): Promise<ArtQRJobResponse> {
  const token = getStoredToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const data = await artQRRequest(`${API_BASE}/api/art-qr/jobs/${encodeURIComponent(jobId)}`, {
    headers, signal,
  });
  const statuses = ['queued', 'decoding', 'analyzing_style', 'generating', 'validating', 'completed', 'failed'];
  if (data.job_id !== jobId || typeof data.status !== 'string' || !statuses.includes(data.status)) {
    throw new Error('API trả trạng thái Art QR không hợp lệ.');
  }
  return data as unknown as ArtQRJobResponse;
}
