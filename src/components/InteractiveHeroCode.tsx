'use client';

import React, { useState } from 'react';
import { Check, Copy, Play, Cpu, Terminal } from 'lucide-react';

const codeSnippets: Record<string, { label: string; file: string; lang: string; code: string }> = {
  openai_ts: {
    label: 'OpenAI (TS)',
    file: 'lemas_agent.ts',
    lang: 'typescript',
    code: `import OpenAI from "openai";

const lemas = new OpenAI({
  baseURL: "https://lemas-api-production.up.railway.app/v1", // or https://api.lemas.io.vn/v1
  apiKey: process.env.LEMAS_API_KEY,
});

const res = await lemas.chat.completions.create({
  model: "deepseek/deepseek-r1",
  messages: [{ role: "user", content: "Orchestrate autonomous agent task" }],
});

console.log(res.choices[0].message.content);`,
  },
  anthropic_ts: {
    label: 'Anthropic (TS)',
    file: 'lemas_anthropic.ts',
    lang: 'typescript',
    code: `import Anthropic from "@anthropic-ai/sdk";

const lemas = new Anthropic({
  baseURL: "https://lemas-api-production.up.railway.app/v1", // or https://api.lemas.io.vn/v1
  apiKey: process.env.LEMAS_API_KEY,
});

const msg = await lemas.messages.create({
  model: "anthropic/claude-3-7-sonnet",
  max_tokens: 2048,
  messages: [{ role: "user", content: "Optimize token budget pipeline" }],
});`,
  },
  python: {
    label: 'Python SDK',
    file: 'lemas_agent.py',
    lang: 'python',
    code: `from openai import OpenAI
import os

client = OpenAI(
    base_url="https://lemas-api-production.up.railway.app/v1",
    api_key=os.environ.get("LEMAS_API_KEY")
)

response = client.chat.completions.create(
    model="google/gemini-2.0-flash",
    messages=[{"role": "user", "content": "Analyze multimodal stream"}]
)

print(response.choices[0].message.content)`,
  },
  curl: {
    label: 'cURL',
    file: 'request.sh',
    lang: 'bash',
    code: `curl https://lemas-api-production.up.railway.app/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $LEMAS_API_KEY" \\
  -d '{
    "model": "deepseek/deepseek-r1",
    "messages": [{"role": "user", "content": "Ping Lemas.AI Gateway"}]
  }'`,
  },
};

export default function InteractiveHeroCode() {
  const [activeTab, setActiveTab] = useState<string>('openai_ts');
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [latency, setLatency] = useState('12 ms');

  const current = codeSnippets[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    setIsRunning(true);
    const simulatedLatency = Math.floor(Math.random() * 8 + 8);
    setTimeout(() => {
      setLatency(`${simulatedLatency} ms`);
      setIsRunning(false);
    }, 350);
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[#070913] shadow-2xl shadow-cyan-950/20">
      {/* Code Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[var(--color-border)] bg-[#0d1020] px-3 sm:px-4 py-2.5 gap-2">
        {/* Window controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="font-mono text-xs text-slate-400 hidden xs:inline">{current.file}</span>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-[#05060d] p-1 rounded-lg border border-[var(--color-border)] overflow-x-auto max-w-full">
          {Object.entries(codeSnippets).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-mono rounded transition-all shrink-0 cursor-pointer ${
                activeTab === key
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-mono rounded bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/30 transition-all cursor-pointer"
            title="Execute test run"
          >
            <Play className={`size-3 ${isRunning ? 'animate-spin' : 'fill-current'}`} />
            <span>{isRunning ? 'Routing...' : 'Run'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center size-7 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Copy snippet"
          >
            {copied ? <Check className="size-3.5 text-cyan-400" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <pre className="overflow-x-auto p-3.5 sm:p-5 font-mono text-[11px] sm:text-[13px] leading-[1.7] text-slate-200 max-w-full">
        <code>
          {current.code.split('\n').map((line, i) => (
            <div key={i} className="table-row">
              <span className="table-cell select-none pr-3 sm:pr-4 text-right text-xs text-slate-600">
                {i + 1}
              </span>
              <span className="table-cell whitespace-pre font-mono">
                {formatSyntax(line)}
              </span>
            </div>
          ))}
        </code>
      </pre>

      {/* Code Status Footer */}
      <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[#0d1020] px-3 sm:px-4 py-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1.5 text-cyan-400 font-semibold">
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            200 OK
          </span>
          <span className="text-slate-700">·</span>
          <span className="text-slate-400 truncate max-w-[120px] sm:max-w-none">Lemas.AI Gateway</span>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[11px] hidden sm:inline">
            failover: active
          </span>
        </div>
        <span className="text-cyan-400 font-bold">{latency}</span>
      </div>
    </div>
  );
}

function formatSyntax(line: string) {
  if (line.startsWith('import') || line.startsWith('from') || line.startsWith('const') || line.startsWith('let')) {
    return <span className="text-cyan-400 font-medium">{line}</span>;
  }
  if (line.includes('http://') || line.includes('https://') || line.includes('"claude-') || line.includes('"deepseek/')) {
    return <span className="text-purple-300">{line}</span>;
  }
  if (line.startsWith('//') || line.startsWith('#')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }
  return <span>{line}</span>;
}
