'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserProfile,
  ApiKeyItem,
  ModelItem,
  PricingTier,
  getCurrentUser,
  getApiKeys,
  getModels,
  getPricingTiers,
  getUserAnalytics,
  UserAnalytics,
  removeStoredToken,
  topupUserBalance,
} from '@/lib/api';
import { translations } from '@/lib/translations';

interface DashboardContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  analytics: UserAnalytics | null;
  setAnalytics: React.Dispatch<React.SetStateAction<UserAnalytics | null>>;
  keys: ApiKeyItem[];
  setKeys: React.Dispatch<React.SetStateAction<ApiKeyItem[]>>;
  models: ModelItem[];
  setModels: React.Dispatch<React.SetStateAction<ModelItem[]>>;
  tiers: PricingTier[];
  setTiers: React.Dispatch<React.SetStateAction<PricingTier[]>>;
  lang: 'vi' | 'en' | 'zh';
  setLang: React.Dispatch<React.SetStateAction<'vi' | 'en' | 'zh'>>;
  toggleLanguage: () => void;
  t: typeof translations['vi']['dashboard'];
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  topupModalOpen: boolean;
  setTopupModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  refreshData: () => Promise<void>;
  handleLogout: () => void;
  handleTopup: (amountUSD: number) => Promise<boolean>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [lang, setLang] = useState<'vi' | 'en' | 'zh'>('vi');

  useEffect(() => {
    const savedLang = (localStorage.getItem('lemas_lang') || localStorage.getItem('norn_lang')) as 'vi' | 'en' | 'zh';
    if (savedLang && ['vi', 'en', 'zh'].includes(savedLang)) {
      setLang(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'vi' ? 'en' : lang === 'en' ? 'zh' : 'vi';
    setLang(nextLang);
    localStorage.setItem('lemas_lang', nextLang);
    localStorage.setItem('norn_lang', nextLang);
    window.dispatchEvent(new Event('languageChange'));
  };

  const refreshData = async () => {
    try {
      const u = await getCurrentUser();
      if (!u) {
        removeStoredToken();
        window.location.href = '/login';
        return;
      }
      setUser(u);

      const [k, m, p, a] = await Promise.all([
        getApiKeys().catch(() => []),
        getModels().catch(() => []),
        getPricingTiers().catch(() => []),
        getUserAnalytics().catch(() => null),
      ]);

      setKeys(k || []);
      setModels(m || []);
      setTiers(p || []);
      setAnalytics(a || null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLogout = () => {
    removeStoredToken();
    window.location.href = '/login';
  };

  const handleTopup = async (amountUSD: number): Promise<boolean> => {
    if (amountUSD <= 0) return false;
    try {
      const res = await topupUserBalance(amountUSD);
      await refreshData();
      return !!(res && res.success);
    } catch {
      await refreshData();
      return false;
    }
  };

  const t = translations[lang].dashboard;

  return (
    <DashboardContext.Provider
      value={{
        user,
        setUser,
        analytics,
        setAnalytics,
        keys,
        setKeys,
        models,
        setModels,
        tiers,
        setTiers,
        lang,
        setLang,
        toggleLanguage,
        t,
        sidebarOpen,
        setSidebarOpen,
        topupModalOpen,
        setTopupModalOpen,
        loading,
        refreshData,
        handleLogout,
        handleTopup,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
