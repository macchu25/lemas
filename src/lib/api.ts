export const API_BASE =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? 'https://lemas-api-production.up.railway.app'
    : process.env.NEXT_PUBLIC_API_URL || 'https://lemas-api-production.up.railway.app';

export interface ModelItem {
  id: string;
  name: string;
  provider: string;
  provider_icon: string;
  category: string;
  context_length: string;
  input_price: string;
  output_price: string;
  official_input_price: string;
  official_output_price: string;
  discount: string;
  is_free: boolean;
  description: string;
  tags: string[];
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: string;
  tokens: string;
  badge?: string;
  features: string[];
}

export interface Deal {
  id: string;
  title: string;
  tag: string;
  desc: string;
  code: string;
  discount: string;
  status: string;
}

export interface StatusResponse {
  system_status: string;
  uptime_sla: string;
  average_ping: string;
  regions: {
    name: string;
    ping: string;
    uptime: string;
    status: string;
  }[];
  last_updated: string;
}

export interface ApiKeyItem {
  id: string;
  user_id: string;
  key: string;
  name: string;
  spend_limit: number;
  spend_used: number;
  status: string;
  permissions: string[];
  last_used_at?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  balance: number;
  tokens: number;
  plan: string;
  daily_tokens_used?: number;
  daily_tokens_limit?: number;
  gift_tokens?: number;
}

// Fetch all models
export async function getModels(query = '', provider = '', freeOnly = false): Promise<ModelItem[]> {
  try {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (provider) params.append('provider', provider);
    if (freeOnly) params.append('free', 'true');

    const res = await fetch(`${API_BASE}/api/models?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch models');
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error('getModels error:', err);
    return [];
  }
}

// Fetch pricing tiers
export async function getPricingTiers(): Promise<PricingTier[]> {
  try {
    const res = await fetch(`${API_BASE}/api/pricing`);
    if (!res.ok) throw new Error('Failed to fetch pricing');
    return await res.json();
  } catch (err) {
    console.error('getPricingTiers error:', err);
    return [];
  }
}

// Fetch Deals
export async function getDeals(): Promise<Deal[]> {
  try {
    const res = await fetch(`${API_BASE}/api/deals`);
    if (!res.ok) throw new Error('Failed to fetch deals');
    return await res.json();
  } catch (err) {
    console.error('getDeals error:', err);
    return [];
  }
}

// Fetch Status
export async function getStatus(): Promise<StatusResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return await res.json();
  } catch (err) {
    return {
      system_status: 'All Systems Operational',
      uptime_sla: '99.99%',
      average_ping: '28ms',
      regions: [],
      last_updated: new Date().toISOString(),
    };
  }
}

// Submit contact form
export async function submitContact(name: string, email: string, subject: string, message: string) {
  const res = await fetch(`${API_BASE}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, subject, message }),
  });
  return await res.json();
}

// Auth & Dashboard helpers
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('lemas_auth_token') || localStorage.getItem('xkiro_auth_token');
}

export function setStoredToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lemas_auth_token', token);
    localStorage.setItem('xkiro_auth_token', token);
    document.cookie = `lemas_auth_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
  }
}

export function removeStoredToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lemas_auth_token');
    localStorage.removeItem('xkiro_auth_token');
    document.cookie = 'lemas_auth_token=; path=/; max-age=0';
  }
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        removeStoredToken();
      }
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

export async function getApiKeys(): Promise<ApiKeyItem[]> {
  const token = getStoredToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/api/keys`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createApiKey(name: string, spendLimit: number): Promise<ApiKeyItem | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, spend_limit: spendLimit }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function revokeApiKey(id: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE}/api/keys/revoke/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Test completions endpoint directly
export async function testChatCompletion(apiKey: string, model: string, userMessage: string) {
  const token = apiKey || getStoredToken() || '';
  const res = await fetch(`${API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  return await res.json();
}

export interface TopupRecord {
  id: string;
  amount_usd: number;
  amount_vnd: number;
  method: string;
  bank_code: string;
  memo: string;
  status: string;
  time_ago: string;
  created_at: string;
}

export interface UserAnalytics {
  balance: number;
  total_deposited: number;
  total_spend_30d: number;
  total_tokens_30d: number;
  total_requests_30d: number;
  avg_daily_spend_7d: number;
  max_daily_spend_30d: number;
  days_used_30d: number;
  daily_chart: {
    date: string;
    cost: number;
    tokens: number;
    requests: number;
    height: number;
  }[];
  recent_requests: {
    id: string;
    model: string;
    prompt_tokens: number;
    comp_tokens: number;
    total_tokens: number;
    cost_usd: number;
    latency_ms: number;
    status: string;
    time_ago: string;
    timestamp: string;
  }[];
  topup_history: TopupRecord[];
}

export async function getUserAnalytics(): Promise<UserAnalytics | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/usage`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function topupUserBalance(amountUSD: number): Promise<{ success: boolean; balance: number; message?: string } | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/user/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: amountUSD }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function redeemGiftcode(code: string): Promise<{ success: boolean; message?: string; error?: string; tokens_gift?: number; gift_tokens?: number }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: 'Chưa đăng nhập' };
  try {
    const res = await fetch(`${API_BASE}/api/user/giftcode/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { success: false, error: 'Lỗi kết nối tới máy chủ' };
  }
}

export interface ImageQuotaData {
  plan: string;
  daily_used: number;
  daily_limit: number;
  remaining: number;
  is_unlimited: boolean;
  allowed: boolean;
  error?: string;
}

export async function fetchImageQuota(): Promise<ImageQuotaData> {
  const token = getStoredToken();
  if (!token) {
    return { plan: 'free', daily_used: 0, daily_limit: 5, remaining: 5, is_unlimited: false, allowed: true };
  }
  try {
    const res = await fetch(`${API_BASE}/api/user/image/quota`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return { plan: 'free', daily_used: 0, daily_limit: 5, remaining: 5, is_unlimited: false, allowed: true };
    }
    return await res.json();
  } catch {
    return { plan: 'free', daily_used: 0, daily_limit: 5, remaining: 5, is_unlimited: false, allowed: true };
  }
}

export async function consumeImageQuota(): Promise<{ success: boolean; quota?: ImageQuotaData; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: true };
  try {
    const res = await fetch(`${API_BASE}/api/user/image/consume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok || data.allowed === false) {
      return { success: false, error: data.error || 'Đã hết lượt tạo ảnh hôm nay' };
    }
    return { success: true, quota: data };
  } catch {
    return { success: true };
  }
}


