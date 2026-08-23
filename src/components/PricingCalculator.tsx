'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, Zap, Sparkles, HelpCircle, ArrowRight, Cpu } from 'lucide-react';
import { PricingTier, getPricingTiers } from '@/lib/api';

export default function PricingCalculator() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [annualBilling, setAnnualBilling] = useState(false);
  const [tokenVolumeM, setTokenVolumeM] = useState(50);

  useEffect(() => {
    async function load() {
      const data = await getPricingTiers();
      setTiers(data);
    }
    load();
  }, []);

  const directProviderCost = tokenVolumeM * 5.0;
  const lemasCost = tokenVolumeM * 2.0;
  const monthlySavings = directProviderCost - lemasCost;
  const savingsPercent = Math.round((monthlySavings / directProviderCost) * 100);

  return (
    <section id="pricing" className="py-24 border-t border-[var(--color-border)] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-4">
            <Zap className="size-3.5" />
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-fg)]">
            Simple, transparent plans for AI Agents.
          </h2>
          <p className="mt-3 text-base text-[var(--color-fg-muted)]">
            Pay only for what you route with zero hidden markup, or choose an Agent tier with bundled
            volume discounts.
          </p>

          {/* Billing Switcher */}
          <div className="mt-8 flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--color-border)] p-1.5 rounded-2xl">
            <button
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                !annualBilling
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm'
                  : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                annualBilling
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm'
                  : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
              }`}
            >
              <span>Annual</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-cyan-400/20 text-cyan-300 font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {tiers.map((tier) => {
            const rawPrice = tier.price;
            const finalPrice = annualBilling ? Math.round(rawPrice * 0.8) : rawPrice;
            const isPopular = tier.badge === 'Popular' || tier.id === 'pro';

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-7 transition-all ${
                  isPopular
                    ? 'border-cyan-500/80 bg-[var(--bg-card)] shadow-xl shadow-cyan-950/30 ring-1 ring-cyan-500/50'
                    : 'border-[var(--color-border)] bg-[var(--bg-card)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md">
                    {tier.badge}
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-bold text-[var(--color-fg)]">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-[var(--color-fg)]">
                      ${finalPrice}
                    </span>
                    <span className="text-xs font-medium text-[var(--color-fg-muted)]">
                      {tier.price === 0 ? 'forever' : '/ month'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-cyan-400 mt-2">
                    Includes {tier.tokens} tokens / mo
                  </p>

                  <div className="my-6 border-t border-[var(--color-border)]" />

                  <ul className="space-y-3 text-xs text-[var(--color-fg-muted)]">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="size-4 shrink-0 text-cyan-400" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    href={tier.price === 0 ? '/register' : '/register?plan=' + tier.id}
                    className={`flex items-center justify-center gap-1.5 w-full h-11 rounded-xl text-sm font-semibold transition-all ${
                      isPopular
                        ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white hover:opacity-95 shadow-lg shadow-cyan-500/25'
                        : 'border border-[var(--color-border)] bg-[var(--bg-elevated)] text-[var(--color-fg)] hover:border-cyan-500 hover:text-cyan-400'
                    }`}
                  >
                    <span>{tier.price === 0 ? 'Start Free' : 'Subscribe to ' + tier.name}</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Token Savings Interactive Slider */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Interactive ROI Calculator
            </span>
            <h3 className="text-2xl font-bold text-[var(--color-fg)] mt-1">
              Estimate your monthly token savings with Norn.AI
            </h3>
            <p className="text-xs text-[var(--color-fg-muted)] mt-1">
              Slide to select your team or agent fleet monthly token throughput.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-fg-muted)]">
                  Monthly Token Volume:
                </span>
                <span className="text-xl font-mono font-bold text-cyan-400">
                  {tokenVolumeM} Million Tokens
                </span>
              </div>

              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={tokenVolumeM}
                onChange={(e) => setTokenVolumeM(Number(e.target.value))}
                className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              <div className="flex justify-between text-[11px] font-mono text-[var(--color-fg-subtle)]">
                <span>5M tokens / mo</span>
                <span>250M tokens / mo</span>
                <span>500M tokens / mo</span>
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 p-6 flex flex-col justify-center text-center space-y-2">
              <div className="text-xs uppercase font-bold text-cyan-400 tracking-wider">
                Estimated Savings
              </div>
              <div className="text-3xl font-extrabold text-[var(--color-fg)]">
                ${Math.round(monthlySavings).toLocaleString()}
                <span className="text-xs font-normal text-[var(--color-fg-muted)]"> / mo</span>
              </div>
              <p className="text-xs text-cyan-200">
                You save approx <span className="font-bold">{savingsPercent}%</span> compared to
                calling upstream model APIs directly!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
