'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, Activity, ArrowUpRight, Send, Globe, MessageSquare, Sparkles } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="w-full border-t border-[var(--color-border)] bg-[var(--bg-card)]/60 pt-16 pb-12 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[var(--color-border)]">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl flex items-center justify-center p-0.5">
                <img src="/logo.png" alt="Lemas Logo" className="size-7.5 object-contain" />
              </div>
              <span className="text-xl font-black tracking-tight text-[var(--color-fg)]">
                Lemas<span className="text-emerald-400">.AI</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--color-fg-muted)] max-w-sm leading-relaxed">
              Unified, high-throughput AI Gateway & Token Hub for autonomous agents and modern developers. Access
              hundreds of leading models at volume discount rates.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex size-2.5 rounded-full bg-cyan-500"></span>
              </span>
              <Link
                href="/status"
                className="text-xs font-semibold text-[var(--color-fg-muted)] hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                All Nodes Operational (99.99% SLA)
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg)] mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/#models"
                  className="text-[var(--color-fg-muted)] hover:text-cyan-400 transition-colors"
                >
                  Model Catalog
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  className="text-[var(--color-fg-muted)] hover:text-cyan-400 transition-colors"
                >
                  Pricing Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/deals"
                  className="text-[var(--color-fg-muted)] hover:text-cyan-400 transition-colors"
                >
                  Deals & Grants
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="text-[var(--color-fg-muted)] hover:text-cyan-400 transition-colors"
                >
                  Network Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg)] mb-4">
              Developers
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/docs"
                  className="text-[var(--color-fg-muted)] hover:text-cyan-400 transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/docs#openai"
                  className="text-[var(--color-fg-muted)] hover:text-cyan-400 transition-colors"
                >
                  OpenAI SDK Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/docs#anthropic"
                  className="text-[var(--color-fg-muted)] hover:text-cyan-400 transition-colors"
                >
                  Anthropic Messages
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-[var(--color-fg-muted)] hover:text-cyan-400 transition-colors"
                >
                  API Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg)] mb-4">
              Support & Ecosystem
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="text-[var(--color-fg-muted)] hover:text-cyan-400 transition-colors"
                >
                  Contact Engineers
                </Link>
              </li>
              <li>
                <a
                  href="https://t.me/lemas_ai"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--color-fg-muted)] hover:text-cyan-400 transition-colors flex items-center gap-1"
                >
                  Telegram Community
                  <ArrowUpRight className="size-3 opacity-60" />
                </a>
              </li>
              <li>
                <span className="text-xs text-[var(--color-fg-subtle)]">
                  Available in EN, VI & ZH
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-fg-subtle)]">
          <p>© {new Date().getFullYear()} Lemas.AI — Bản quyền thuộc về MacchuStudio. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[var(--color-fg)]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--color-fg)]">
              Terms of Service
            </Link>
            <Link href="/status" className="hover:text-[var(--color-fg)]">
              Edge Health
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
