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
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

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
  const [adminTab, setAdminTab] = useState<'all' | 'giftcodes' | 'users' | 'rotator' | 'upstream'>('all');

  // Adjust modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(10);
  const [adjustTokens, setAdjustTokens] = useState(1000000);
  const [adjustPlan, setAdjustPlan] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [checkingRotator, setCheckingRotator] = useState(false);

  // Live Upstream Key Tester & Adder State
  const [testKey, setTestKey] = useState('');
  const [testKeyName, setTestKeyName] = useState('');
  const [showTestKey, setShowTestKey] = useState(false);
  const [testBaseURL, setTestBaseURL] = useState('https://proxyhack.mafiavietnam1945.workers.dev/v1');
  const [testModel, setTestModel] = useState('deepseek/deepseek-v4-flash');
  const [testProvider, setTestProvider] = useState('xKiro Proxy');
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status_code: number;
    message: string;
    latency_ms: number;
  } | null>(null);

  const [addKeyLoading, setAddKeyLoading] = useState(false);
  const [addKeyFeedback, setAddKeyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleTestLiveKey = async () => {
    if (!testKey.trim()) {
      alert('Vui lòng nhập API Key để kiểm tra');
      return;
    }
    setTestRunning(true);
    setTestResult(null);
    setAddKeyFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/rotator/test-key`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          key: testKey.trim(),
          base_url: testBaseURL.trim(),
          model: testModel.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult(data);
      } else {
        setTestResult({
          success: false,
          status_code: res.status,
          message: data.error || 'Kiểm tra thất bại',
          latency_ms: 0,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        status_code: 0,
        message: err?.message || 'Không thể kết nối tới server kiểm tra',
        latency_ms: 0,
      });
    } finally {
      setTestRunning(false);
    }
  };

  const handleAddKeyToPool = async () => {
    if (!testKey.trim()) {
      alert('Vui lòng nhập API Key');
      return;
    }
    setAddKeyLoading(true);
    setAddKeyFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/rotator/keys/add`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          key: testKey.trim(),
          name: testKeyName.trim() || 'Tài khoản chính',
          provider: testProvider.trim() || 'Custom Upstream',
          base_url: testBaseURL.trim(),
          test_first: false,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddKeyFeedback({
          type: 'success',
          message: `✅ Đã thêm key [${data.key?.name || ''}] ${data.key?.key_masked || ''} vào bể xoay tua thành công!`,
        });
        setTestKey('');
        setTestKeyName('');
        setTestResult(null);
        await loadAdminData();
      } else {
        setAddKeyFeedback({
          type: 'error',
          message: data.error || 'Thêm key thất bại',
        });
      }
    } catch (err: any) {
      setAddKeyFeedback({
        type: 'error',
        message: err?.message || 'Lỗi kết nối máy chủ',
      });
    } finally {
      setAddKeyLoading(false);
    }
  };

  const handleDeleteUpstreamKey = async (id: string, masked: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa key ${masked} khỏi hệ thống?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/rotator/keys/delete`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadAdminData();
      } else {
        alert(data.error || 'Xóa key thất bại');
      }
    } catch {
      alert('Lỗi kết nối khi xóa key');
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
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
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
          onClick={() => setAdminTab('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'all'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="size-4" />
          <span>Toàn Bộ Tổng Quan</span>
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
          <span>🎁 Tạo & Quản Lý Giftcode</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/40 font-mono">
            {giftcodes.length} mã
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
          onClick={() => setAdminTab('rotator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'rotator'
              ? (overview?.upstream_stats?.active_keys ?? 0) === 0
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : (overview?.upstream_stats?.active_keys ?? 0) === 0
              ? 'text-rose-400 hover:text-white hover:bg-rose-500/10'
              : 'text-emerald-400 hover:text-white hover:bg-emerald-500/10'
          }`}
        >
          <Activity className="size-4" />
          <span>⚡ Bể Xoay Tua Keys</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
              (overview?.upstream_stats?.active_keys ?? 0) === 0
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-black/40'
            }`}
          >
            {overview?.upstream_stats?.active_keys ?? 0}/
            {overview?.upstream_stats?.total_keys ?? 8} Live
          </span>
        </button>

        <button
          onClick={() => setAdminTab('upstream')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'upstream'
              ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/30'
              : 'text-amber-300 hover:text-white hover:bg-amber-500/10'
          }`}
        >
          <Key className="size-4" />
          <span>🔑 Test Trực Tiếp & Thêm Upstream API</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/40 font-mono text-emerald-300">
            Bảo mật 100%
          </span>
        </button>
      </div>

      {/* Internal Diagnostics Matrix (Visible to Admin Only) */}
      {(adminTab === 'all' || adminTab === 'rotator') && overview?.upstream_stats?.keys && (
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

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    <span>
                      Reqs: <b className="text-cyan-300">{k.request_count}</b>
                    </span>
                    <span>
                      Lỗi:{' '}
                      <b className={k.error_count > 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {k.error_count}
                      </b>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upstream API Live Testing & Key Management Section */}
      {(adminTab === 'all' || adminTab === 'upstream') && (
        <div className="p-6 sm:p-8 rounded-3xl border border-amber-500/20 bg-[#0c0e18] space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 size-64 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/25">
                  <Key className="size-5" />
                </span>
                <h2 className="text-lg font-black text-white tracking-wide">
                  Kiểm Tra Trực Tiếp & Quản Lý Upstream API Keys
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="size-3" />
                  Bảo Mật Tuyệt Đối (Zero Exposure)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Admin có thể thử nghiệm độc lập bất kỳ API Key nào (Base URL + Model) xem có sống không mà không cần lưu. Thêm key trực tiếp vào bể xoay tua (Rotator) ngay trong giao diện mà không cần restart server!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadAdminData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Cập nhật danh sách</span>
              </button>
            </div>
          </div>

          {/* Security Guarantee Callout Card */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5 md:mt-0">
                <Lock className="size-4" />
              </div>
              <div>
                <span className="font-bold text-indigo-200 block text-xs">
                  Cơ chế bảo vệ API Key chống lộ 100%:
                </span>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                  • <b>Zero Raw Key Exposure:</b> Backend Go sử dụng thuộc tính <code>json:&quot;-&quot;</code>, server <b>tuyệt đối không bao giờ</b> gửi raw key về trình duyệt (kể cả F12 DevTools).<br />
                  • <b>Masking tự động:</b> Toàn bộ key hiển thị dưới dạng che mờ (vd: <code>sk-xt-••••••••48f3</code>).<br />
                  • <b>Xác thực đặc quyền:</b> Mọi API test & thêm key đều bắt buộc xác thực token Super Admin qua Header <code>X-Admin-Token</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Live Tester Console */}
          <div className="p-6 rounded-2xl border border-white/10 bg-[#121626] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Play className="size-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Live Key Tester (Kiểm Tra Độc Lập)</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Gửi 1 đoạn chat ping nhẹ tới upstream để đo HTTP Status Code và Latency (ms)
              </span>
            </div>

            {/* Quick Provider Presets */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Chọn Nhanh Cấu Hình Nhà Cung Cấp (Presets):
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
                    name: 'OpenAI',
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
                  {
                    name: '🎨 MachGen Studio (API Tạo Ảnh)',
                    url: 'https://image.pollinations.ai',
                    model: 'flux',
                    provider: 'MachGen Studio',
                  },
                  {
                    name: '🎨 MachGen Replicate (API Tạo Ảnh)',
                    url: 'https://api.replicate.com/v1',
                    model: 'black-forest-labs/flux-schnell',
                    provider: 'MachGen Replicate',
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setTestBaseURL(preset.url);
                      setTestModel(preset.model);
                      setTestProvider(preset.provider);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      testBaseURL === preset.url
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tên Tài Khoản / Gợi Nhớ
                </label>
                <input
                  type="text"
                  value={testKeyName}
                  onChange={(e) => setTestKeyName(e.target.value)}
                  placeholder="Ví dụ: Acc xKiro VIP 1 / Acc MachGen Studio"
                  className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#0e1220] text-xs font-bold text-amber-300 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Base URL (OpenAI / Image API)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="text"
                    value={testBaseURL}
                    onChange={(e) => setTestBaseURL(e.target.value)}
                    placeholder="https://proxyhack.mafiavietnam1945.workers.dev/v1"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-white/10 bg-[#0e1220] text-xs font-mono text-cyan-300 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Model ID (Chỉ để Ping Test)
                  </label>
                  <span className="text-[10px] text-amber-400 font-medium">User tự chọn</span>
                </div>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="text"
                    value={testModel}
                    onChange={(e) => setTestModel(e.target.value)}
                    placeholder={testProvider?.toLowerCase().includes('machgen') ? 'flux (User tự chọn trên Studio)' : 'deepseek/deepseek-v4-flash'}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-white/10 bg-[#0e1220] text-xs font-mono text-purple-300 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {testProvider?.toLowerCase().includes('machgen')
                    ? '✨ MachGen: Admin chỉ cần thêm API. Mọi model (FLUX.1, Turbo 2.0, Photo, Anime, 3D) do người dùng tự chọn trên Studio.'
                    : '💡 Chỉ dùng để Ping Test. Khi Chat, người dùng có thể tự do chọn bất kỳ model nào.'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tên Nhà Cung Cấp (Provider)
                </label>
                <input
                  type="text"
                  value={testProvider}
                  onChange={(e) => setTestProvider(e.target.value)}
                  placeholder="xKiro Proxy / DeepSeek"
                  className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#0e1220] text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Secret API Key Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="size-3.5 text-amber-400" />
                  <span>API Key Cần Test / Thêm</span>
                </label>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="size-3" />
                  Được bảo vệ end-to-end qua TLS
                </span>
              </div>
              <div className="relative">
                <input
                  type={showTestKey ? 'text' : 'password'}
                  value={testKey}
                  onChange={(e) => setTestKey(e.target.value)}
                  placeholder="Nhập secret key upstream (ví dụ: sk-xt-xxxxxxxxxxxx hoặc sk-xxxx)..."
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-white/15 bg-[#0e1220] text-xs font-mono text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowTestKey(!showTestKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  title={showTestKey ? 'Ẩn key' : 'Hiện key'}
                >
                  {showTestKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestLiveKey}
                disabled={testRunning || !testKey.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Play className={`size-4 ${testRunning ? 'animate-spin' : ''}`} />
                <span>{testRunning ? 'Đang gửi ping test...' : '⚡ Test Trực Tiếp Key Này'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddKeyToPool}
                disabled={addKeyLoading || !testKey.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Check className="size-4" />
                <span>{addKeyLoading ? 'Đang thêm...' : '➕ Thêm Vào Bể Xoay Tua Lập Tức'}</span>
              </button>

              {testKey && (
                <button
                  type="button"
                  onClick={() => {
                    setTestKey('');
                    setTestResult(null);
                    setAddKeyFeedback(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-white/5 hover:bg-white/5"
                >
                  Xóa ô nhập
                </button>
              )}
            </div>

            {/* Test Result Feedback */}
            {testResult && (
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  testResult.success
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                    : 'border-rose-500/40 bg-rose-950/20 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {testResult.success ? (
                      <>
                        <CheckCircle2 className="size-4 text-emerald-400" />
                        <span className="text-emerald-300">
                          KẾT NỐI THÀNH CÔNG! API KEY HỢP LỆ VÀ SẴN SÀNG SỬ DỤNG
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="size-4 text-rose-400" />
                        <span className="text-rose-300">
                          KEY BỊ TỪ CHỐI HOẶC LỖI KẾT NỐI
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        testResult.status_code === 200
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      HTTP {testResult.status_code}
                    </span>
                    {testResult.latency_ms > 0 && (
                      <span className="px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-white/10">
                        {testResult.latency_ms} ms
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs font-mono bg-black/40 p-2.5 rounded-xl border border-white/5 break-all">
                  {testResult.message}
                </p>
              </div>
            )}

            {/* Add Key Feedback */}
            {addKeyFeedback && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold ${
                  addKeyFeedback.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border-rose-500/40 bg-rose-950/30 text-rose-300'
                }`}
              >
                {addKeyFeedback.message}
              </div>
            )}
          </div>

          {/* Active Keys in Upstream Pool Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="size-4 text-cyan-400" />
                <span>Danh Sách Keys Trong Bể Xoay Tua Hiện Tại ({overview?.upstream_stats?.keys?.length || 0})</span>
              </h3>
              <span className="text-xs text-slate-400">
                Toàn bộ key hiển thị dưới dạng mã hóa che giấu
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0e1220]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider bg-white/[0.02]">
                    <th className="py-3 px-4 font-semibold">STT</th>
                    <th className="py-3 px-4 font-semibold">Tên Tài Khoản / Gợi Nhớ</th>
                    <th className="py-3 px-4 font-semibold">Masked API Key (Bảo Mật)</th>
                    <th className="py-3 px-4 font-semibold">Nhà Cung Cấp / Base URL</th>
                    <th className="py-3 px-4 font-semibold">Trạng Thái Live</th>
                    <th className="py-3 px-4 font-semibold">Requests / Lỗi</th>
                    <th className="py-3 px-4 font-semibold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {!overview?.upstream_stats?.keys || overview.upstream_stats.keys.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                        Chưa có key nào trong bể xoay tua. Hãy thêm key đầu tiên ở trên!
                      </td>
                    </tr>
                  ) : (
                    overview.upstream_stats.keys.map((k: any) => {
                      const isDead = !k.is_active || k.last_status_code === 401 || k.last_status_code === 403;
                      return (
                        <tr key={k.id || k.index} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400">
                            #{k.index}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-amber-400" />
                              <span>{k.name || `Tài khoản #${k.index}`}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-black/50 border border-white/10 text-cyan-300">
                                {k.key_masked}
                              </span>
                              <span title="Key được che giấu tuyệt đối không bao giờ gửi ra ngoài">
                                <Lock className="size-3 text-slate-500" />
                              </span>
                            </div>
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
                                  : k.request_count === 0
                                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  isDead
                                    ? 'bg-rose-400'
                                    : k.request_count === 0
                                    ? 'bg-slate-400'
                                    : 'bg-emerald-400 animate-ping'
                                }`}
                              />
                              {isDead
                                ? `Lỗi HTTP ${k.last_status_code || 401}`
                                : k.request_count === 0
                                ? 'Sẵn Sàng (Chưa gọi)'
                                : 'Live (HTTP 200)'}
                            </span>
                            {k.last_error && (
                              <div className="text-[10px] text-rose-400 truncate max-w-xs mt-0.5 font-mono" title={k.last_error}>
                                {k.last_error}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className="text-cyan-300 font-bold">{k.request_count}</span>
                            <span className="text-slate-500"> reqs / </span>
                            <span className={k.error_count > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                              {k.error_count} lỗi
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleUpstreamKey(k.id || String(k.index), k.is_active)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  k.is_active
                                    ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                                    : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                                }`}
                                title={k.is_active ? 'Tạm dừng key này' : 'Kích hoạt lại key'}
                              >
                                {k.is_active ? 'Tạm Dừng' : 'Bật Lại'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUpstreamKey(k.id || String(k.index), k.key_masked)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Xóa key này khỏi bể xoay tua"
                              >
                                <Trash className="size-4" />
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

      {/* User Management Section */}
      {(adminTab === 'all' || adminTab === 'users') && (
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
      {(adminTab === 'all' || adminTab === 'giftcodes') && (
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
