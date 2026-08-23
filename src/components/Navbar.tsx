'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Cpu,
  Sparkles,
  Moon,
  Sun,
  Menu,
  X,
  Globe,
  LayoutDashboard,
  ShieldCheck,
  Tag,
  Activity,
  Mail,
  BookOpen,
} from 'lucide-react';
import { translations } from '@/lib/translations';
import { getStoredToken } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [lang, setLang] = useState<'vi' | 'en' | 'zh'>('vi');
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('lemas_lang') as 'vi' | 'en' | 'zh';
    if (savedLang && (savedLang === 'vi' || savedLang === 'en' || savedLang === 'zh')) {
      setLang(savedLang);
    }

    const savedTheme = localStorage.getItem('lemas_theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.add('light');
    }

    setIsLoggedIn(!!getStoredToken());
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'vi' ? 'en' : lang === 'en' ? 'zh' : 'vi';
    setLang(nextLang);
    localStorage.setItem('lemas_lang', nextLang);
    window.dispatchEvent(new Event('languageChange'));
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('lemas_theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) {
    return null;
  }

  const t = translations[lang].nav;

  const navLinks = [
    { href: '/', label: t.home },
    { href: '/#models', label: 'Models' },
    { href: '/#pricing', label: t.pricing },
    { href: '/deals', label: t.deals },
    { href: '/docs', label: t.docs },
    { href: '/status', label: t.status },
    { href: '/contact', label: t.contact },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--bg-base)]/80 backdrop-blur-2xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="size-8.5 rounded-xl flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform shrink-0">
            <img src="/logo.png" alt="Lemas.AI Logo" className="size-8 object-contain drop-shadow-md" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-[var(--color-fg)]">
              Lemas<span className="text-emerald-400">.AI</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'text-[var(--color-fg)] bg-[var(--bg-elevated)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Language Switch (Flag Logo Only) */}
          <button
            onClick={toggleLanguage}
            aria-label="Toggle language"
            className="flex items-center justify-center size-8 rounded-lg border border-[var(--color-border)] text-base hover:bg-[var(--bg-card-hover)] hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm"
            title={lang === 'vi' ? 'Tiếng Việt' : lang === 'en' ? 'English' : '简体中文'}
          >
            <span>{lang === 'vi' ? '🇻🇳' : lang === 'en' ? '🇺🇸' : '🇨🇳'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex size-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <div className="h-4 w-px bg-[var(--color-border)] mx-1" />

          {/* User Auth Buttons */}
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-950/40 transition-all"
            >
              <LayoutDashboard className="size-4" />
              {t.dashboard}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-2 text-sm font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
              >
                {t.signin}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold shadow-lg shadow-emerald-950/40 active:scale-[0.98] transition-all"
              >
                <Sparkles className="size-3.5" />
                {t.startFree}
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 text-xs font-bold border border-[var(--color-border)] rounded-md"
          >
            {lang.toUpperCase()}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[var(--color-border)] bg-[var(--bg-card)] px-4 py-4 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--bg-card-hover)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pt-2 border-t border-[var(--color-border)] flex flex-col gap-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium"
              >
                <LayoutDashboard className="size-4" />
                {t.dashboard}
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center h-10 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-fg)]"
                >
                  {t.signin}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-sm font-medium"
                >
                  <Sparkles className="size-4" />
                  {t.startFree}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
