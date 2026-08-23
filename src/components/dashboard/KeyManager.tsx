'use client';

import React, { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { useDashboard } from './DashboardContext';
import { createApiKey, revokeApiKey } from '@/lib/api';

export default function KeyManager() {
  const { keys, setKeys, t } = useDashboard();
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyLimit, setNewKeyLimit] = useState(50);
  const [creatingKey, setCreatingKey] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    setCreatingKey(true);
    const created = await createApiKey(newKeyName, newKeyLimit);
    if (created) {
      setKeys([...keys, created]);
      setNewKeyName('');
    }
    setCreatingKey(false);
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm(t.revokeConfirm)) return;
    const ok = await revokeApiKey(id);
    if (ok) {
      setKeys(keys.filter((k) => k.id !== id));
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t.keysTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.keysSub}
          </p>
        </div>
      </div>

      {/* Create Key Form */}
      <form
        onSubmit={handleCreateKey}
        className="p-6 rounded-2xl border border-white/[0.08] bg-[#0e111a] flex flex-col sm:flex-row gap-3 items-end"
      >
        <div className="flex-1 space-y-1.5 w-full">
          <label className="text-xs font-semibold text-slate-300">
            {t.keyNamePlaceholder}
          </label>
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Agent-Production-Node-01"
            className="w-full h-10 px-3.5 rounded-xl border border-white/[0.08] bg-[#0a0c12] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
          />
        </div>

        <div className="w-full sm:w-40 space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            {t.spendLimit}
          </label>
          <input
            type="number"
            value={newKeyLimit}
            onChange={(e) => setNewKeyLimit(Number(e.target.value))}
            className="w-full h-10 px-3.5 rounded-xl border border-white/[0.08] bg-[#0a0c12] text-xs text-white focus:outline-none focus:border-cyan-500/40"
          />
        </div>

        <button
          type="submit"
          disabled={creatingKey || !newKeyName}
          className="w-full sm:w-auto h-10 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40 shadow-lg shadow-emerald-950/40"
        >
          <Plus className="size-4" />
          <span>{creatingKey ? 'Creating...' : t.createKeyBtn}</span>
        </button>
      </form>

      {/* Keys List */}
      <div className="space-y-3">
        {keys.map((k) => (
          <div
            key={k.id}
            className="p-4 rounded-2xl border border-white/[0.08] bg-[#0e111a] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{k.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                  {k.status}
                </span>
              </div>
              <div className="font-mono text-xs text-cyan-300">
                {visibleKeys[k.id] ? k.key : k.key.slice(0, 10) + '••••••••' + k.key.slice(-4)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setVisibleKeys({
                    ...visibleKeys,
                    [k.id]: !visibleKeys[k.id],
                  })
                }
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                title={t.toggleKeyVisibility}
              >
                {visibleKeys[k.id] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(k.id, k.key)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs text-white hover:border-emerald-400 transition-colors"
              >
                {copiedKeyId === k.id ? (
                  <Check className="size-3.5 text-emerald-400" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>{copiedKeyId === k.id ? t.copied : t.copyKey}</span>
              </button>
              <button
                type="button"
                onClick={() => handleRevokeKey(k.id)}
                className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Revoke key"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
