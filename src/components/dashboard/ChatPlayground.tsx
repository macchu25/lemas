'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Bot,
  Plus,
  ChevronRight,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Play,
  Wallet,
  Zap,
  ArrowRight,
  SlidersHorizontal,
  X,
  Trash2,
} from 'lucide-react';
import { useDashboard } from './DashboardContext';
import {
  testChatCompletion,
  getModels,
  getConversations,
  getConversation,
  saveConversation,
  deleteConversation,
  ChatConversation,
} from '@/lib/api';
import { speakGoogleVoice, stopSpeaking } from '@/lib/voice';
import MarkdownRenderer from './MarkdownRenderer';

export interface ChatModelOption {
  id: string;
  name: string;
  isCustom?: boolean;
}

const DEFAULT_CHAT_MODELS: ChatModelOption[] = [
  { id: 'lemas-1.0', name: '⚡ Lemas 1.0 (Flagship Flash)' },
  { id: 'deepseek/deepseek-r1', name: '🧠 DeepSeek R1 (Lý Luận / Thinking)' },
  { id: 'deepseek/deepseek-chat', name: '💬 DeepSeek V3 (Chat Chính Thức)' },
  { id: 'openai/gpt-4o', name: '🌟 OpenAI GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: '⚡ OpenAI GPT-4o Mini' },
  { id: 'anthropic/claude-3.7-sonnet', name: '🎭 Claude 3.7 Sonnet (Anthropic)' },
  { id: 'google/gemini-2.5-flash', name: '⚡ Google Gemini 2.5 Flash' },
  { id: 'llama-3.3-70b-versatile', name: '🦙 Meta Llama 3.3 70B' },
  { id: 'qwen/qwen3.7-plus', name: '🚀 Qwen 3.7 Plus (Alibaba)' },
];

export default function ChatPlayground() {
  const { user, keys, lang, t, refreshData } = useDashboard();
  const [chatModel, setChatModel] = useState('lemas-1.0');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  // Conversations History State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [searchConvQuery, setSearchConvQuery] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Custom Model Management State
  const [customModels, setCustomModels] = useState<ChatModelOption[]>([]);
  const [apiModels, setApiModels] = useState<ChatModelOption[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputText, setCustomInputText] = useState('');

  // Voice States (Default: OFF / Tắt)
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isSpeakingIndex, setIsSpeakingIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Load custom models from localStorage & models from API
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lemas_custom_chat_models');
      if (saved) {
        setCustomModels(JSON.parse(saved));
      }
    } catch {}

    // Load additional models from API catalog
    getModels().then((data) => {
      if (data && data.length > 0) {
        const mapped: ChatModelOption[] = data
          .filter((m) => !DEFAULT_CHAT_MODELS.some((dm) => dm.id === m.id))
          .map((m) => ({
            id: m.id,
            name: `✨ ${m.name} (${m.provider})`,
          }));
        setApiModels(mapped);
      }
    }).catch(() => {});
  }, []);

  // Load User Saved Conversations from DB
  const loadConversationsList = async () => {
    try {
      setLoadingConversations(true);
      const data = await getConversations();
      setConversations(data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversationsList();
  }, []);

  const handleNewChat = () => {
    stopSpeaking();
    setIsSpeakingIndex(null);
    setActiveConvId(null);
    setChatMessages([]);
  };

  const handleSelectConversation = async (convId: string) => {
    stopSpeaking();
    setIsSpeakingIndex(null);
    try {
      const conv = await getConversation(convId);
      if (conv) {
        setActiveConvId(conv.id);
        if (conv.model) {
          setChatModel(conv.model);
        }
        setChatMessages(
          (conv.messages || []).map((m) => ({
            role: m.role,
            content: m.content,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!confirm(lang === 'vi' ? 'Bạn có chắc muốn xóa cuộc trò chuyện này?' : 'Are you sure you want to delete this conversation?')) {
      return;
    }
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const persistConversation = async (
    messagesToSave: Array<{ role: 'user' | 'assistant'; content: string }>,
    modelToUse: string
  ) => {
    try {
      const saved = await saveConversation({
        id: activeConvId || undefined,
        model: modelToUse,
        messages: messagesToSave.map((m, idx) => ({
          id: `msg-${Date.now()}-${idx}`,
          role: m.role,
          content: m.content,
          timestamp: new Date().toISOString(),
        })),
      });
      if (saved && saved.id) {
        setActiveConvId(saved.id);
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === saved.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = saved;
            return updated;
          }
          return [saved, ...prev];
        });
      }
    } catch (err) {
      console.error('Failed to persist conversation:', err);
    }
  };

  const handleApplyCustomModel = () => {
    const trimmed = customInputText.trim();
    if (!trimmed) {
      setShowCustomInput(false);
      return;
    }

    const allCurrent = [...customModels, ...apiModels, ...DEFAULT_CHAT_MODELS];
    const exists = allCurrent.find(
      (m) => m.id.toLowerCase() === trimmed.toLowerCase()
    );

    if (!exists) {
      const newModel: ChatModelOption = {
        id: trimmed,
        name: `⚙️ ${trimmed} (Tùy Chỉnh)`,
        isCustom: true,
      };
      const updated = [newModel, ...customModels];
      setCustomModels(updated);
      try {
        localStorage.setItem('lemas_custom_chat_models', JSON.stringify(updated));
      } catch {}
    }

    setChatModel(trimmed);
    setCustomInputText('');
    setShowCustomInput(false);
  };

  const handleRemoveCustomModel = (e: React.MouseEvent, modelId: string) => {
    e.stopPropagation();
    const updated = customModels.filter((m) => m.id !== modelId);
    setCustomModels(updated);
    try {
      localStorage.setItem('lemas_custom_chat_models', JSON.stringify(updated));
    } catch {}
    if (chatModel === modelId) {
      setChatModel('lemas-1.0');
    }
  };

  const availableModels = [...customModels, ...DEFAULT_CHAT_MODELS, ...apiModels];

  const getModelLabel = (modelId: string) => {
    const found = availableModels.find((m) => m.id === modelId);
    if (found) return found.name.replace(/^[^\s]+\s/, '');
    if (modelId === 'lemas-1.0' || modelId.includes('deepseek-v4') || modelId.includes('lemas')) return 'Lemas 1.0 (Flagship)';
    if (modelId.includes('deepseek-r1') || modelId.includes('r1')) return 'DeepSeek R1 Thinking';
    if (modelId.includes('claude')) return 'Claude 3.7 Pro';
    if (modelId.includes('gpt-4o') || modelId.includes('openai')) return 'OpenAI GPT-4o';
    if (modelId.includes('gemini')) return 'Gemini 2.5 Flash';
    return modelId;
  };

  // Initialize Speech Recognition (Speech to Text)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = lang === 'vi' ? 'vi-VN' : lang === 'zh' ? 'zh-CN' : 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setChatInput(transcript);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      stopSpeaking();
    };
  }, [lang]);

  // Toggle Microphone
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(lang === 'vi' ? 'Trình duyệt chưa hỗ trợ giọng nói. Hãy dùng Chrome hoặc Edge.' : lang === 'zh' ? '浏览器不支持语音识别，请使用 Chrome 或 Edge。' : 'Browser does not support speech recognition. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      setIsSpeakingIndex(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Play Speech for Specific Message
  const playSpeech = (text: string, index: number) => {
    if (isSpeakingIndex === index) {
      stopSpeaking();
      setIsSpeakingIndex(null);
      return;
    }

    setIsSpeakingIndex(index);
    speakGoogleVoice(
      text,
      lang,
      () => setIsSpeakingIndex(index),
      () => setIsSpeakingIndex(null)
    );
  };

  // Handle Send Chat
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatSending) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    stopSpeaking();
    setIsSpeakingIndex(null);

    const newHistory = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newHistory);
    setChatSending(true);

    const activeKey = keys.find((k) => k.status === 'active')?.key || keys[0]?.key || '';
    try {
      const res = await testChatCompletion(activeKey, chatModel, userMsg);
      let assistantText = 'Đã nhận phản hồi từ Lemas.AI Gateway.';
      if (res && res.choices && res.choices[0] && res.choices[0].message) {
        assistantText = res.choices[0].message.content;
      } else if (res && res.error) {
        assistantText = typeof res.error === 'object' ? (res.error.message || JSON.stringify(res.error)) : String(res.error);
      }

      const updated = [...newHistory, { role: 'assistant' as const, content: assistantText }];
      setChatMessages(updated);

      // Persist Conversation to Server
      persistConversation(updated, chatModel);

      // Auto Speak Response using Chị Google Voice
      if (autoSpeak) {
        const lastIdx = updated.length - 1;
        setIsSpeakingIndex(lastIdx);
        speakGoogleVoice(
          assistantText,
          lang,
          () => setIsSpeakingIndex(lastIdx),
          () => setIsSpeakingIndex(null)
        );
      }

      await refreshData();
    } catch {
      const errorMsg = 'Không thể kết nối đến Gateway. Vui lòng thử lại.';
      setChatMessages([...newHistory, { role: 'assistant', content: errorMsg }]);
    } finally {
      setChatSending(false);
    }
  };

  return (
    <div className="h-full w-full flex rounded-2xl border border-white/[0.08] overflow-hidden bg-[#0a0c12] shadow-2xl relative">
      {/* Chat Sub-Sidebar */}
      <div className="w-64 border-r border-white/[0.08] bg-[#0c0e16] p-3.5 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between text-xs font-bold text-white px-1 shrink-0">
            <span className="flex items-center gap-1.5">
              <span>{t.conversations || 'Đoạn chat'}</span>
              <span className="text-[10px] text-slate-500 font-mono">({conversations.length})</span>
            </span>
            <button
              onClick={handleNewChat}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors"
              title={t.newChat || 'Cuộc trò chuyện mới'}
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="relative shrink-0">
            <input
              type="text"
              value={searchConvQuery}
              onChange={(e) => setSearchConvQuery(e.target.value)}
              placeholder={t.searchChat || 'Tìm kiếm...'}
              className="w-full h-8 pl-3 pr-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
            />
          </div>

          <div className="shrink-0 pt-1">
            <button
              onClick={handleNewChat}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left cursor-pointer transition-all ${
                !activeConvId
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <span className={`size-2 rounded-full ${!activeConvId ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className="truncate">{t.newChat || 'Cuộc trò chuyện mới'}</span>
            </button>
          </div>

          {/* Conversations History List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar min-h-0">
            {loadingConversations ? (
              <div className="text-center py-6 text-[11px] text-slate-500 font-mono animate-pulse">
                Đang tải lịch sử...
              </div>
            ) : conversations.filter((c) => (c.title || '').toLowerCase().includes(searchConvQuery.toLowerCase())).length === 0 ? (
              <div className="text-center py-6 text-[11px] text-slate-500">
                {searchConvQuery ? 'Không tìm thấy kết quả' : 'Chưa có hội thoại nào'}
              </div>
            ) : (
              conversations
                .filter((c) => (c.title || '').toLowerCase().includes(searchConvQuery.toLowerCase()))
                .map((conv) => {
                  const isActive = activeConvId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all border ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm'
                          : 'border-transparent hover:bg-white/[0.04] text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 flex-1 pr-2">
                        <span className="truncate font-medium text-[11.5px]">{conv.title || 'Cuộc trò chuyện'}</span>
                        <span className="text-[9.5px] text-slate-500 truncate">
                          {new Date(conv.updated_at).toLocaleDateString('vi-VN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition-opacity rounded"
                        title="Xóa đoạn chat"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Voice Feature Status Card in Sidebar */}
        <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 space-y-2 mt-3 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
            <div className="flex items-center gap-1.5">
              <Volume2 className="size-3.5 text-cyan-400" />
              <span>{t.voiceAutoSpeak}</span>
            </div>
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            {t.chatGreetingSub}
          </p>
        </div>
      </div>

      {/* Main Chat Center */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#090b10]">
        {/* Chat Header */}
        <div className="h-14 border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between bg-[#0b0e16]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-medium">Model:</span>
            {showCustomInput ? (
              <div className="flex items-center gap-1.5 bg-[#121520] border border-cyan-500/40 rounded-xl px-2.5 py-1 text-xs">
                <input
                  type="text"
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  placeholder="Nhập Model ID..."
                  className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-36 sm:w-48 font-mono"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyCustomModel();
                    if (e.key === 'Escape') setShowCustomInput(false);
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyCustomModel}
                  className="px-2 py-0.5 rounded bg-cyan-500 text-black font-bold text-[10px] cursor-pointer"
                >
                  Dùng
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <select
                  value={chatModel}
                  onChange={(e) => {
                    if (e.target.value === '__custom_input__') {
                      setShowCustomInput(true);
                    } else {
                      setChatModel(e.target.value);
                    }
                  }}
                  className="bg-[#121520] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-cyan-500/40 cursor-pointer max-w-[200px] sm:max-w-[260px] truncate"
                >
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#121520] text-white">
                      {m.name}
                    </option>
                  ))}
                  <option value="__custom_input__" className="bg-[#1a1f30] text-amber-300 font-bold">
                    ✨ + Nhập Model Tùy Chỉnh (Custom ID)...
                  </option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  title="Nhập mã model tùy ý"
                >
                  <SlidersHorizontal className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Controls: Auto-Speak Toggle */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (autoSpeak) stopSpeaking();
                setAutoSpeak(!autoSpeak);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                autoSpeak
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300 shadow-md shadow-emerald-950/30'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white'
              }`}
              title={autoSpeak ? t.voiceAutoSpeakOn : t.voiceAutoSpeakOff}
            >
              {autoSpeak ? (
                <>
                  <Volume2 className="size-3.5 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">{t.voiceAutoSpeakOn}</span>
                  <span className="sm:hidden">ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="size-3.5" />
                  <span className="hidden sm:inline">{t.voiceAutoSpeakOff}</span>
                  <span className="sm:hidden">OFF</span>
                </>
              )}
            </button>

            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono hidden md:inline-block">
              Lemas 1.0 Active
            </span>
          </div>
        </div>

        {/* Central Chat Message View */}
        <div className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto">
          {chatMessages.length === 0 ? (
            /* Empty State with 6 Prompt Suggestion Cards */
            <div className="h-full flex flex-col justify-center items-center w-full text-center space-y-6 py-4">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 shadow-lg shadow-emerald-950/40">
                <Sparkles className="size-7" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {t.chatGreetingTitle}
                </h2>
                <p className="text-xs text-slate-400">
                  {t.chatGreetingSub}
                </p>
              </div>

              {/* 6 Suggestion Grid Cards (Hidden on mobile) */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full text-left pt-2">
                {t.prompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      const newHistory = [{ role: 'user' as const, content: promptText }];
                      setChatMessages(newHistory);
                      setChatSending(true);
                      const activeKey =
                        keys.find((k) => k.status === 'active')?.key || keys[0]?.key || '';
                      try {
                        const res = await testChatCompletion(activeKey, chatModel, promptText);
                        let assistantText = 'Đã nhận yêu cầu.';
                        if (res && res.choices && res.choices[0] && res.choices[0].message) {
                          assistantText = res.choices[0].message.content;
                        } else if (res && res.error) {
                          assistantText = typeof res.error === 'object' ? (res.error.message || JSON.stringify(res.error)) : String(res.error);
                        }
                        const updated = [
                          ...newHistory,
                          { role: 'assistant' as const, content: assistantText },
                        ];
                        setChatMessages(updated);

                        // Persist Conversation
                        persistConversation(updated, chatModel);

                        if (autoSpeak) {
                          const lastIdx = updated.length - 1;
                          setIsSpeakingIndex(lastIdx);
                          speakGoogleVoice(
                            assistantText,
                            lang,
                            () => setIsSpeakingIndex(lastIdx),
                            () => setIsSpeakingIndex(null)
                          );
                        }

                        await refreshData();
                      } catch {
                        setChatMessages([...newHistory, { role: 'assistant', content: 'Đã nhận yêu cầu.' }]);
                      } finally {
                        setChatSending(false);
                      }
                    }}
                    className="p-4 rounded-2xl border border-white/[0.08] bg-[#0e111a] hover:border-cyan-500/30 hover:bg-[#111624] transition-all text-xs sm:text-sm text-slate-300 leading-relaxed group flex items-center justify-between cursor-pointer"
                  >
                    <span>{promptText}</span>
                    <ChevronRight className="size-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Chat Stream */
            <div className="w-full space-y-6 pb-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 sm:gap-4 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="size-9 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center text-black font-extrabold shrink-0 text-xs shadow-lg shadow-emerald-950/40">
                      <Bot className="size-5" />
                    </div>
                  )}

                  {/* Chat Message Bubble */}
                  <div
                    className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[90%] sm:max-w-[85%] ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black font-semibold rounded-br-none shadow-md shadow-emerald-950/30 whitespace-pre-wrap'
                        : 'bg-[#0f121b] border border-white/[0.1] text-slate-100 rounded-bl-none shadow-xl w-full'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div>
                        {/* Assistant Header & Voice Playback Button */}
                        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/5 text-[11px] text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 font-bold p-0.5">
                              <Sparkles className="size-3 text-cyan-400" />
                            </span>
                            <span className="font-bold text-emerald-400 font-mono tracking-wide">
                              Lemas 1.0
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300">
                              AI Engine
                            </span>
                          </div>

                          {/* Voice Read Out Loud Button */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => playSpeech(msg.content, idx)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                                isSpeakingIndex === idx
                                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-sm'
                                  : 'border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
                              }`}
                              title={isSpeakingIndex === idx ? t.voiceStopTooltip : t.voiceReadTooltip}
                            >
                              {isSpeakingIndex === idx ? (
                                <>
                                  <Square className="size-3 text-emerald-400 fill-emerald-400 animate-pulse" />
                                  <span>{t.voiceStopBtn}</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="size-3 text-cyan-400" />
                                  <span>{t.voiceReadBtn}</span>
                                </>
                              )}
                            </button>
                            <span className="text-[10px] text-slate-500 hidden sm:inline">Lemas Gateway</span>
                          </div>
                        </div>

                        {/* Rich Markdown & Code Block */}
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {chatSending && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono py-2 pl-2">
                  <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{t.waitingLemas}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Floating Chat Input Bar */}
        <div className="p-3 sm:p-5 bg-gradient-to-t from-[#08090d] via-[#08090d]/95 to-transparent shrink-0">
          <div className="w-full space-y-2.5">
            {Boolean(
              user &&
              (user.daily_tokens_used || 0) >= (user.daily_tokens_limit || 1000) &&
              (user.gift_tokens || 0) <= 0 &&
              (user.balance || 0) <= 0
            ) && (
              <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-transparent flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-in fade-in">
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <Zap className="size-4 text-amber-400 shrink-0 animate-pulse" />
                  <span>
                    Bạn đã sử dụng hết <strong>1,000 tokens miễn phí</strong> hôm nay. Hãy nâng cấp gói hoặc nạp tiền để tiếp tục trò chuyện!
                  </span>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 text-black text-xs font-bold hover:opacity-90 transition-all shrink-0 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Wallet className="size-3.5" />
                  <span>Nâng cấp / Nạp tiền ngay</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            )}

            <form
              onSubmit={handleSendChat}
              className="relative rounded-2xl border border-white/[0.12] bg-[#0e111a] p-3.5 shadow-2xl focus-within:border-cyan-500/40 transition-colors"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isListening ? `🎤 ${t.voiceListening}` : t.chatInputPlaceholder}
                className={`w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none mb-3 px-1.5 ${
                  isListening ? 'placeholder-emerald-400 animate-pulse' : ''
                }`}
              />

              <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2 flex-wrap sm:flex-nowrap">
                {/* Model Selector directly on Chat Input Bar */}
                <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-md">
                  {showCustomInput ? (
                    <div className="flex items-center gap-1.5 w-full bg-[#121520] border border-cyan-500/40 rounded-xl px-2.5 py-1 text-xs shadow-lg shadow-cyan-950/40">
                      <Sparkles className="size-3.5 text-cyan-400 shrink-0" />
                      <input
                        type="text"
                        value={customInputText}
                        onChange={(e) => setCustomInputText(e.target.value)}
                        placeholder="Nhập Model ID (vd: qwen/qwen3.7-plus, gpt-4.1...)"
                        className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none flex-1 min-w-0 font-mono"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCustomModel();
                          } else if (e.key === 'Escape') {
                            setShowCustomInput(false);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomModel}
                        className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 text-black font-extrabold text-[11px] hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                      >
                        Áp Dụng
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomInput(false)}
                        className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/30 transition-colors">
                      <Sparkles className="size-3.5 text-cyan-400 shrink-0" />
                      <select
                        value={chatModel}
                        onChange={(e) => {
                          if (e.target.value === '__custom_input__') {
                            setShowCustomInput(true);
                          } else {
                            setChatModel(e.target.value);
                          }
                        }}
                        className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1 truncate max-w-[200px] sm:max-w-[260px]"
                        title="Chọn mô hình AI bạn muốn trò chuyện"
                      >
                        {availableModels.map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#121520] text-white">
                            {m.name}
                          </option>
                        ))}
                        <option value="__custom_input__" className="bg-[#1a1f30] text-amber-300 font-bold">
                          ✨ + Nhập Model Tùy Chỉnh (Custom ID)...
                        </option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCustomInput(true)}
                        className="text-slate-400 hover:text-cyan-300 transition-colors p-0.5 cursor-pointer"
                        title="Tự nhập Model ID khác"
                      >
                        <SlidersHorizontal className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Microphone STT Button */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`flex items-center justify-center size-8.5 rounded-xl border transition-all cursor-pointer ${
                      isListening
                        ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-lg shadow-rose-950/50 animate-pulse'
                        : 'border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white hover:border-emerald-400/40'
                    }`}
                    title={isListening ? t.voiceStopBtn : t.voiceAutoSpeak}
                  >
                    {isListening ? <MicOff className="size-4 text-rose-400" /> : <Mic className="size-4" />}
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={chatSending || !chatInput.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black text-xs font-extrabold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-emerald-950/40 cursor-pointer"
                  >
                    <span>{t.sendBtn}</span>
                    <Send className="size-3.5" />
                  </button>
                </div>
              </div>
            </form>

            <div className="text-center text-[10px] text-slate-500">
              {t.disclaimer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
