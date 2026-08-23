'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Zap,
  Gift,
  TrendingDown,
  Maximize2,
  ShieldCheck,
  Gauge,
  Cpu,
  Layers,
  Sparkles,
  Lock,
  RefreshCw,
  Orbit,
} from 'lucide-react';
import InteractiveHeroCode from '@/components/InteractiveHeroCode';
import ModelCatalog from '@/components/ModelCatalog';
import PricingCalculator from '@/components/PricingCalculator';
import FaqSection from '@/components/FaqSection';

export default function HomePage() {
  const stats = [
    { value: '20+', label: 'Free models', icon: Gift },
    { value: '50–70%', label: 'Cost reduction', icon: TrendingDown },
    { value: '2M+', label: 'Max context window', icon: Maximize2 },
    { value: '99.99%', label: 'Uptime SLA', icon: ShieldCheck },
    { value: '~12ms', label: 'Edge routing latency', icon: Gauge },
  ];

  const features = [
    {
      icon: Orbit,
      title: 'Unified AI Multi-Model Router',
      desc: 'One universal API interface for OpenAI, Anthropic, DeepSeek, Google, xAI, Qwen, and Mistral with zero code friction.',
    },
    {
      icon: RefreshCw,
      title: 'Real-Time Dynamic Fallbacks',
      desc: 'Autonomous hot-swapping prevents dropped agent requests if any single upstream LLM provider experiences latency spikes.',
    },
    {
      icon: Lock,
      title: 'Autonomous Agent Safeguards',
      desc: 'Fine-grained key permissions, hard token spend limits, and real-time usage telemetry designed for agent fleets.',
    },
    {
      icon: Cpu,
      title: 'Edge Accelerated Routing',
      desc: 'Global sub-15ms edge compute clusters engineered specifically for high-frequency tool calls and recursive agent loops.',
    },
  ];

  return (
    <div className="relative">
      {/* Background Aurora Grid */}
      <div className="aurora-hero-grid absolute inset-0 pointer-events-none h-[750px]" aria-hidden="true" />
      <div className="aurora-glow absolute top-0 inset-x-0 h-[600px] pointer-events-none opacity-40" aria-hidden="true" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 sm:pt-28 sm:pb-24 lg:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold text-cyan-300">
                <span className="size-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Lemas.AI v2.0 — 20+ Free Frontier Models & High-Speed Pool</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--color-fg)] leading-[1.1]">
                Unified AI Gateway,
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-500">
                  Intelligent Pricing.
                </span>
                <span className="inline-block w-1.5 h-8 bg-cyan-400 ml-1 animate-blink align-middle rounded-sm" />
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[var(--color-fg-muted)] leading-relaxed max-w-xl">
                Connect your AI agents and applications to Claude 3.7, DeepSeek R1, GPT-4o, and
                hundreds of models with one unified API key, compatible with both OpenAI and
                Anthropic SDKs.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white text-sm font-semibold hover:opacity-95 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
                >
                  <Sparkles className="size-4" />
                  <span>Get Free API Tokens</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/#pricing"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-card)] text-sm font-semibold text-[var(--color-fg)] hover:border-cyan-500/50 hover:bg-[var(--bg-card-hover)] transition-all"
                >
                  Explore Models & Pricing
                </Link>
              </div>

              {/* Check features */}
              <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-3 text-xs text-[var(--color-fg-muted)]">
                <li className="flex items-center gap-1.5">
                  <Check className="size-4 text-cyan-400 shrink-0" />
                  <span>20+ free frontier models</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="size-4 text-cyan-400 shrink-0" />
                  <span>50–70% cost reduction</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="size-4 text-cyan-400 shrink-0" />
                  <span>Sub-15ms edge routing</span>
                </li>
              </ul>
            </div>

            {/* Right Interactive Code Terminal */}
            <div className="lg:col-span-6">
              <InteractiveHeroCode />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 border-t border-[var(--color-border)] pt-10">
            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {stats.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-2.5 p-4 rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)]/70 hover:border-cyan-500/30 transition-all shadow-md"
                  >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Icon className="size-4.5" />
                    </span>
                    <div>
                      <dt className="text-2xl font-extrabold tracking-tight text-[var(--color-fg)]">
                        {item.value}
                      </dt>
                      <dd className="text-xs text-[var(--color-fg-muted)] mt-0.5">{item.label}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </section>

      {/* Model Catalog Section */}
      <ModelCatalog />

      {/* Why Lemas.AI Features Grid */}
      <section className="py-24 border-t border-[var(--color-border)] relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-4">
              <Sparkles className="size-3.5" />
              Engineered For Agents
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-fg)]">
              Next-generation architecture for high-speed AI routing.
            </h2>
            <p className="mt-3 text-base text-[var(--color-fg-muted)]">
              Empower autonomous agent swarms, background batch jobs, and enterprise AI applications
              with high throughput and zero vendor lock-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)] p-6 hover:border-cyan-500/40 hover:bg-[var(--bg-card-hover)] transition-all space-y-3 shadow-lg"
                >
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="text-base font-bold text-[var(--color-fg)]">{f.title}</h3>
                  <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingCalculator />

      {/* FAQ Section */}
      <FaqSection />

      {/* Bottom CTA Banner */}
      <section className="py-20 border-t border-[var(--color-border)] relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[#090c17] via-[#101528] to-[#090c17] p-10 sm:p-14 text-center relative overflow-hidden shadow-2xl">
            <div className="max-w-2xl mx-auto space-y-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold text-cyan-300">
                <Cpu className="size-3.5" />
                Instant Setup
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-fg)]">
                Ready to cut your LLM token expenses by up to 70%?
              </h2>
              <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
                Trải nghiệm ngay 20+ mô hình AI miễn phí với 1,000 tokens/ngày. Tích hợp Lemas.AI vào ứng dụng của bạn chỉ trong vài phút.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white text-sm font-semibold hover:opacity-95 shadow-lg shadow-cyan-500/25 transition-all"
                >
                  <Sparkles className="size-4" />
                  <span>Trải Nghiệm Miễn Phí</span>
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-card)] text-sm font-semibold text-[var(--color-fg)] hover:border-cyan-500/50 transition-all"
                >
                  Read Docs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
