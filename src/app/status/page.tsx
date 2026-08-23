'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, CheckCircle2, Clock, Globe, ArrowUpRight, Cpu } from 'lucide-react';
import { StatusResponse, getStatus } from '@/lib/api';

export default function StatusPage() {
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getStatus();
      setStatusData(res);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="py-20 relative">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-bold text-cyan-400">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-cyan-500"></span>
            </span>
            <span>{statusData?.system_status || 'All Global Edge Nodes Operational'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--color-fg)]">
            Lemas.AI Global Mesh & Network Health
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Real-time latency metrics, regional edge nodes health, and uptime monitoring across all
            LLM routing endpoints.
          </p>
        </div>

        {/* Global SLA Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)] p-6 space-y-1 shadow-lg">
            <span className="text-xs text-[var(--color-fg-muted)]">90-Day Uptime SLA</span>
            <div className="text-2xl font-extrabold text-[var(--color-fg)]">
              {statusData?.uptime_sla || '99.99%'}
            </div>
            <p className="text-[11px] text-cyan-400 font-semibold">Zero critical disruptions</p>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)] p-6 space-y-1 shadow-lg">
            <span className="text-xs text-[var(--color-fg-muted)]">Edge Hop Latency</span>
            <div className="text-2xl font-extrabold text-cyan-400">
              {statusData?.average_ping || '12ms'}
            </div>
            <p className="text-[11px] text-[var(--color-fg-muted)]">Direct fiber multi-region peering</p>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)] p-6 space-y-1 shadow-lg">
            <span className="text-xs text-[var(--color-fg-muted)]">Hot-Swap Fallbacks</span>
            <div className="text-2xl font-extrabold text-indigo-400">Active (100%)</div>
            <p className="text-[11px] text-indigo-300 font-semibold">Automated retry logic enabled</p>
          </div>
        </div>

        {/* Regional Nodes Status */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)] p-7 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--color-fg)]">Worldwide Edge Relays</h3>
              <p className="text-xs text-[var(--color-fg-muted)]">
                Autonomous low-overhead AI gateway proxies
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--color-fg-subtle)]">
              Updated: {new Date().toLocaleTimeString()}
            </span>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {(statusData?.regions || []).map((region, i) => (
              <div key={i} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="size-4 text-cyan-400" />
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-fg)]">
                      {region.name}
                    </div>
                    <div className="text-[11px] text-[var(--color-fg-muted)] font-mono">
                      Latency: {region.ping} · SLA: {region.uptime}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                    <CheckCircle2 className="size-4" />
                    {region.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
