'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardContext';

export default function DashboardModelsPage() {
  const { models, t } = useDashboard();
  const [modelSearch, setModelSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('all');

  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.provider.toLowerCase().includes(modelSearch.toLowerCase());
    const matchesFilter =
      modelFilter === 'all' ||
      (modelFilter === 'free' && m.is_free) ||
      m.provider.toLowerCase().includes(modelFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full w-full rounded-2xl border border-white/[0.08] overflow-y-auto bg-[#0a0c12] shadow-2xl p-3 sm:p-5 lg:p-6 relative">
      <div className="space-y-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {t.modelsTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {t.modelsSub}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder={t.searchModels}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-white/[0.08] bg-[#0e111a] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
              />
            </div>

            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="bg-[#0e111a] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">{t.allProviders}</option>
              <option value="deepseek">DeepSeek</option>
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="google">Google</option>
              <option value="free">{t.freeTierFilter}</option>
            </select>
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((m) => (
            <div
              key={m.id}
              className="p-5 rounded-2xl border border-white/[0.08] bg-[#0e111a] hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-cyan-400" />
                    <span className="font-bold text-sm text-white">{m.name}</span>
                  </div>
                  {m.is_free ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      FREE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400">
                      {m.discount || 'Save 60%'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {m.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Lemas Price (In / Out)</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {m.input_price} / {m.output_price}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block">Context</span>
                  <span className="font-mono text-slate-300">{m.context_length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
