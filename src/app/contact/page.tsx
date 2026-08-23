'use client';

import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, MessageSquare, ArrowUpRight, Cpu } from 'lucide-react';
import { submitContact } from '@/lib/api';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      setError('Please provide your email and message.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await submitContact(name, email, subject, message);
      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.error || 'Failed to send message.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 relative">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left info */}
          <div className="lg:col-span-5 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <Mail className="size-3.5" />
              Lemas.AI Engineering
            </span>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-fg)]">
              Connect with the Lemas.AI Engineering Team
            </h1>

            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
              Have questions regarding custom dedicated model routing, enterprise throughput contracts,
              or integration advice? We respond promptly in both English and Vietnamese.
            </p>

            <div className="space-y-4 pt-4">
              <a
                href="https://t.me/lemasai"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-4 rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)] hover:border-cyan-500/50 hover:bg-[var(--bg-card-hover)] transition-all group shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                    <MessageSquare className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-fg)]">Telegram Community & Support</h4>
                    <p className="text-xs text-[var(--color-fg-muted)]">Live engineering assistance</p>
                  </div>
                </div>
                <ArrowUpRight className="size-4 text-[var(--color-fg-subtle)] group-hover:text-cyan-400" />
              </a>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--bg-card)] p-8 shadow-2xl">
              {submitted ? (
                <div className="py-12 text-center space-y-3">
                  <CheckCircle2 className="size-12 text-cyan-400 mx-auto" />
                  <h3 className="text-xl font-bold text-[var(--color-fg)]">Message Dispatched!</h3>
                  <p className="text-xs text-[var(--color-fg-muted)] max-w-sm mx-auto">
                    Thank you. Our solutions team will follow up directly at{' '}
                    <span className="font-semibold text-[var(--color-fg)]">{email}</span>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-[var(--color-fg)] block mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Nguyen"
                      className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--bg-elevated)] text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-subtle)] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--color-fg)] block mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--bg-elevated)] text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-subtle)] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--color-fg)] block mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enterprise AI Agent Routing / Custom Volumes"
                      className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--bg-elevated)] text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-subtle)] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--color-fg)] block mb-1.5">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your agent architecture, model requirements or questions..."
                      className="w-full p-4 rounded-xl border border-[var(--color-border)] bg-[var(--bg-elevated)] text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-subtle)] focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50 transition-all shadow-md shadow-cyan-500/20"
                  >
                    <Send className="size-4" />
                    <span>{loading ? 'Transmitting...' : 'Send Inquiry'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
