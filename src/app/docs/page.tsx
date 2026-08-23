'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Copy, Check, Terminal, Code2, ArrowRight, Cpu } from 'lucide-react';

export default function DocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="py-16 relative">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <Cpu className="size-3.5" />
            Lemas.AI Gateway Docs
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--color-fg)]">
            Universal AI Gateway Integration Guide
          </h1>
          <p className="text-base text-[var(--color-fg-muted)]">
            Connect any AI Agent, LLM library, or backend to 200+ models with 100% standard OpenAI and Anthropic SDK
            compatibility.
          </p>
        </div>

        {/* Quickstart card */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)] p-8 space-y-6 shadow-xl">
          <h2 className="text-xl font-bold text-[var(--color-fg)] flex items-center gap-2">
            <Terminal className="size-5 text-cyan-400" />
            1. Gateway Base URL & Authentication
          </h2>
          <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">
            Configure your client to point to the Lemas.AI gateway endpoint. Set your bearer token to
            your generated Lemas.AI API key.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-elevated)] space-y-1">
              <span className="text-[11px] font-bold uppercase text-cyan-400">
                Gateway Base URL
              </span>
              <div className="font-mono text-xs font-semibold text-cyan-300">
                https://api.lemas.io.vn/v1
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-elevated)] space-y-1">
              <span className="text-[11px] font-bold uppercase text-indigo-400">
                API Key Pattern
              </span>
              <div className="font-mono text-xs font-semibold text-indigo-300">
                lemas_sk_live_xxxxxxxxxxxxxxxxxxxxxxxx
              </div>
            </div>
          </div>
        </div>

        {/* OpenAI SDK Integration */}
        <div id="openai" className="rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)] p-8 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--color-fg)]">
              2. OpenAI SDK Quickstart (Node.js / TypeScript)
            </h2>
            <button
              onClick={() =>
                handleCopy(
                  'openai-node',
                  `import OpenAI from "openai";\n\nconst lemas = new OpenAI({\n  baseURL: "https://api.lemas.io.vn/v1",\n  apiKey: process.env.LEMAS_API_KEY,\n});\n\nconst res = await lemas.chat.completions.create({\n  model: "deepseek/deepseek-r1",\n  messages: [{ role: "user", content: "Hello Lemas.AI!" }],\n});`
                )
              }
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-white"
            >
              {copiedId === 'openai-node' ? <Check className="size-3.5 text-cyan-400" /> : <Copy className="size-3.5" />}
              <span>Copy</span>
            </button>
          </div>

          <pre className="overflow-x-auto p-4 rounded-2xl border border-[#1b223d] bg-[#070913] font-mono text-xs text-slate-200 leading-relaxed">
{`import OpenAI from "openai";

const lemas = new OpenAI({
  baseURL: "https://api.lemas.io.vn/v1",
  apiKey: process.env.LEMAS_API_KEY,
});

const response = await lemas.chat.completions.create({
  model: "deepseek/deepseek-r1", // or "anthropic/claude-3-7-sonnet", "openai/gpt-4o"
  messages: [
    { role: "system", content: "You are an autonomous coding agent." },
    { role: "user", content: "Implement a low-latency cache in Go." },
  ],
});

console.log(response.choices[0].message.content);`}
          </pre>
        </div>

        {/* Anthropic SDK Integration */}
        <div id="anthropic" className="rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)] p-8 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--color-fg)]">
              3. Anthropic Messages SDK Integration
            </h2>
            <button
              onClick={() =>
                handleCopy(
                  'anthropic-sdk',
                  `import Anthropic from "@anthropic-ai/sdk";\n\nconst lemas = new Anthropic({\n  baseURL: "https://api.lemas.io.vn/v1",\n  apiKey: process.env.LEMAS_API_KEY,\n});`
                )
              }
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-white"
            >
              {copiedId === 'anthropic-sdk' ? <Check className="size-3.5 text-cyan-400" /> : <Copy className="size-3.5" />}
              <span>Copy</span>
            </button>
          </div>

          <pre className="overflow-x-auto p-4 rounded-2xl border border-[#1b223d] bg-[#070913] font-mono text-xs text-slate-200 leading-relaxed">
{`import Anthropic from "@anthropic-ai/sdk";

const lemas = new Anthropic({
  baseURL: "https://api.lemas.io.vn/v1",
  apiKey: process.env.LEMAS_API_KEY,
});

const message = await lemas.messages.create({
  model: "claude-3-7-sonnet",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Design agent multi-step workflow." }],
});

console.log(message.content[0].text);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
