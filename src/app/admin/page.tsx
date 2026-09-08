'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Key,
  Coins,
  TrendingUp,
  Cpu,
  RefreshCw,
  Search,
  Plus,
  Minus,
  Edit,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Lock,
  LogOut,
  Gift,
  Trash,
  QrCode,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Globe,
  Server,
  Play,
  Check,
  Bot,
  ImageIcon,
  Upload,
  Sliders,
  X,
  FileText,
} from 'lucide-react';
import { API_BASE } from '@/lib/api';
import {
  ArtQRPreset,
  getArtQRPresets,
  saveArtQRPreset,
  deleteArtQRPreset,
  uploadSceneImage,
} from '@/lib/artqr_api';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  balance: number;
  tokens_alloc: number;
  tokens_used: number;
  daily_tokens_used?: number;
  daily_tokens_limit?: number;
  gift_tokens?: number;
  cost_usd: number;
  total_requests: number;
  active_keys: number;
  created_at: string;
}

interface AdminGiftcode {
  id: string;
  code: string;
  tokens: number;
  max_uses: number;
  used_count: number;
  used_by: string[];
  status: string;
  created_at: string;
}

interface AdminOverview {
  total_users: number;
  total_active_keys: number;
  total_tokens_used: number;
  total_cost_usd: number;
  total_requests: number;
  upstream_keys_health: string;
  upstream_stats?: any;
}

export default function AdminPage() {
  // Admin Authentication State
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [giftcodes, setGiftcodes] = useState<AdminGiftcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // New Giftcode Form State
  const [newGiftCode, setNewGiftCode] = useState('');
  const [newGiftTokens, setNewGiftTokens] = useState(10000);
  const [newGiftMaxUses, setNewGiftMaxUses] = useState(10);
  const [giftCreating, setGiftCreating] = useState(false);
  const [adminTab, setAdminTabState] = useState<'xkiro' | 'machgen' | 'artqr' | 'users' | 'giftcodes' | 'rotator'>('xkiro');

  // Art QR Presets Admin State (Trang 3)
  const [artqrPresets, setArtqrPresets] = useState<ArtQRPreset[]>([]);
  const [artqrLoading, setArtqrLoading] = useState(false);
  const [editingPreset, setEditingPreset] = useState<ArtQRPreset | null>(null);
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [presetSaving, setPresetSaving] = useState(false);
  const [uploadingScene, setUploadingScene] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [presetFeedback, setPresetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('lemas_admin_tab');
      if (savedTab && ['xkiro', 'machgen', 'artqr', 'users', 'giftcodes', 'rotator'].includes(savedTab)) {
        setAdminTabState(savedTab as any);
      }
    } catch (_) {}
  }, []);

  const setAdminTab = (tab: 'xkiro' | 'machgen' | 'artqr' | 'users' | 'giftcodes' | 'rotator') => {
    setAdminTabState(tab);
    try {
      localStorage.setItem('lemas_admin_tab', tab);
    } catch (_) {}
  };

  // Adjust modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(10);
  const [adjustTokens, setAdjustTokens] = useState(1000000);
  const [adjustPlan, setAdjustPlan] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [checkingRotator, setCheckingRotator] = useState(false);

  // Dedicated xKiro Chat Gateway State (Trang 1)
  const [xkiroKey, setXkiroKey] = useState('');
  const [xkiroKeyName, setXkiroKeyName] = useState('');
  const [xkiroShowKey, setXkiroShowKey] = useState(false);
  const [xkiroBaseURL, setXkiroBaseURL] = useState('https://proxyhack.mafiavietnam1945.workers.dev/v1');
  const [xkiroModel, setXkiroModel] = useState('deepseek/deepseek-v4-flash');
  const [xkiroProvider, setXkiroProvider] = useState('xKiro Proxy');
  const [xkiroTesting, setXkiroTesting] = useState(false);
  const [xkiroTestResult, setXkiroTestResult] = useState<{
    success: boolean;
    status_code: number;
    message: string;
    latency_ms: number;
  } | null>(null);
  const [xkiroAddLoading, setXkiroAddLoading] = useState(false);
  const [xkiroAddFeedback, setXkiroAddFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dedicated MachGen Image & QR Studio State (Trang 2)
  const [machgenKey, setMachgenKey] = useState('');
  const [machgenKeyName, setMachgenKeyName] = useState('');
  const [machgenShowKey, setMachgenShowKey] = useState(false);
  const [machgenBaseURL, setMachgenBaseURL] = useState('https://image.pollinations.ai');
  const [machgenModel, setMachgenModel] = useState('flux');
  const [machgenProvider, setMachgenProvider] = useState('MachGen Studio');
  const [machgenTesting, setMachgenTesting] = useState(false);
  const [machgenTestResult, setMachgenTestResult] = useState<{
    success: boolean;
    status_code: number;
    message: string;
    latency_ms: number;
  } | null>(null);
  const [machgenAddLoading, setMachgenAddLoading] = useState(false);
  const [machgenAddFeedback, setMachgenAddFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Helper to distinguish xKiro vs MachGen keys
  const isMachGenKey = (k: any) =>
    (k.provider && k.provider.toLowerCase().includes('machgen')) ||
    (k.base_url && (k.base_url.includes('pollinations') || k.base_url.includes('replicate')));

  // --- Handlers for xKiro (Chat AI) ---
  const handleTestXkiroKey = async () => {
    if (!xkiroKey.trim()) {
      alert('Vui lòng nhập API Key của xKiro để kiểm tra');
      return;
    }
    setXkiroTesting(true);
    setXkiroTestResult(null);
    setXkiroAddFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/rotator/test-key`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          key: xkiroKey.trim(),
          base_url: xkiroBaseURL.trim(),
          model: xkiroModel.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setXkiroTestResult(data);
      } else {
        setXkiroTestResult({
          success: false,
          status_code: res.status,
          message: data.error || 'Kiểm tra thất bại',
          latency_ms: 0,
        });
      }
    } catch (err: any) {
      setXkiroTestResult({
        success: false,
        status_code: 0,
        message: err?.message || 'Không thể kết nối tới server kiểm tra',
        latency_ms: 0,
      });
    } finally {
      setXkiroTesting(false);
    }
  };

  const handleAddXkiroKey = async () => {
    if (!xkiroKey.trim()) {
      alert('Vui lòng nhập API Key xKiro');
      return;
    }
    setXkiroAddLoading(true);
    setXkiroAddFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/rotator/keys/add`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          key: xkiroKey.trim(),
          name: xkiroKeyName.trim() || 'Tài khoản xKiro',
          provider: xkiroProvider.trim() || 'xKiro Proxy',
          base_url: xkiroBaseURL.trim(),
          test_first: false,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setXkiroAddFeedback({
          type: 'success',
          message: `✅ Đã thêm key xKiro [${data.key?.name || ''}] ${data.key?.key_masked || ''} vào bể xoay tua Chat thành công!`,
        });
        setXkiroKey('');
        setXkiroKeyName('');
        setXkiroTestResult(null);
        await loadAdminData();
      } else {
        setXkiroAddFeedback({
          type: 'error',
          message: data.error || 'Thêm key thất bại',
        });
      }
    } catch (err: any) {
      setXkiroAddFeedback({
        type: 'error',
        message: err?.message || 'Lỗi kết nối máy chủ',
      });
    } finally {
      setXkiroAddLoading(false);
    }
  };

  // --- Handlers for MachGen (Image & Art QR) ---
  const handleTestMachgenKey = async () => {
    setMachgenTesting(true);
    setMachgenTestResult(null);
    setMachgenAddFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/rotator/test-key`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          key: machgenKey.trim(),
          base_url: machgenBaseURL.trim(),
          model: machgenModel.trim() || 'flux',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMachgenTestResult(data);
      } else {
        setMachgenTestResult({
          success: false,
          status_code: res.status,
          message: data.error || 'Kiểm tra thất bại',
          latency_ms: 0,
        });
      }
    } catch (err: any) {
      setMachgenTestResult({
        success: false,
        status_code: 0,
        message: err?.message || 'Không thể kết nối tới server kiểm tra',
        latency_ms: 0,
      });
    } finally {
      setMachgenTesting(false);
    }
  };

  const handleAddMachgenKey = async () => {
    setMachgenAddLoading(true);
    setMachgenAddFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/rotator/keys/add`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          key: machgenKey.trim(),
          name: machgenKeyName.trim() || 'MachGen Engine',
          provider: machgenProvider.trim() || 'MachGen Studio',
          base_url: machgenBaseURL.trim(),
          test_first: false,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMachgenAddFeedback({
          type: 'success',
          message: `✅ Đã lưu cấu hình MachGen Engine [${data.key?.name || ''}] ${data.key?.key_masked || ''} thành công!`,
        });
        setMachgenKey('');
        setMachgenKeyName('');
        setMachgenTestResult(null);
        await loadAdminData();
      } else {
        setMachgenAddFeedback({
          type: 'error',
          message: data.error || 'Lưu cấu hình thất bại',
        });
      }
    } catch (err: any) {
      setMachgenAddFeedback({
        type: 'error',
        message: err?.message || 'Lỗi kết nối máy chủ',
      });
    } finally {
      setMachgenAddLoading(false);
    }
  };

  const handleDeleteUpstreamKey = async (id: string, masked: string, name?: string) => {
    const label = name ? `[${name}] ${masked}` : masked;
    if (
      !confirm(
        `⚠️ XÁC NHẬN XÓA KEY VĨNH VIỄN:\n\nBạn có chắc chắn muốn xóa key ${label} khỏi cơ sở dữ liệu MongoDB và hệ thống không?\n\n• Key này sẽ bị gỡ bỏ ngay lập tức khỏi bể xoay tua.\n• Dữ liệu được lưu vĩnh viễn trên MongoDB, sau khi xóa sẽ KHÔNG bị hoàn lại khi F5 tải lại trang.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/rotator/keys/delete`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Đã xóa vĩnh viễn key ${label} khỏi cơ sở dữ liệu thành công!`);
        await loadAdminData();
      } else {
        alert(`❌ Lỗi khi xóa key: ${data.error || 'Xóa key thất bại'}`);
      }
    } catch {
      alert('❌ Lỗi kết nối máy chủ khi xóa key');
    }
  };

  const handleToggleUpstreamKey = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/rotator/keys/toggle`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ id, active: !currentActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadAdminData();
      } else {
        alert(data.error || 'Thay đổi trạng thái key thất bại');
      }
    } catch {
      alert('Lỗi kết nối khi thay đổi trạng thái key');
    }
  };

  const handleCheckRotator = async () => {
    setCheckingRotator(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/rotator/check`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.stats) {
        setOverview((prev) =>
          prev
            ? {
                ...prev,
                upstream_stats: data.stats,
                upstream_keys_health:
                  data.stats.active_keys === 0
                    ? 'CRITICAL: 0 Keys Hoạt Động (Tất Cả Keys Lỗi)'
                    : `${data.stats.active_keys}/${data.stats.total_keys} Keys Hoạt Động`,
              }
            : prev
        );
      }
    } catch {
      alert('Lỗi kết nối khi kiểm tra upstream keys');
    } finally {
      setCheckingRotator(false);
    }
  };

  useEffect(() => {
    const isAuth = sessionStorage.getItem('lemas_admin_auth');
    if (isAuth === 'true') {
      setIsAdminAuth(true);
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, []);

  const getAdminHeaders = () => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('lemas_admin_token') || '' : '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError('');

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        sessionStorage.setItem('lemas_admin_auth', 'true');
        sessionStorage.setItem('lemas_admin_token', data.token);
        setIsAdminAuth(true);
        loadAdminData();
      } else {
        setAdminError(data.error || 'Tài khoản hoặc mật khẩu quản trị không chính xác!');
      }
    } catch {
      setAdminError('Lỗi kết nối tới máy chủ quản trị!');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('lemas_admin_auth');
    sessionStorage.removeItem('lemas_admin_token');
    setIsAdminAuth(false);
    setAdminUsername('');
    setAdminPassword('');
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [resOverview, resUsers, resGifts] = await Promise.all([
        fetch(`${API_BASE}/api/admin/overview`, { headers: getAdminHeaders() }).then((r) => {
          if (r.status === 401 || r.status === 403) {
            handleAdminLogout();
            return null;
          }
          return r.json();
        }),
        fetch(`${API_BASE}/api/admin/users`, { headers: getAdminHeaders() }).then((r) => {
          if (r.status === 401 || r.status === 403) return [];
          return r.json();
        }),
        fetch(`${API_BASE}/api/admin/giftcodes`, { headers: getAdminHeaders() }).then((r) => {
          if (r.status === 401 || r.status === 403) return [];
          return r.json();
        }).catch(() => []),
      ]);
      setOverview(resOverview);
      setUsers(Array.isArray(resUsers) ? resUsers : []);
      setGiftcodes(Array.isArray(resGifts) ? resGifts : []);
      await loadArtQRPresets();
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Art QR Presets Admin Handlers (Trang 3) ---
  const loadArtQRPresets = async () => {
    setArtqrLoading(true);
    try {
      const presets = await getArtQRPresets();
      setArtqrPresets(presets);
      if (presets.length > 0) {
        setEditingPreset((prev) => {
          if (!prev || !prev.id) return { ...presets[0] };
          const found = presets.find((p) => p.id === prev.id || p.slug === prev.slug);
          return found ? { ...found } : { ...presets[0] };
        });
      }
    } catch (err) {
      console.error('Failed to load Art QR presets:', err);
    } finally {
      setArtqrLoading(false);
    }
  };

  const handleOpenCreatePreset = () => {
    const defaultId = `custom_style_${Date.now()}`;
    setEditingPreset({
      id: defaultId,
      slug: defaultId,
      name: '',
      description: 'Phong cách nghệ thuật tùy chỉnh ấn tượng cho Art QR',
      preview_url: '/presets/doraemon_bread_scene.jpg',
      reference_image_url: '/presets/doraemon_bread_scene.jpg',
      price_credits: 5,
      price_vnd: 15000,
      material: 'Sơn dầu & Hòa trộn hoa văn',
      dark_color: '#1e140d',
      texture_strength: 0.85,
      contrast_strength: 1.15,
      prompt: 'Masterpiece artwork, vibrant natural lighting, highly detailed surface texture, organic integration of functional modules',
      enabled: true,
    });
    setIsCreatingPreset(true);
    setPresetFeedback(null);
  };

  const handleOpenEditPreset = (p: ArtQRPreset) => {
    setEditingPreset({ ...p });
    setIsCreatingPreset(false);
    setPresetFeedback(null);
    const editorEl = document.getElementById('artqr-direct-editor');
    if (editorEl) {
      editorEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset || !editingPreset.name.trim()) {
      alert('Vui lòng nhập tên phong cách');
      return;
    }
    setPresetSaving(true);
    setPresetFeedback(null);
    try {
      const presetToSave: ArtQRPreset = {
        ...editingPreset,
        id: editingPreset.id || editingPreset.name.toLowerCase().replace(/\s+/g, '_'),
        slug: editingPreset.slug || editingPreset.id || editingPreset.name.toLowerCase().replace(/\s+/g, '_'),
        price_credits: Number(editingPreset.price_credits) || 0,
        price_vnd: Number(editingPreset.price_vnd) || 0,
        texture_strength: Number(editingPreset.texture_strength) || 0.85,
        contrast_strength: Number(editingPreset.contrast_strength) || 1.15,
      };

      await saveArtQRPreset(presetToSave);
      setPresetFeedback({
        type: 'success',
        message: `✅ Đã lưu cấu hình phong cách "${presetToSave.name}" thành công!`,
      });
      setEditingPreset(presetToSave);
      setIsCreatingPreset(false);
      await loadArtQRPresets();
    } catch (err: any) {
      setPresetFeedback({
        type: 'error',
        message: `Lỗi lưu phong cách: ${err.message || 'Không thể lưu'}`,
      });
    } finally {
      setPresetSaving(false);
    }
  };

  const handleDeletePreset = async (presetId: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phong cách "${name}" (ID: ${presetId}) khỏi hệ thống?`)) return;
    try {
      await deleteArtQRPreset(presetId);
      await loadArtQRPresets();
    } catch (err: any) {
      alert(`Lỗi khi xóa phong cách: ${err.message || 'Không thể xóa'}`);
    }
  };

  const handleTogglePresetEnabled = async (p: ArtQRPreset) => {
    const updated = { ...p, enabled: p.enabled === false ? true : false };
    try {
      await saveArtQRPreset(updated);
      await loadArtQRPresets();
    } catch (err: any) {
      alert(`Không thể thay đổi trạng thái: ${err.message}`);
    }
  };

  const handleUploadPreviewFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPreset) return;
    setUploadingPreview(true);
    try {
      const res = await uploadSceneImage(file);
      if (res.url) {
        setEditingPreset({
          ...editingPreset,
          preview_url: res.url,
        });
      }
    } catch (err: any) {
      alert(`Lỗi tải ảnh mẫu thành phẩm: ${err.message || 'Không thể tải lên'}`);
    } finally {
      setUploadingPreview(false);
    }
  };

  const handleUploadSceneFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPreset) return;
    setUploadingScene(true);
    try {
      const res = await uploadSceneImage(file);
      if (res.url) {
        setEditingPreset({
          ...editingPreset,
          reference_image_url: res.url,
        });
      }
    } catch (err: any) {
      alert(`Lỗi tải ảnh phôi tham chiếu: ${err.message || 'Không thể tải lên'}`);
    } finally {
      setUploadingScene(false);
    }
  };

  const handleCreateGiftcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGiftCode.trim()) return;
    setGiftCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/giftcodes`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          code: newGiftCode.trim(),
          tokens: Number(newGiftTokens),
          max_uses: Number(newGiftMaxUses),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewGiftCode('');
        await loadAdminData();
        alert(`✅ Đã tạo thành công mã Giftcode: ${data.code} (+${(data.tokens || 0).toLocaleString()} tokens, tối đa ${data.max_uses || 1} lượt nhập)`);
      } else {
        alert(data.error || 'Lỗi tạo Giftcode');
      }
    } catch (err: any) {
      alert(`⚠️ Lỗi kết nối máy chủ khi tạo Giftcode: ${err?.message || 'Vui lòng thử lại'}`);
    } finally {
      setGiftCreating(false);
    }
  };

  const handleDeleteGiftcode = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã Giftcode này?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/giftcodes/delete`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setGiftcodes(giftcodes.filter((g) => g.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Lỗi xóa Giftcode');
      }
    } catch {
      alert('Lỗi kết nối khi xóa Giftcode');
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setAdjusting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/adjust`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          user_id: selectedUser.id,
          balance_delta: Number(adjustAmount),
          tokens_delta: Number(adjustTokens),
          plan: adjustPlan || selectedUser.plan,
        }),
      });
      if (res.ok) {
        await loadAdminData();
        setSelectedUser(null);
      }
    } catch (err) {
      alert('Lỗi cập nhật user');
    } finally {
      setAdjusting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allUpstreamKeys = overview?.upstream_stats?.keys || [];
  const xkiroKeys = allUpstreamKeys.filter((k: any) => !isMachGenKey(k));
  const machgenKeys = allUpstreamKeys.filter((k: any) => isMachGenKey(k));

  // If not authenticated, render Cyber Security Admin Gate
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-[#05070e] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 w-full max-w-md p-8 rounded-3xl border border-white/15 bg-[#090c15]/95 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.9)] space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-500 text-black shadow-lg shadow-emerald-500/20 mb-2">
              <ShieldAlert className="size-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">
              Lemas<span className="text-emerald-400">.AI</span> Admin Portal
            </h1>
            <p className="text-xs text-slate-400">
              Vui lòng xác thực tài khoản quản trị viên tối cao để truy cập hệ thống
            </p>
          </div>

          {adminError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 text-center font-medium">
              {adminError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Tài khoản quản trị
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin.lemas"
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Mật khẩu cấp cao
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={adminLoading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black font-bold text-xs hover:opacity-90 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="size-3.5" />
              <span>{adminLoading ? 'Đang xác thực...' : 'Mở Khóa Quản Trị Hệ Thống'}</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Quay lại trang chủ Lemas.AI
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080f] text-[#f1f5f9] p-4 sm:p-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 text-white shadow-lg shadow-indigo-500/25">
            <ShieldAlert className="size-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">Lemas.AI Admin Central</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Quản lý tài khoản, kiểm soát số key hoạt động & tổng lượng token tiêu tốn theo thời gian thực
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadAdminData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-cyan-500/20"
          >
            <Cpu className="size-3.5" />
            <span>Vào User Dashboard</span>
            <ArrowUpRight className="size-3.5" />
          </Link>

          <Link
            href="/dashboard/art-qr"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all"
          >
            <QrCode className="size-3.5 text-amber-400" />
            <span>Art QR & Tách Nền Studio</span>
          </Link>

          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
            title="Đăng xuất và khóa quyền Admin"
          >
            <LogOut className="size-3.5" />
            <span>Khóa Admin</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#0a0d18] space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tổng Người Dùng</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Users className="size-4.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{overview?.total_users || 0}</div>
          <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-semibold">
            <CheckCircle2 className="size-3.5" />
            <span>Đồng bộ qua MongoDB Atlas</span>
          </div>
        </div>

        {/* Total Active Keys */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#0a0d18] space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tổng API Keys Đang Chạy</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Key className="size-4.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-300">
            {overview?.total_active_keys || 0}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-indigo-400 font-semibold">
            <Zap className="size-3.5" />
            <span>Xác thực Autonomous Agents</span>
          </div>
        </div>

        {/* Total Tokens Consumed */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#0a0d18] space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tổng Tokens Đã Tiêu Tốn</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Coins className="size-4.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-300">
            {(overview?.total_tokens_used || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Tổng lượt gọi: </span>
            <span className="font-bold text-white">{overview?.total_requests || 0} requests</span>
          </div>
        </div>

        {/* Upstream Health */}
        <div
          className={`p-6 rounded-3xl border space-y-3 relative overflow-hidden shadow-xl ${
            (overview?.upstream_stats?.active_keys ?? 0) === 0
              ? 'border-rose-500/40 bg-[#180a0f]'
              : 'border-emerald-500/30 bg-[#071317]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <span
              className={
                (overview?.upstream_stats?.active_keys ?? 0) === 0
                  ? 'text-rose-400'
                  : 'text-emerald-400'
              }
            >
              Bể Xoay Tua Lõi (Rotator)
            </span>
            <div
              className={`p-2 rounded-xl ${
                (overview?.upstream_stats?.active_keys ?? 0) === 0
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <Activity className="size-4.5" />
            </div>
          </div>
          <div
            className={`text-3xl font-black ${
              (overview?.upstream_stats?.active_keys ?? 0) === 0
                ? 'text-rose-400'
                : 'text-emerald-300'
            }`}
          >
            {overview?.upstream_stats?.active_keys ?? 0} /{' '}
            {overview?.upstream_stats?.total_keys ?? 8} Keys
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold">
            {(overview?.upstream_stats?.active_keys ?? 0) === 0 ? (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertTriangle className="size-3.5" />
                <span>Toàn bộ Keys lỗi / hết hạn!</span>
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping mr-1" />
                <span>Hoạt Động Bình Thường</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Admin Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 overflow-x-auto">
        <button
          onClick={() => setAdminTab('xkiro')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'xkiro'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/40 ring-1 ring-cyan-400'
              : 'text-cyan-300 hover:text-white hover:bg-cyan-500/10'
          }`}
        >
          <Bot className="size-4" />
          <span>💬 Trang 1: API xKiro (Chat AI)</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/40 font-mono text-cyan-200">
            {xkiroKeys.length} Keys
          </span>
        </button>

        <button
          onClick={() => {
            setAdminTab('machgen');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'machgen'
              ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/40 ring-1 ring-amber-400'
              : 'text-amber-300 hover:text-white hover:bg-amber-500/10'
          }`}
        >
          <Cpu className="size-4" />
          <span>⚡ Trang 2: API Keys MachGen</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/40 font-mono text-amber-200">
            {machgenKeys.length} Keys
          </span>
        </button>

        <button
          onClick={() => {
            setAdminTab('artqr');
            loadArtQRPresets();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'artqr'
              ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white shadow-lg shadow-pink-600/50 ring-2 ring-pink-400 animate-pulse'
              : 'text-pink-300 hover:text-white hover:bg-pink-500/20 border border-pink-500/30'
          }`}
        >
          <Sparkles className="size-4 text-pink-300" />
          <span>🎨 Trang 3: SỬA PROMPT, GIÁ & ẢNH MẪU ART QR</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/60 font-mono text-pink-200">
            {artqrPresets.length} styles
          </span>
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'users'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="size-4" />
          <span>👥 Người Dùng & Token</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/40 font-mono">
            {users.length} users
          </span>
        </button>

        <button
          onClick={() => setAdminTab('giftcodes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'giftcodes'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-purple-300 hover:text-white hover:bg-purple-500/10'
          }`}
        >
          <Gift className="size-4" />
          <span>🎁 Quản Lý Giftcode</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/40 font-mono">
            {giftcodes.length} mã
          </span>
        </button>

        <button
          onClick={() => setAdminTab('rotator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'rotator'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="size-4" />
          <span>⚡ Diagnostics Matrix (Live Ping)</span>
        </button>
      </div>

      {/* Internal Diagnostics Matrix (Visible to Admin Only) */}
      {adminTab === 'rotator' && overview?.upstream_stats?.keys && (
        <div
          className={`p-6 rounded-3xl border space-y-4 shadow-xl ${
            (overview?.upstream_stats?.active_keys ?? 0) === 0
              ? 'border-rose-500/30 bg-[#0f0910]'
              : 'border-white/10 bg-[#0a0d18]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="size-4.5 text-cyan-400" />
                <span>Trạng Thái Live {overview.upstream_stats.total_keys || 8} Upstream Keys</span>
                {(overview?.upstream_stats?.active_keys ?? 0) === 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    Cảnh Báo Lỗi Toàn Bộ
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kiểm tra sức khỏe kết nối, mã lỗi HTTP và số lần gọi luân phiên tới nhà cung cấp xKiro
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-cyan-300 hidden md:inline">
                Model: {overview.upstream_stats.default_model}
              </span>

              <button
                type="button"
                onClick={handleCheckRotator}
                disabled={checkingRotator}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
                title="Gửi request kiểm tra trạng thái từng key"
              >
                <RefreshCw className={`size-3.5 ${checkingRotator ? 'animate-spin' : ''}`} />
                <span>{checkingRotator ? 'Đang ping keys...' : 'Ping Test Toàn Bộ'}</span>
              </button>
            </div>
          </div>

          {/* Critical Error Alert Banner if 0 keys active */}
          {(overview?.upstream_stats?.active_keys ?? 0) === 0 && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-400">
                <AlertCircle className="size-4" />
                <span>CẢNH BÁO HỆ THỐNG: TẤT CẢ {overview.upstream_stats.total_keys || 8} UPSTREAM KEYS ĐỀU ĐANG BỊ LỖI!</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Các API key upstream trả về lỗi <b>HTTP 401: Invalid or disabled ClientApiKey</b>. Người dùng khi nhắn tin trong màn hình Chat sẽ nhận câu thông báo router fallback thay vì câu trả lời của AI. Vui lòng cập nhật API keys còn hạn trong file <code>.env</code> trên máy chủ.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {overview.upstream_stats.keys.map((k: any) => {
              const isKeyDead = !k.is_active || k.last_status_code === 401 || k.last_status_code === 403;
              return (
                <div
                  key={k.index}
                  className={`p-3.5 rounded-2xl border space-y-2 transition-all ${
                    isKeyDead
                      ? 'border-rose-500/30 bg-[#160b11]'
                      : 'border-white/5 bg-[#0e1222]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white flex items-center gap-1">
                      <span>Key #{k.index}</span>
                      {isKeyDead && <AlertTriangle className="size-3 text-rose-400" />}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        isKeyDead
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isKeyDead
                        ? `LỖI (${k.last_status_code || 401})`
                        : 'Live'}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-slate-300 truncate">{k.key_masked}</div>

                  {k.last_error && (
                    <div
                      className="text-[10px] text-rose-400 bg-black/40 rounded p-1 font-mono truncate"
                      title={k.last_error}
                    >
                      {k.last_error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRANG 1: QUẢN LÝ & TEST API xKiro (CHUYÊN TRÁCH CHAT AI & SUY LUẬN)        */}
      {/* ========================================================================= */}
      {adminTab === 'xkiro' && (
        <div className="p-6 sm:p-8 rounded-3xl border border-cyan-500/30 bg-[#090d1a] space-y-6 shadow-2xl relative overflow-hidden ring-1 ring-cyan-500/20">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 size-64 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

          {/* Page 1 Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/25">
                  <Bot className="size-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white tracking-wide">
                      TRANG 1: Quản Lý & Test API xKiro (Chat AI & Suy Luận)
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Chuyên Trách Chat
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Định tuyến toàn bộ hội thoại Chat Playground, DeepSeek R1, GPT-4o, Claude, Qwen qua bể API Key xoay tua của xKiro (kết nối an toàn qua Cloudflare Worker).
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={loadAdminData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-all shrink-0 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới ({xkiroKeys.length} keys)</span>
            </button>
          </div>

          {/* Test & Add Form for xKiro */}
          <div className="p-6 rounded-2xl border border-cyan-500/20 bg-[#0e1424] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Play className="size-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Kiểm Tra Trực Tiếp & Thêm Key xKiro</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Gửi đoạn ping nhẹ tới xKiro để đo HTTP Status Code và độ trễ ms trước khi thêm
              </span>
            </div>

            {/* xKiro Presets */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Chọn Nhanh Endpoint xKiro / Chat:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    name: 'xKiro (Cloudflare Proxy An Toàn)',
                    url: 'https://proxyhack.mafiavietnam1945.workers.dev/v1',
                    model: 'deepseek/deepseek-v4-flash',
                    provider: 'xKiro Proxy',
                  },
                  {
                    name: 'xKiro Trực Tiếp',
                    url: 'https://api.xkiro.com/v1',
                    model: 'deepseek/deepseek-v4-flash',
                    provider: 'xKiro Upstream',
                  },
                  {
                    name: 'DeepSeek Official',
                    url: 'https://api.deepseek.com/v1',
                    model: 'deepseek-chat',
                    provider: 'DeepSeek Official',
                  },
                  {
                    name: 'OpenRouter AI',
                    url: 'https://openrouter.ai/api/v1',
                    model: 'deepseek/deepseek-chat',
                    provider: 'OpenRouter',
                  },
                  {
                    name: 'OpenAI Official',
                    url: 'https://api.openai.com/v1',
                    model: 'gpt-4o-mini',
                    provider: 'OpenAI',
                  },
                  {
                    name: 'Groq Cloud',
                    url: 'https://api.groq.com/openai/v1',
                    model: 'llama-3.3-70b-versatile',
                    provider: 'Groq',
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setXkiroBaseURL(preset.url);
                      setXkiroModel(preset.model);
                      setXkiroProvider(preset.provider);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      xkiroBaseURL === preset.url
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-md shadow-cyan-950/40'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* xKiro Input Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tên Tài Khoản xKiro
                </label>
                <input
                  type="text"
                  value={xkiroKeyName}
                  onChange={(e) => setXkiroKeyName(e.target.value)}
                  placeholder="Ví dụ: Acc xKiro VIP 1 / Acc Phụ 2"
                  className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#070b14] text-xs font-bold text-cyan-300 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Base URL xKiro
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="text"
                    value={xkiroBaseURL}
                    onChange={(e) => setXkiroBaseURL(e.target.value)}
                    placeholder="https://proxyhack.mafiavietnam1945.workers.dev/v1"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-white/10 bg-[#070b14] text-xs font-mono text-cyan-300 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Model ID Test
                  </label>
                  <span className="text-[10px] text-cyan-400 font-medium">User tự chọn khi Chat</span>
                </div>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="text"
                    value={xkiroModel}
                    onChange={(e) => setXkiroModel(e.target.value)}
                    placeholder="deepseek/deepseek-v4-flash"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-white/10 bg-[#070b14] text-xs font-mono text-purple-300 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tên Provider
                </label>
                <input
                  type="text"
                  value={xkiroProvider}
                  onChange={(e) => setXkiroProvider(e.target.value)}
                  placeholder="xKiro Proxy / DeepSeek"
                  className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#070b14] text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Secret xKiro API Key Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="size-3.5 text-cyan-400" />
                  <span>API Key xKiro (Bắt đầu bằng sk-xt-...)</span>
                </label>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="size-3" />
                  Không bao giờ lộ ra ngoài
                </span>
              </div>
              <div className="relative">
                <input
                  type={xkiroShowKey ? 'text' : 'password'}
                  value={xkiroKey}
                  onChange={(e) => setXkiroKey(e.target.value)}
                  placeholder="sk-xt-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-white/10 bg-[#070b14] text-xs font-mono text-cyan-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setXkiroShowKey(!xkiroShowKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {xkiroShowKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons for xKiro */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestXkiroKey}
                disabled={xkiroTesting || !xkiroKey.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Play className={`size-4 ${xkiroTesting ? 'animate-spin' : ''}`} />
                <span>{xkiroTesting ? 'Đang gửi ping test xKiro...' : '⚡ Test Trực Tiếp Key xKiro'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddXkiroKey}
                disabled={xkiroAddLoading || !xkiroKey.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-extrabold text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Check className="size-4" />
                <span>{xkiroAddLoading ? 'Đang thêm...' : '➕ Thêm Key Vào Bể Chat xKiro'}</span>
              </button>

              {xkiroKey && (
                <button
                  type="button"
                  onClick={() => {
                    setXkiroKey('');
                    setXkiroTestResult(null);
                    setXkiroAddFeedback(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-white/5 hover:bg-white/5 cursor-pointer"
                >
                  Xóa ô nhập
                </button>
              )}
            </div>

            {/* Test Result Feedback for xKiro */}
            {xkiroTestResult && (
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  xkiroTestResult.success
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                    : 'border-rose-500/40 bg-rose-950/20 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {xkiroTestResult.success ? (
                      <>
                        <CheckCircle2 className="size-4 text-emerald-400" />
                        <span className="text-emerald-300">
                          KẾT NỐI xKIRO THÀNH CÔNG! KEY SẴN SÀNG PHỤC VỤ CHAT AI
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="size-4 text-rose-400" />
                        <span className="text-rose-300">
                          KEY xKIRO BỊ TỪ CHỐI HOẶC HẾT HẠN
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        xkiroTestResult.status_code === 200
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      HTTP {xkiroTestResult.status_code}
                    </span>
                    {xkiroTestResult.latency_ms > 0 && (
                      <span className="px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-white/10">
                        {xkiroTestResult.latency_ms} ms
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs font-mono bg-black/40 p-2.5 rounded-xl border border-white/5 break-all">
                  {xkiroTestResult.message}
                </p>
              </div>
            )}

            {/* Add Key Feedback for xKiro */}
            {xkiroAddFeedback && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold ${
                  xkiroAddFeedback.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border-rose-500/40 bg-rose-950/30 text-rose-300'
                }`}
              >
                {xkiroAddFeedback.message}
              </div>
            )}
          </div>

          {/* Dedicated xKiro Active Keys Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="size-4 text-cyan-400" />
                <span>Bể Xoay Tua Key xKiro Chat ({xkiroKeys.length} keys)</span>
              </h3>
              <span className="text-xs text-slate-400">
                Chỉ hiển thị các key phục vụ Chat AI (không lẫn key tạo ảnh)
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-cyan-500/20 bg-[#0e1220]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider bg-white/[0.02]">
                    <th className="py-3 px-4 font-semibold">STT</th>
                    <th className="py-3 px-4 font-semibold">Tên Tài Khoản xKiro</th>
                    <th className="py-3 px-4 font-semibold">Masked Key</th>
                    <th className="py-3 px-4 font-semibold">Base URL</th>
                    <th className="py-3 px-4 font-semibold">Trạng Thái Live</th>
                    <th className="py-3 px-4 font-semibold">Requests / Lỗi</th>
                    <th className="py-3 px-4 font-semibold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {xkiroKeys.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                        Chưa có key xKiro nào trong bể xoay tua. Hãy thêm key đầu tiên ở trên!
                      </td>
                    </tr>
                  ) : (
                    xkiroKeys.map((k: any, idx: number) => {
                      const isDead = !k.is_active || k.last_status_code === 401 || k.last_status_code === 403;
                      return (
                        <tr key={k.id || idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400">#{idx + 1}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-cyan-400" />
                              <span>{k.name || `Acc xKiro #${idx + 1}`}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            <span className="px-2 py-0.5 rounded bg-black/50 border border-white/10 text-cyan-300">
                              {k.key_masked}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-200">{k.provider || 'xKiro Upstream'}</div>
                            <div className="text-[10px] font-mono text-slate-500 truncate max-w-xs">
                              {k.base_url || 'https://api.xkiro.com/v1'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                                isDead
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  isDead ? 'bg-rose-400' : k.request_count === 0 ? 'bg-slate-400' : 'bg-emerald-400 animate-ping'
                                }`}
                              />
                              {isDead
                                ? `Lỗi HTTP ${k.last_status_code || 401}`
                                : k.request_count === 0
                                ? 'Sẵn Sàng'
                                : 'Live (HTTP 200)'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className="text-cyan-300 font-bold">{k.request_count}</span>
                            <span className="text-slate-500"> reqs / </span>
                            <span className={k.error_count > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                              {k.error_count} lỗi
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleUpstreamKey(k.id || String(k.index), k.is_active)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                                  k.is_active
                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/30'
                                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
                                }`}
                                title={k.is_active ? 'Tạm dừng key này' : 'Kích hoạt lại key này'}
                              >
                                <span>{k.is_active ? '⏸️ Tạm Dừng' : '▶️ Bật Lại'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUpstreamKey(k.id || String(k.index), k.key_masked, k.name)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition-all shadow-sm shadow-rose-500/10 cursor-pointer inline-flex items-center gap-1.5"
                                title="Xóa vĩnh viễn key này khỏi MongoDB và hệ thống"
                              >
                                <Trash className="size-3.5" />
                                <span>Xóa Vĩnh Viễn</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRANG 2: QUẢN LÝ & TEST API MachGen (CHUYÊN TRÁCH TẠO ẢNH 4K & ART QR)     */}
      {/* ========================================================================= */}
      {adminTab === 'machgen' && (
        <div className="p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-[#120e09]/90 space-y-6 shadow-2xl relative overflow-hidden ring-1 ring-amber-500/20">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 size-64 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

          {/* Page 2 Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/25">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white tracking-wide">
                      TRANG 2: Quản Lý & Test API MachGen (Ảnh 4K & Art QR Studio)
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Chuyên Trách Đồ Họa
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Hạ tầng độc lập MachGen chuyên trách <b>Tạo ảnh 4K</b> (/dashboard/image) và <b>Art QR Code</b> (/dashboard/art-qr). Hoàn toàn tách biệt khỏi luồng Chat AI xKiro.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={loadAdminData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-all shrink-0 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới ({machgenKeys.length} keys)</span>
            </button>
          </div>

          {/* Architecture Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400" />
                <span>Kiến Trúc Độc Lập MachGen: Image Studio + Art QR Generator</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                • <b>Mặc định Free Engine:</b> Hệ thống sử dụng cụm Pollinations FLUX không giới hạn lượt tạo, không yêu cầu API key trả phí.<br />
                • <b>Người dùng tự do chọn Model:</b> Trên giao diện Studio, khách hàng có thể chọn 5+ models khác nhau (Flux-Realism, Anime, Turbo...). Thêm key Replicate nếu muốn tốc độ siêu tốc dưới 2s.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/dashboard/image"
                target="_blank"
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                <span>Mở Image Studio</span>
                <ExternalLink className="size-3" />
              </Link>
              <Link
                href="/dashboard/art-qr"
                target="_blank"
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                <span>Mở Art QR Studio</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>

          {/* Direct Link Banner to Trang 3 for Prompt & Reference Image */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/60 via-purple-950/60 to-[#1e0d22] border border-pink-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30 shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Bạn đang tìm nơi Sửa Prompt, Đổi Giá Xu & Thay Ảnh Mẫu Art QR?</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/30 text-pink-300 border border-pink-500/40 uppercase">
                    Ở Trang 3
                  </span>
                </h4>
                <p className="text-xs text-pink-200/80">
                  Trang 2 này chỉ quản lý API Key MachGen. Để sửa nội dung <b>Prompt</b>, đổi <b>Giá Tiền</b> hoặc tải lên <b>Ảnh Tham Chiếu</b> (Bánh Mì Doraemon,...), vui lòng bấm nút bên cạnh!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAdminTab('artqr');
                loadArtQRPresets();
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:brightness-110 text-white shadow-lg shadow-pink-600/40 shrink-0 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Chuyển Sang Trang 3: Sửa Prompt & Ảnh Mẫu Ngay →</span>
            </button>
          </div>

          {/* Test & Add Form for MachGen */}
          <div className="p-6 rounded-2xl border border-amber-500/20 bg-[#171109] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Play className="size-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Kiểm Tra Kết Nối & Thêm Key MachGen</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Ping kiểm tra endpoint tạo ảnh Pollinations hoặc Replicate Token trước khi đưa vào bể
              </span>
            </div>

            {/* MachGen Presets */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Chọn Nhanh Endpoint MachGen / Tạo Ảnh:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    name: 'MachGen Studio (Pollinations FLUX Free)',
                    url: 'https://image.pollinations.ai',
                    model: 'flux',
                    provider: 'MachGen Studio',
                  },
                  {
                    name: 'MachGen Turbo (Pollinations Turbo Free)',
                    url: 'https://image.pollinations.ai',
                    model: 'turbo',
                    provider: 'MachGen Studio',
                  },
                  {
                    name: 'Replicate Official (Token r8_...)',
                    url: 'https://api.replicate.com/v1',
                    model: 'black-forest-labs/flux-schnell',
                    provider: 'MachGen Replicate',
                  },
                  {
                    name: 'Hugging Face FLUX.1',
                    url: 'https://api-inference.huggingface.co/models',
                    model: 'black-forest-labs/FLUX.1-dev',
                    provider: 'MachGen HuggingFace',
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setMachgenBaseURL(preset.url);
                      setMachgenModel(preset.model);
                      setMachgenProvider(preset.provider);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      machgenBaseURL === preset.url && machgenModel === preset.model
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-md shadow-amber-950/40'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* MachGen Input Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tên Cấu Hình MachGen
                </label>
                <input
                  type="text"
                  value={machgenKeyName}
                  onChange={(e) => setMachgenKeyName(e.target.value)}
                  placeholder="Ví dụ: Cụm FLUX Miễn Phí / Replicate VIP"
                  className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#0d0905] text-xs font-bold text-amber-300 placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Base URL Engine
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="text"
                    value={machgenBaseURL}
                    onChange={(e) => setMachgenBaseURL(e.target.value)}
                    placeholder="https://image.pollinations.ai"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-white/10 bg-[#0d0905] text-xs font-mono text-amber-300 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Model Mặc Định
                  </label>
                  <span className="text-[10px] text-amber-400 font-medium">User tự chọn ở Studio</span>
                </div>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="text"
                    value={machgenModel}
                    onChange={(e) => setMachgenModel(e.target.value)}
                    placeholder="flux"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-white/10 bg-[#0d0905] text-xs font-mono text-amber-300 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tên Provider
                </label>
                <input
                  type="text"
                  value={machgenProvider}
                  onChange={(e) => setMachgenProvider(e.target.value)}
                  placeholder="MachGen Studio"
                  className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#0d0905] text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Secret MachGen API Key / Token */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="size-3.5 text-amber-400" />
                  <span>API Token MachGen (Nếu dùng Replicate: r8_... | Nếu dùng Pollinations Free: có thể để trống)</span>
                </label>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="size-3" />
                  Bảo mật tuyệt đối
                </span>
              </div>
              <div className="relative">
                <input
                  type={machgenShowKey ? 'text' : 'password'}
                  value={machgenKey}
                  onChange={(e) => setMachgenKey(e.target.value)}
                  placeholder="r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxx (hoặc để trống nếu dùng Pollinations Free Engine)"
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-white/10 bg-[#0d0905] text-xs font-mono text-amber-200 placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMachgenShowKey(!machgenShowKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {machgenShowKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons for MachGen */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestMachgenKey}
                disabled={machgenTesting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-extrabold text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Play className={`size-4 ${machgenTesting ? 'animate-spin' : ''}`} />
                <span>{machgenTesting ? 'Đang kiểm tra kết nối...' : '⚡ Test Kết Nối Engine MachGen'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddMachgenKey}
                disabled={machgenAddLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-extrabold text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Check className="size-4" />
                <span>{machgenAddLoading ? 'Đang lưu...' : '➕ Lưu Cấu Hình Vào MachGen'}</span>
              </button>

              {machgenKey && (
                <button
                  type="button"
                  onClick={() => {
                    setMachgenKey('');
                    setMachgenTestResult(null);
                    setMachgenAddFeedback(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-white/5 hover:bg-white/5 cursor-pointer"
                >
                  Xóa ô nhập
                </button>
              )}
            </div>

            {/* Test Result Feedback for MachGen */}
            {machgenTestResult && (
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  machgenTestResult.success
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                    : 'border-rose-500/40 bg-rose-950/20 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {machgenTestResult.success ? (
                      <>
                        <CheckCircle2 className="size-4 text-emerald-400" />
                        <span className="text-emerald-300">
                          KẾT NỐI MACHGEN SẴN SÀNG! ĐÃ SẴN SÀNG TẠO ẢNH 4K & ART QR
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="size-4 text-rose-400" />
                        <span className="text-rose-300">
                          KẾT NỐI MACHGEN BỊ TỪ CHỐI
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        machgenTestResult.status_code === 200
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      HTTP {machgenTestResult.status_code}
                    </span>
                    {machgenTestResult.latency_ms > 0 && (
                      <span className="px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-white/10">
                        {machgenTestResult.latency_ms} ms
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs font-mono bg-black/40 p-2.5 rounded-xl border border-white/5 break-all">
                  {machgenTestResult.message}
                </p>
              </div>
            )}

            {/* Add Feedback for MachGen */}
            {machgenAddFeedback && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold ${
                  machgenAddFeedback.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border-rose-500/40 bg-rose-950/30 text-rose-300'
                }`}
              >
                {machgenAddFeedback.message}
              </div>
            )}
          </div>

          {/* Dedicated MachGen Active Keys Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400" />
                <span>Danh Sách Cấu Hình / Key MachGen Đang Hoạt Động ({machgenKeys.length} items)</span>
              </h3>
              <span className="text-xs text-slate-400">
                Chỉ hiển thị các key & endpoint phục vụ Tạo Ảnh & Art QR Studio
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-amber-500/20 bg-[#15100a]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider bg-white/[0.02]">
                    <th className="py-3 px-4 font-semibold">STT</th>
                    <th className="py-3 px-4 font-semibold">Tên Cấu Hình MachGen</th>
                    <th className="py-3 px-4 font-semibold">Masked Key / Token</th>
                    <th className="py-3 px-4 font-semibold">Base URL</th>
                    <th className="py-3 px-4 font-semibold">Trạng Thái Live</th>
                    <th className="py-3 px-4 font-semibold">Lượt Tạo Ảnh / Lỗi</th>
                    <th className="py-3 px-4 font-semibold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {machgenKeys.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                        Chưa có key MachGen tùy chỉnh nào. Hệ thống mặc định đang dùng Free Engine Pollinations. Hãy thêm cấu hình ở trên nếu muốn thêm token Replicate!
                      </td>
                    </tr>
                  ) : (
                    machgenKeys.map((k: any, idx: number) => {
                      const isDead = !k.is_active || k.last_status_code === 401 || k.last_status_code === 403;
                      return (
                        <tr key={k.id || idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400">#{idx + 1}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-amber-400" />
                              <span>{k.name || `MachGen Node #${idx + 1}`}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            <span className="px-2 py-0.5 rounded bg-black/50 border border-white/10 text-amber-300">
                              {k.key_masked || 'Free Engine (No Key)'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-200">{k.provider || 'MachGen Studio'}</div>
                            <div className="text-[10px] font-mono text-slate-500 truncate max-w-xs">
                              {k.base_url || 'https://image.pollinations.ai'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                                isDead
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  isDead ? 'bg-rose-400' : k.request_count === 0 ? 'bg-slate-400' : 'bg-emerald-400 animate-ping'
                                }`}
                              />
                              {isDead
                                ? `Lỗi HTTP ${k.last_status_code || 401}`
                                : k.request_count === 0
                                ? 'Sẵn Sàng'
                                : 'Live (HTTP 200)'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className="text-amber-300 font-bold">{k.request_count}</span>
                            <span className="text-slate-500"> ảnh / </span>
                            <span className={k.error_count > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                              {k.error_count} lỗi
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleUpstreamKey(k.id || String(k.index), k.is_active)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                                  k.is_active
                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/30'
                                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
                                }`}
                                title={k.is_active ? 'Tạm dừng cấu hình này' : 'Kích hoạt lại cấu hình này'}
                              >
                                <span>{k.is_active ? '⏸️ Tạm Dừng' : '▶️ Bật Lại'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUpstreamKey(k.id || String(k.index), k.key_masked || 'Free Engine', k.name)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition-all shadow-sm shadow-rose-500/10 cursor-pointer inline-flex items-center gap-1.5"
                                title="Xóa vĩnh viễn cấu hình này khỏi MongoDB và hệ thống"
                              >
                                <Trash className="size-3.5" />
                                <span>Xóa Vĩnh Viễn</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRANG 3: QUẢN LÝ PHONG CÁCH ART QR (TOÀN QUYỀN ĐỊNH GIÁ, PROMPT & ẢNH MẪU) */}
      {/* ========================================================================= */}
      {adminTab === 'artqr' && (
        <div className="p-6 sm:p-8 rounded-3xl border border-pink-500/30 bg-[#140a18]/90 space-y-6 shadow-2xl relative overflow-hidden ring-1 ring-pink-500/20">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 size-64 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />

          {/* Page 3 Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white shadow-lg shadow-pink-500/25">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white tracking-wide">
                      TRANG 3: Quản Lý Phong Cách Art QR (Toàn Quyền Admin)
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      Toàn Quyền Định Giá & Prompt
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Toàn quyền cấu hình: Hiện giá bao nhiêu (Xu/VNĐ), thay đổi Prompt AI MachGen thế hệ mới, tải lên/thay thế Ảnh tham chiếu cảnh và bật/tắt phong cách trực tiếp trên ứng dụng.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadArtQRPresets}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-all shrink-0 cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${artqrLoading ? 'animate-spin' : ''}`} />
                <span>Làm mới ({artqrPresets.length} phong cách)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreatePreset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
              >
                <Plus className="size-4" />
                <span>+ Thêm Phong Cách Mới</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="text-[11px] text-slate-400">Tổng Số Phong Cách</div>
              <div className="text-2xl font-black text-white mt-1">{artqrPresets.length}</div>
            </div>
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03]">
              <div className="text-[11px] text-emerald-400">Đang Bật Hiển Thị</div>
              <div className="text-2xl font-black text-emerald-300 mt-1">
                {artqrPresets.filter((p) => p.enabled !== false).length}
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03]">
              <div className="text-[11px] text-amber-400">Tạm Ẩn / Tắt</div>
              <div className="text-2xl font-black text-amber-300 mt-1">
                {artqrPresets.filter((p) => p.enabled === false).length}
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-pink-500/20 bg-pink-500/[0.03]">
              <div className="text-[11px] text-pink-400">Định Giá Mặc Định</div>
              <div className="text-2xl font-black text-pink-300 mt-1">5 ~ 10 Xu</div>
            </div>
          </div>

          {/* Feedback Banner */}
          {presetFeedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold ${
                presetFeedback.type === 'success'
                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                  : 'border-rose-500/40 bg-rose-950/40 text-rose-300'
              }`}
            >
              {presetFeedback.message}
            </div>
          )}

          {/* ========================================================================= */}
          {/* BẢNG CHỈNH SỬA TRỰC TIẾP: PROMPT, ẢNH THAM CHIẾU & GIÁ BÁN (ADMIN)         */}
          {/* ========================================================================= */}
          <div id="artqr-direct-editor" className="p-6 sm:p-7 rounded-3xl border-2 border-pink-500/50 bg-[#190d20] space-y-6 shadow-2xl relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30">
                  <Edit className="size-6" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5 flex-wrap">
                    <span>🎯 KHU VỰC CHỈNH SỬA PROMPT, GIÁ TIỀN & ẢNH THAM CHIẾU</span>
                    {editingPreset && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
                        Đang chọn: {editingPreset.name || 'Phong cách mới'}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Admin sửa trực tiếp tại đây: Nhập/thay đổi Prompt AI, tải ảnh tham chiếu mới từ máy tính và thiết lập giá bán.
                  </p>
                </div>
              </div>

              {/* Quick style switcher buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Chọn phong cách sửa:</span>
                {artqrPresets.map((p) => {
                  const isCurrent = editingPreset?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleOpenEditPreset(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-600/40 ring-2 ring-pink-300'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handleOpenCreatePreset}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus className="size-3.5" />
                  <span>+ Thêm Mới</span>
                </button>
              </div>
            </div>

            {editingPreset ? (
              <form onSubmit={handleSavePreset} className="space-y-5">
                {/* Row 1: Name, Slug, Enabled */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Tên Phong Cách <span className="text-pink-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editingPreset.name}
                      onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                      placeholder="Ví dụ: Bánh Mì Trí Nhớ Doraemon"
                      className="w-full h-10 px-3.5 rounded-xl border border-white/15 bg-[#0d0712] text-xs font-bold text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Mã Định Danh (ID / Slug)
                    </label>
                    <input
                      type="text"
                      value={editingPreset.id}
                      onChange={(e) => setEditingPreset({ ...editingPreset, id: e.target.value, slug: e.target.value })}
                      placeholder="Ví dụ: doraemon_bread"
                      className="w-full h-10 px-3.5 rounded-xl border border-white/15 bg-[#0d0712] text-xs font-mono text-pink-300 placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Trạng Thái Hiển Thị
                    </label>
                    <div className="h-10 px-3 rounded-xl border border-white/15 bg-[#0d0712] flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="direct_preset_enabled"
                        checked={editingPreset.enabled !== false}
                        onChange={(e) => setEditingPreset({ ...editingPreset, enabled: e.target.checked })}
                        className="size-4 rounded accent-pink-500 cursor-pointer"
                      />
                      <label htmlFor="direct_preset_enabled" className="text-xs font-semibold text-slate-200 cursor-pointer">
                        {editingPreset.enabled !== false ? '✅ Đang bật hiển thị' : '⏸️ Tạm ẩn khỏi user'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Row 2: Two Distinct Image Sections (Mục 1A & Mục 1B) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Mục 1A: ẢNH MẪU THÀNH PHẨM (User Preview Showcase) */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="size-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          1A. Ảnh Mẫu Cho User Xem (Showcase Preview)
                        </h4>
                      </div>
                      <span className="text-[10px] text-amber-400/90 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        Hiển thị ở Catalog & Studio
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Ảnh tác phẩm hoàn chỉnh (có Art QR mẫu) để khách xem và chọn phong cách.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                      {/* Preview Box */}
                      <div className="size-24 sm:size-28 rounded-2xl overflow-hidden border border-amber-500/30 bg-black/60 shrink-0 relative shadow-lg">
                        <img
                          src={editingPreset.preview_url || editingPreset.reference_image_url || '/presets/doraemon_bread_scene.jpg'}
                          alt="User Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).setAttribute('src', '/presets/doraemon_bread_scene.jpg');
                          }}
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/80 text-amber-300">
                          Khách Xem
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2.5 w-full">
                        {/* Upload Button */}
                        <div>
                          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer transition-all">
                            <Upload className="size-3.5" />
                            <span>{uploadingPreview ? 'Đang tải...' : '📁 TẢI ẢNH MẪU CHO KHÁCH XEM'}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              disabled={uploadingPreview}
                              onChange={handleUploadPreviewFile}
                            />
                          </label>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                            Hoặc URL Ảnh Mẫu:
                          </label>
                          <input
                            type="text"
                            value={editingPreset.preview_url || ''}
                            onChange={(e) =>
                              setEditingPreset({
                                ...editingPreset,
                                preview_url: e.target.value,
                              })
                            }
                            placeholder="/presets/doraemon_bread_scene.jpg hoặc link HTTPS"
                            className="w-full h-8 px-2.5 rounded-lg border border-white/10 bg-[#0d0712] text-[11px] font-mono text-amber-200 focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mục 1B: ẢNH PHÔI THAM CHIẾU (AI Generation Scene Reference) */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-pink-500/30 bg-pink-500/[0.04] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-pink-400" />
                        <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider">
                          1B. Ảnh Phôi Tham Chiếu Cho AI Gen (Scene Base)
                        </h4>
                      </div>
                      <span className="text-[10px] text-pink-400/90 font-semibold px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/20">
                        AI MachGen sử dụng
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Ảnh phôi nền cảnh gốc (chưa có QR) để AI hòa quyện mã QR của người dùng vào.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                      {/* Reference Scene Box */}
                      <div className="size-24 sm:size-28 rounded-2xl overflow-hidden border border-pink-500/30 bg-black/60 shrink-0 relative shadow-lg">
                        <img
                          src={editingPreset.reference_image_url || '/presets/doraemon_bread_scene.jpg'}
                          alt="AI Reference Scene"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).setAttribute('src', '/presets/doraemon_bread_scene.jpg');
                          }}
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/80 text-pink-300">
                          AI Dùng
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2.5 w-full">
                        {/* Upload Button */}
                        <div>
                          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white shadow-md shadow-pink-600/20 cursor-pointer transition-all">
                            <Upload className="size-3.5" />
                            <span>{uploadingScene ? 'Đang tải...' : '📁 TẢI ẢNH PHÔI CHO AI GEN'}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              disabled={uploadingScene}
                              onChange={handleUploadSceneFile}
                            />
                          </label>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                            Hoặc URL Ảnh Phôi:
                          </label>
                          <input
                            type="text"
                            value={editingPreset.reference_image_url || ''}
                            onChange={(e) =>
                              setEditingPreset({
                                ...editingPreset,
                                reference_image_url: e.target.value,
                              })
                            }
                            placeholder="/presets/doraemon_bread_scene.jpg hoặc link HTTPS"
                            className="w-full h-8 px-2.5 rounded-lg border border-white/10 bg-[#0d0712] text-[11px] font-mono text-pink-200 focus:border-pink-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: Prompt Textarea (Mục 2) */}
                <div className="p-4 sm:p-5 rounded-2xl border border-pink-500/30 bg-pink-500/[0.04] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="size-4 text-pink-400" />
                      <span>2. Nội Dung Prompt MachGen AI (Thay Prompt Tùy Ý Admin)</span>
                    </label>
                    <span className="text-[11px] text-pink-400 font-semibold">
                      Chỉ Admin mới có quyền sửa văn bản này
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    required
                    value={editingPreset.prompt}
                    onChange={(e) => setEditingPreset({ ...editingPreset, prompt: e.target.value })}
                    placeholder="Nhập prompt chi tiết: Masterpiece photograph, cinematic lighting, realistic textures, seamless integration..."
                    className="w-full p-3.5 rounded-2xl border border-white/15 bg-[#0d0712] text-xs font-mono text-slate-200 placeholder-slate-500 focus:border-pink-500 focus:outline-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400">
                    💡 Gợi ý: Hãy giữ nguyên các câu lệnh bảo toàn ma trận QR và mô tả chi tiết chất liệu, ánh sáng, góc chụp để MachGen tạo ra tác phẩm tinh xảo nhất.
                  </p>
                </div>

                {/* Row 4: Pricing & Material */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.03]">
                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      Giá Tiêu Tốn (Xu / Credits mỗi lần tạo)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editingPreset.price_credits ?? 5}
                      onChange={(e) => setEditingPreset({ ...editingPreset, price_credits: Number(e.target.value) })}
                      className="w-full h-10 px-3.5 rounded-xl border border-amber-500/30 bg-[#0d0712] text-xs font-black text-amber-300 focus:border-amber-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Số Xu bị trừ khi tạo mã bằng phong cách này</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-300 block mb-1">
                      Giá Tiền VNĐ Tham Chiếu (Hiển thị)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={editingPreset.price_vnd ?? 15000}
                      onChange={(e) => setEditingPreset({ ...editingPreset, price_vnd: Number(e.target.value) })}
                      className="w-full h-10 px-3.5 rounded-xl border border-emerald-500/30 bg-[#0d0712] text-xs font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Hiển thị cho khách hàng so sánh (VNĐ)</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Chất Liệu / Phong Thái
                    </label>
                    <input
                      type="text"
                      value={editingPreset.material || ''}
                      onChange={(e) => setEditingPreset({ ...editingPreset, material: e.target.value })}
                      placeholder="Ví dụ: Bánh mì nướng mật ong"
                      className="w-full h-10 px-3.5 rounded-xl border border-white/15 bg-[#0d0712] text-xs text-white focus:border-pink-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Ghi chú chất liệu hiển thị cho khách</p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={presetSaving}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:brightness-110 text-white shadow-xl shadow-pink-600/40 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {presetSaving ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />
                        <span>Đang Lưu Thay Đổi...</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-4" />
                        <span>💾 LƯU CẤU HÌNH (CẬP NHẬT TỨC THÌ VÀO HỆ THỐNG)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-black/20 rounded-2xl border border-white/10">
                Hãy chọn một phong cách ở thanh bên trên hoặc bấm "+ Thêm Mới" để bắt đầu chỉnh sửa.
              </div>
            )}
          </div>

          {/* Presets List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="size-4 text-pink-400" />
                <span>Danh Sách Phong Cách Art QR Đang Áp Dụng</span>
              </h3>
              <span className="text-xs text-slate-400">
                Nhấp vào "Sửa Chi Tiết" để đổi giá tiền, sửa Prompt hoặc upload ảnh tham chiếu mới
              </span>
            </div>

            {artqrPresets.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-white/10 bg-black/20 text-slate-400 text-xs">
                Chưa có phong cách nào hoặc đang tải dữ liệu... Nhấn "Làm mới" hoặc "Thêm Phong Cách Mới" ở trên.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artqrPresets.map((preset) => {
                  const isEnabled = preset.enabled !== false;
                  return (
                    <div
                      key={preset.id}
                      className={`p-5 rounded-3xl border transition-all space-y-4 relative ${
                        isEnabled
                          ? 'border-pink-500/30 bg-[#190c1f]/80 shadow-lg shadow-pink-950/20'
                          : 'border-white/10 bg-white/[0.02] opacity-75'
                      }`}
                    >
                      {/* Card Top: Image + Info */}
                      <div className="flex gap-4 items-start">
                        <div className="relative size-24 sm:size-28 rounded-2xl overflow-hidden border border-white/15 bg-black/40 shrink-0">
                          <img
                            src={preset.reference_image_url || preset.preview_url || '/presets/doraemon_bread.png'}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute('src', '/presets/doraemon_bread.png');
                            }}
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-white/90">
                            Ảnh Mẫu
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-black text-white truncate">{preset.name}</h4>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                isEnabled
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                              }`}
                            >
                              {isEnabled ? 'Live / Đang Bật' : 'Tạm Ẩn'}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono text-pink-300 truncate">
                            ID: <span className="text-slate-300">{preset.id}</span>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2">{preset.description}</p>

                          {/* Pricing Badges */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 inline-flex items-center gap-1">
                              <Coins className="size-3.5" />
                              <span>{preset.price_credits ?? 5} Xu / lần</span>
                            </span>

                            {preset.price_vnd ? (
                              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                {preset.price_vnd.toLocaleString('vi-VN')} đ
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Prompt Preview */}
                      <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-pink-300 flex items-center gap-1">
                            <Sparkles className="size-3" />
                            <span>Prompt MachGen AI:</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[150px]">
                            Màu: {preset.dark_color || '#1e140d'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-300 line-clamp-2 leading-relaxed">
                          {preset.prompt}
                        </p>
                      </div>

                      {/* Technical Specs */}
                      <div className="grid grid-cols-3 gap-2 text-[11px] py-1">
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                          <div className="text-[10px] text-slate-400">Chất liệu</div>
                          <div className="font-semibold text-slate-200 truncate mt-0.5">
                            {preset.material || 'Tự nhiên'}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                          <div className="text-[10px] text-slate-400">Texture hòa trộn</div>
                          <div className="font-semibold text-pink-300 mt-0.5">
                            {Math.round((preset.texture_strength || 0.85) * 100)}%
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                          <div className="text-[10px] text-slate-400">Tương phản</div>
                          <div className="font-semibold text-cyan-300 mt-0.5">
                            {preset.contrast_strength || 1.15}x
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => handleTogglePresetEnabled(preset)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                            isEnabled
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/30'
                              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
                          }`}
                        >
                          <span>{isEnabled ? '⏸️ Tạm Ẩn' : '▶️ Bật Hiển Thị'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPreset(preset)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-pink-600/20 text-pink-300 border border-pink-500/40 hover:bg-pink-600 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Edit className="size-3.5" />
                            <span>Sửa Chi Tiết (Giá, Prompt, Ảnh)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePreset(preset.id, preset.name)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Xóa phong cách này"
                          >
                            <Trash className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Management Section */}
      {adminTab === 'users' && (
        <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#0a0d18] space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="size-5 text-cyan-400" />
                Danh Sách Người Dùng & Token Tiêu Tốn
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Theo dõi chi tiết số token tiêu thụ, số dư ví và số lượng API key đang cấp phát cho từng user
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo email, tên hoặc ID..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-white/10 bg-[#121626] text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Người Dùng</th>
                  <th className="pb-3 font-semibold">Gói (Plan)</th>
                  <th className="pb-3 font-semibold">Số Dư Ví</th>
                  <th className="pb-3 font-semibold">Token Đã Dùng</th>
                  <th className="pb-3 font-semibold">API Keys</th>
                  <th className="pb-3 font-semibold">Tổng Requests</th>
                  <th className="pb-3 font-semibold">Ngày Tạo</th>
                  <th className="pb-3 font-semibold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                      Không tìm thấy người dùng phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* User */}
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {(u.name || u.email || 'U').slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{u.name || 'Developer'}</span>
                              {u.role === 'admin' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-4">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {u.plan || 'FREE'}
                        </span>
                      </td>

                      {/* Balance */}
                      <td className="py-4 font-bold text-white text-sm">
                        ${u.balance.toFixed(2)}
                      </td>

                      {/* Tokens Used (Daily + Gift) */}
                      <td className="py-4">
                        <div className="space-y-1 max-w-[160px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-cyan-300 font-mono">
                              {(u.daily_tokens_used || 0).toLocaleString()}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              / {(u.daily_tokens_limit || 1000).toLocaleString()} (Ngày)
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              style={{
                                width: `${Math.min(100, (((u.daily_tokens_used || 0) / (u.daily_tokens_limit || 1000)) * 100))}%`,
                              }}
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-500"
                            />
                          </div>
                          {Boolean(u.gift_tokens && u.gift_tokens > 0) && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 mt-0.5">
                              <Gift className="size-2.5" />
                              <span>+{(u.gift_tokens || 0).toLocaleString()} Gift</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Active Keys */}
                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          <Key className="size-3.5 text-indigo-400" />
                          <span className="font-bold text-white">{u.active_keys}</span>
                          <span className="text-slate-500 text-[11px]">keys</span>
                        </div>
                      </td>

                      {/* Total Requests */}
                      <td className="py-4 font-mono text-slate-300">
                        {u.total_requests} reqs
                      </td>

                      {/* Created At */}
                      <td className="py-4 text-slate-400 font-mono text-[11px]">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Actions */}
                      <td className="py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setAdjustAmount(10);
                            setAdjustTokens(1000000);
                            setAdjustPlan(u.plan);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-colors cursor-pointer"
                        >
                          <Edit className="size-3.5" />
                          <span>Cộng / Sửa</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Giftcode Management Section */}
      {adminTab === 'giftcodes' && (
        <div className="p-6 sm:p-8 rounded-3xl border border-purple-500/20 bg-[#0a0d18] space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gift className="size-5 text-purple-400" />
                Quản Lý Mã Giftcode & Token Quà Tặng
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tạo mã quà tặng kèm số lượng lượt nhập. Khi người dùng nhập hết số lượng, mã sẽ tự động khóa. Token từ Giftcode không bị reset theo ngày!
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold font-mono self-start sm:self-auto">
              {giftcodes.length} mã trong hệ thống
            </span>
          </div>

          {/* Create Giftcode Form */}
          <form
            onSubmit={handleCreateGiftcode}
            className="p-5 rounded-2xl border border-white/10 bg-[#0e1222] flex flex-col md:flex-row gap-3 items-end"
          >
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-xs font-semibold text-slate-300">
                Mã Giftcode (Code)
              </label>
              <input
                type="text"
                required
                value={newGiftCode}
                onChange={(e) => setNewGiftCode(e.target.value)}
                placeholder="VD: LEMASVIP, CHAOMUNG2026..."
                className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#141829] text-xs font-mono uppercase text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div className="w-full md:w-44 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Số Token Tặng (Vĩnh viễn)
              </label>
              <input
                type="number"
                required
                step="1000"
                value={newGiftTokens}
                onChange={(e) => setNewGiftTokens(parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#141829] text-xs font-mono text-purple-300 font-bold focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div className="w-full md:w-36 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Số Lượng Nhập (Max)
              </label>
              <input
                type="number"
                required
                min="1"
                value={newGiftMaxUses}
                onChange={(e) => setNewGiftMaxUses(parseInt(e.target.value) || 1)}
                className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#141829] text-xs font-mono text-white focus:border-purple-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={giftCreating || !newGiftCode.trim()}
              className="w-full md:w-auto h-10 px-5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40 shadow-lg shadow-purple-950/40 cursor-pointer"
            >
              <Gift className="size-4" />
              <span>{giftCreating ? 'Đang tạo...' : '+ Tạo Mã Giftcode'}</span>
            </button>
          </form>

          {/* Giftcodes Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Mã Giftcode</th>
                  <th className="pb-3 font-semibold">Số Token Thưởng</th>
                  <th className="pb-3 font-semibold">Đã Nhận / Giới Hạn</th>
                  <th className="pb-3 font-semibold">Trạng Thái</th>
                  <th className="pb-3 font-semibold">Ngày Tạo</th>
                  <th className="pb-3 font-semibold text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {giftcodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                      Chưa có mã Giftcode nào được tạo. Hãy tạo mã đầu tiên bên trên.
                    </td>
                  </tr>
                ) : (
                  giftcodes.map((g) => {
                    const isExhausted = g.status === 'exhausted' || (g.max_uses > 0 && g.used_count >= g.max_uses);
                    return (
                      <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono font-bold text-xs uppercase">
                            {g.code}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono font-bold text-white text-sm">
                          +{(g.tokens || 0).toLocaleString()} tokens
                        </td>
                        <td className="py-3.5 font-mono">
                          <span className="font-bold text-cyan-300">{g.used_count || 0}</span>
                          <span className="text-slate-500"> / {g.max_uses || 0} lượt</span>
                        </td>
                        <td className="py-3.5">
                          {isExhausted ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Đã Hết Lượt (Đóng)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Đang Hoạt Động
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                          {new Date(g.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleDeleteGiftcode(g.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Xóa mã Giftcode"
                          >
                            <Trash className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0e1222] p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit className="size-4 text-cyan-400" />
                  Điều Chỉnh Tài Khoản
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Cộng / Trừ Số Dư ($)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="1"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                    className="flex-1 h-10 px-3.5 rounded-xl border border-white/10 bg-[#161b2e] text-sm font-bold text-cyan-300 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustAmount(20)}
                    className="px-3 h-10 rounded-xl bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10"
                  >
                    +$20
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAmount(50)}
                    className="px-3 h-10 rounded-xl bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10"
                  >
                    +$50
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Số dư hiện tại: <b>${selectedUser.balance.toFixed(2)}</b> (sau khi cộng: ${(selectedUser.balance + adjustAmount).toFixed(2)})
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Cộng Thêm Token Allocation
                </label>
                <input
                  type="number"
                  step="100000"
                  value={adjustTokens}
                  onChange={(e) => setAdjustTokens(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#161b2e] text-sm font-mono text-purple-300 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nâng Cấp Gói Cước (Plan)
                </label>
                <select
                  value={adjustPlan}
                  onChange={(e) => setAdjustPlan(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#161b2e] text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="free">FREE</option>
                  <option value="pro">PRO ($20/tháng)</option>
                  <option value="pro_plus">PRO+ ($50/tháng)</option>
                  <option value="max">MAX ($100/tháng)</option>
                  <option value="ultra">ULTRA ($250/tháng)</option>
                  <option value="power">POWER ($500/tháng)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-cyan-500/20"
                >
                  {adjusting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
