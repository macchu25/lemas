'use client';

// Clean text for speech synthesis (strip code blocks, links, markdown syntax)
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Replace fenced code blocks with descriptive short text
    .replace(/```[\s\S]*?```/g, ' .Xem đoạn mã bên dưới. ')
    // Replace inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown headers
    .replace(/#{1,6}\s+/g, '')
    // Remove bold/italic markers
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bullet points
    .replace(/^\s*[-*+]\s+/gm, '')
    // Remove blockquote markers
    .replace(/^\s*>\s+/gm, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Collapse multiple whitespaces / newlines
    .replace(/\s+/g, ' ')
    .trim();
}

let activeAudio: HTMLAudioElement | null = null;

// Dual-Engine Speech Playback:
// 1. Genuine Google Voice Audio Stream via Backend Proxy (100% Reliable & Crystal Clear)
// 2. Native Web Speech API Fallback
export function speakGoogleVoice(
  text: string,
  lang: 'vi' | 'en' | 'zh' = 'vi',
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined') return false;

  stopSpeaking();

  const clean = cleanTextForSpeech(text);
  if (!clean) return false;

  // Split into manageable sentence chunks (<=180 chars) for smooth streaming
  const chunks = splitIntoChunks(clean, 180);
  if (chunks.length === 0) return false;

  let currentChunk = 0;
  if (onStart) onStart();

  const playNextChunk = () => {
    if (currentChunk >= chunks.length) {
      if (onEnd) onEnd();
      return;
    }

    const chunkText = chunks[currentChunk];
    currentChunk++;

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const audioUrl = `${API_BASE}/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(chunkText)}`;
    const audio = new Audio(audioUrl);
    activeAudio = audio;

    audio.onended = () => {
      playNextChunk();
    };

    audio.onerror = (e) => {
      console.warn('Backend TTS audio error, falling back to Web Speech API:', e);
      fallbackWebSpeech(chunkText, lang, () => playNextChunk(), onEnd);
    };

    audio.play().catch((err) => {
      console.warn('Audio play auto-policy warning, fallback Web Speech:', err);
      fallbackWebSpeech(chunkText, lang, () => playNextChunk(), onEnd);
    });
  };

  playNextChunk();
  return true;
}

// Fallback to Native Web Speech API
function fallbackWebSpeech(
  text: string,
  lang: string,
  onNext: () => void,
  onEnd?: () => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = lang === 'vi' ? 'vi-VN' : lang === 'zh' ? 'zh-CN' : 'en-US';
    utterance.lang = targetLang;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.toLowerCase())) ||
      voices.find((v) => v.lang.toLowerCase().includes(lang));
    if (voice) utterance.voice = voice;

    utterance.onend = () => onNext();
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    if (onEnd) onEnd();
  }
}

// Helper to chunk text nicely by punctuation or word boundaries
function splitIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const sentences = text.split(/(?<=[.?!,;\n])\s+/);
  const chunks: string[] = [];
  let cur = '';

  for (const s of sentences) {
    if ((cur + ' ' + s).length > maxLen) {
      if (cur) chunks.push(cur.trim());
      cur = s;
    } else {
      cur = cur ? cur + ' ' + s : s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());

  return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined') {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
