'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'What is Lemas.AI and how does it work?',
    a: 'Lemas.AI is a unified AI Gateway and token optimization router designed for autonomous agents and developers. By connecting to Lemas.AI once, you get instant access to DeepSeek, Claude 3.7, GPT-4o, Gemini 2.0, and 200+ frontier models through standard OpenAI or Anthropic SDK endpoints.',
  },
  {
    q: 'Is there really a free tier?',
    a: 'Yes! Every new account gets 20+ free models (including DeepSeek R1, DeepSeek V3, Qwen 2.5 Coder, Gemini 2.0 Flash) plus free AI image generation with zero credit card required.',
  },
  {
    q: 'Are you 100% compatible with existing OpenAI & Anthropic SDKs?',
    a: 'Yes, fully drop-in compatible. Simply change your baseURL to https://lemas-api-production.up.railway.app/v1 (or https://api.lemas.io.vn/v1) and pass your Lemas.AI API key. No rewrites or library changes are needed.',
  },
  {
    q: 'How does Lemas.AI offer 50–70% better pricing?',
    a: 'We purchase token pools at enterprise volume rates and route through our ultra-low latency edge nodes. We pass the majority of those volume savings directly to you.',
  },
  {
    q: 'How does multi-provider fallback work?',
    a: 'If any model provider experiences outages or rate limit spikes, Lemas.AI automatically routes your agent requests to healthy replica pools without breaking your execution stream.',
  },
  {
    q: 'Can I use Lemas.AI for commercial production workflows?',
    a: 'Yes. All plans support commercial agent workloads with an enterprise 99.9% uptime SLA.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="py-24 border-t border-[var(--color-border)] relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-4">
            <HelpCircle className="size-3.5" />
            Knowledge Base
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-fg)]">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-[var(--color-fg-muted)]">
            Everything you need to know about Lemas.AI Gateway, token pricing, and SDK setups.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--bg-card)] transition-colors hover:border-cyan-500/40"
              >
                <button
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <span className="text-base font-semibold text-[var(--color-fg)]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`size-5 text-[var(--color-fg-muted)] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-[var(--color-fg-muted)] leading-relaxed border-t border-[var(--color-border)] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
