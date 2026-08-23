'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Zap,
  Sparkles,
  ArrowUpRight,
  SlidersHorizontal,
  Bot,
  CheckCircle2,
  X,
  Play,
  Send,
  Cpu,
} from 'lucide-react';
import { ModelItem, getModels, testChatCompletion } from '@/lib/api';

const providersList = [
  'All',
  'Free Tier',
  'DeepSeek',
  'Anthropic',
  'OpenAI',
  'Google',
  'xAI',
  'Qwen',
  'Mistral AI',
];

export default function ModelCatalog() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Test Model Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [activeTestModel, setActiveTestModel] = useState<ModelItem | null>(null);
  const [testPrompt, setTestPrompt] = useState('Explain how Lemas.AI router optimizes token costs.');
  const [testResponse, setTestResponse] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const isFree = selectedProvider === 'Free Tier';
      const prov = isFree || selectedProvider === 'All' ? '' : selectedProvider;
      const data = await getModels(searchQuery, prov, isFree);
      setModels(data);
      setLoading(false);
    }
    load();
  }, [selectedProvider, searchQuery]);

  const handleOpenTest = (m: ModelItem) => {
    setActiveTestModel(m);
    setTestPrompt(`Hello ${m.name}! What are your top strengths and agentic reasoning capabilities?`);
    setTestResponse('');
    setTestModalOpen(true);
  };

  const handleRunTest = async () => {
    if (!activeTestModel) return;
    setTestLoading(true);
    setTestResponse('');
    try {
      const res = await testChatCompletion(
        'lemas-live-demo-key-88888888',
        activeTestModel.id,
        testPrompt
      );
      if (res.choices && res.choices[0]) {
        setTestResponse(res.choices[0].message.content);
      } else if (res.error) {
        setTestResponse(`Error: ${res.error.message || JSON.stringify(res.error)}`);
      } else {
        setTestResponse(JSON.stringify(res, null, 2));
      }
    } catch (err: any) {
      setTestResponse(`Request failed: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <section id="models" className="py-24 border-t border-[var(--color-border)] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-4">
            <Cpu className="size-3.5" />
            Lemas.AI Model Matrix
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-fg)]">
            Every frontier LLM, one single endpoint.
          </h2>
          <p className="mt-3 text-base text-[var(--color-fg-muted)]">
            Route across OpenAI, Claude, DeepSeek and Gemini with automatic failover and volume discount rates.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="space-y-4 mb-8">
          {/* Search Box */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--color-fg-subtle)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 200+ models (e.g. claude-3-7, deepseek-r1, gpt-4o, gemini-2.0)..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[var(--color-border)] bg-[var(--bg-card)] text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-subtle)] focus:border-cyan-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Provider Pills */}
          <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
            {providersList.map((p) => {
              const active = selectedProvider === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedProvider(p)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                    active
                      ? 'border-cyan-500 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold shadow-md shadow-cyan-500/20'
                      : 'border-[var(--color-border)] bg-[var(--bg-card)] text-[var(--color-fg-muted)] hover:border-cyan-500/40 hover:text-[var(--color-fg)]'
                  }`}
                >
                  {p === 'Free Tier' && <span className="mr-1">🎁</span>}
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-sm text-[var(--color-fg-muted)]">
            Loading models catalog...
          </div>
        ) : models.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--bg-card)]">
            <Bot className="size-10 text-[var(--color-fg-subtle)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--color-fg)]">No models found matching your query</p>
            <p className="text-xs text-[var(--color-fg-muted)] mt-1">Try searching for Claude, DeepSeek, or OpenAI</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {models.map((m) => (
              <div
                key={m.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--bg-card)] p-5 hover:border-cyan-500/50 hover:bg-[var(--bg-card-hover)] transition-all hover:shadow-xl hover:shadow-cyan-950/20"
              >
                <div>
                  {/* Top Bar: Provider & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      <span className="size-1.5 rounded-full bg-cyan-400" />
                      {m.provider}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {m.is_free && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Free Tier
                        </span>
                      )}
                      {m.discount && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          {m.discount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Model Name & ID */}
                  <h3 className="text-base font-bold text-[var(--color-fg)] group-hover:text-cyan-400 transition-colors">
                    {m.name}
                  </h3>
                  <p className="font-mono text-xs text-[var(--color-fg-subtle)] mt-0.5">
                    {m.id}
                  </p>

                  <p className="text-xs text-[var(--color-fg-muted)] mt-3 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[var(--bg-elevated)] text-cyan-300">
                      {m.context_length} Context
                    </span>
                    {m.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] rounded-md bg-[var(--bg-elevated)] text-[var(--color-fg-subtle)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Pricing & Action */}
                <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-[var(--color-fg-subtle)]">Lemas.AI Rate</div>
                    <div className="text-xs font-semibold text-cyan-400">
                      In: {m.input_price} · Out: {m.output_price}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenTest(m)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-xs font-medium text-[var(--color-fg)] hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                  >
                    <Play className="size-3 fill-current text-cyan-400" />
                    <span>Test</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Test Modal */}
      {testModalOpen && activeTestModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-xl rounded-3xl border border-[var(--color-border-strong)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--color-fg)]">
                  Live Router Test: {activeTestModel.name}
                </h3>
                <p className="font-mono text-xs text-[var(--color-fg-subtle)]">
                  {activeTestModel.id} · Connected via Lemas.AI Router
                </p>
              </div>
              <button
                onClick={() => setTestModalOpen(false)}
                className="p-1 rounded-lg text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-fg-muted)]">Agent Prompt</label>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--bg-elevated)] text-xs font-mono text-[var(--color-fg)] focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRunTest}
                disabled={testLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-cyan-500/20"
              >
                <Send className="size-3.5" />
                {testLoading ? 'Routing Query...' : 'Send Completion Request'}
              </button>
            </div>

            {/* Live Response Box */}
            {testResponse && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
                  <span className="font-semibold text-cyan-400">Response (via Lemas.AI /v1/chat/completions)</span>
                  <span className="font-mono text-[10px]">Latency: ~12ms</span>
                </div>
                <div className="p-3.5 rounded-2xl border border-[#1b223d] bg-[#070913] text-xs font-mono text-cyan-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {testResponse}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
