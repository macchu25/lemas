'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useDashboard } from './DashboardContext';
import { testChatCompletion } from '@/lib/api';
import { speakGoogleVoice, stopSpeaking } from '@/lib/voice';
import MarkdownRenderer from './MarkdownRenderer';

export default function ChatPlayground() {
  const { keys, lang, t, refreshData } = useDashboard();
  const [chatModel, setChatModel] = useState('lemas-1.0');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  // Voice States (Default: OFF / Tắt)
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isSpeakingIndex, setIsSpeakingIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const getModelLabel = (modelId: string) => {
    if (modelId === 'lemas-1.0' || modelId.includes('deepseek-v4') || modelId.includes('lemas')) return 'Lemas 1.0 (Flagship)';
    if (modelId.includes('deepseek-r1') || modelId.includes('r1')) return 'Lemas 1.0 Thinking';
    if (modelId.includes('claude')) return 'Lemas 1.0 Pro';
    if (modelId.includes('gpt-4o') || modelId.includes('openai')) return 'Lemas 1.0 Omni';
    if (modelId.includes('gemini')) return 'Lemas 1.0 Flash';
    return 'Lemas 1.0';
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

    const activeKey = keys.find((k) => k.status === 'active')?.key || 'lemas-live-demo-key-88888888';
    try {
      const res = await testChatCompletion(activeKey, chatModel, userMsg);
      const assistantText =
        res.choices && res.choices[0]
          ? res.choices[0].message.content
          : 'Đã nhận phản hồi từ Lemas.AI Gateway.';

      const updated = [...newHistory, { role: 'assistant' as const, content: assistantText }];
      setChatMessages(updated);

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
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-white px-1">
            <span>{t.conversations}</span>
            <button
              onClick={() => {
                stopSpeaking();
                setIsSpeakingIndex(null);
                setChatMessages([]);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] cursor-pointer"
              title={t.newChat}
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder={t.searchChat}
              className="w-full h-8 pl-3 pr-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1 pt-1">
            <button
              onClick={() => {
                stopSpeaking();
                setIsSpeakingIndex(null);
                setChatMessages([]);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-left cursor-pointer"
            >
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="truncate">Cuộc trò chuyện mới</span>
            </button>
          </div>
        </div>

        {/* Voice Feature Status Card in Sidebar */}
        <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 space-y-2">
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
            <select
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
              className="bg-[#121520] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-cyan-500/40"
            >
              <option value="lemas-1.0">Lemas 1.0 (Default Flagship)</option>
              <option value="deepseek/deepseek-r1">Lemas 1.0 Thinking (Reasoning R1)</option>
              <option value="anthropic/claude-3.7-sonnet">Lemas 1.0 Pro (Claude 3.7)</option>
              <option value="openai/gpt-4o">Lemas 1.0 Omni (GPT-4o)</option>
              <option value="google/gemini-2.5-flash">Lemas 1.0 Flash (Gemini 2.5)</option>
            </select>
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

              {/* 6 Suggestion Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full text-left pt-2">
                {t.prompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      const newHistory = [{ role: 'user' as const, content: promptText }];
                      setChatMessages(newHistory);
                      setChatSending(true);
                      const activeKey =
                        keys.find((k) => k.status === 'active')?.key ||
                        'lemas-live-demo-key-88888888';
                      try {
                        const res = await testChatCompletion(activeKey, chatModel, promptText);
                        const assistantText =
                          res.choices && res.choices[0]
                            ? res.choices[0].message.content
                            : 'Đã nhận yêu cầu.';
                        const updated = [
                          ...newHistory,
                          { role: 'assistant' as const, content: assistantText },
                        ];
                        setChatMessages(updated);

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
          <div className="w-full space-y-2">
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

              <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono font-medium">
                  <Sparkles className="size-3 text-cyan-400" />
                  <span>{getModelLabel(chatModel)}</span>
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
