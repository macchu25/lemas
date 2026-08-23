'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag, Sparkles, Copy, Check, ArrowRight, Gift, Percent, Users, Cpu } from 'lucide-react';
import { Deal, getDeals } from '@/lib/api';

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getDeals();
      setDeals(data);
    }
    load();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="py-20 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-4">
            <Sparkles className="size-3.5" />
            Lemas Grants & Vouchers
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--color-fg)]">
            Exclusive AI Developer Grants & Promotions
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[var(--color-fg-muted)]">
            Claim bonus token allocations, top-up matching multipliers, and revenue-share referral
            credits for developers and AI agents.
          </p>
        </div>

        {/* Deals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="flex flex-col justify-between rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)] p-7 hover:border-cyan-500/50 hover:bg-[var(--bg-card-hover)] transition-all shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    {deal.tag}
                  </span>
                  <span className="text-sm font-extrabold text-cyan-400">
                    {deal.discount}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[var(--color-fg)]">{deal.title}</h3>
                <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">{deal.desc}</p>
              </div>

              <div className="mt-8 pt-5 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-[var(--bg-elevated)] px-3 py-1.5 rounded-xl border border-[var(--color-border)]">
                  <span className="text-xs font-mono font-bold text-[var(--color-fg)]">
                    {deal.code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(deal.code)}
                    className="text-[var(--color-fg-muted)] hover:text-white transition-colors"
                    title="Copy promo code"
                  >
                    {copiedCode === deal.code ? (
                      <Check className="size-3.5 text-cyan-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>

                <Link
                  href={`/register?code=${deal.code}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline"
                >
                  Claim Offer
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
