'use client';

import React, { useState } from 'react';
import { Check, Copy, Terminal, Code2 } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Split into code block chunks and regular markdown chunks
  const parts = parseMarkdownBlocks(content);

  return (
    <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed text-slate-200">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={index}
              language={part.language || 'code'}
              code={part.content}
            />
          );
        }
        return <FormattedText key={index} text={part.content} />;
      })}
    </div>
  );
}

// 1. Code Block with Header Bar, Language Badge & Copy Button
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanLang = language.trim().toLowerCase() || 'text';

  return (
    <div className="my-3 rounded-2xl border border-white/[0.12] bg-[#07090e] overflow-hidden shadow-2xl group">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e121a] border-b border-white/[0.08] select-none">
        <div className="flex items-center gap-2.5">
          {/* macOS 3 dots */}
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500/80" />
            <span className="size-2.5 rounded-full bg-amber-500/80" />
            <span className="size-2.5 rounded-full bg-emerald-500/80" />
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
            <Code2 className="size-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
              {cleanLang}
            </span>
          </div>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[11px] font-medium text-slate-300 hover:text-white transition-all cursor-pointer border border-white/5"
          title="Sao chép toàn bộ code"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-bold">Đã chép!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5 text-slate-400" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area with Syntax Highlighting Look */}
      <div className="p-4 overflow-x-auto font-mono text-xs sm:text-[13px] leading-relaxed text-[#e2e8f0] selection:bg-cyan-500/30 selection:text-cyan-200">
        <pre className="m-0 font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

// 2. Formatted Markdown Text (Headers, Bolds, Inlines, Lists)
function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={lIdx} className="h-1.5" />;
        }

        // H1 Heading
        if (line.startsWith('# ')) {
          return (
            <h1
              key={lIdx}
              className="text-lg sm:text-xl font-black text-white mt-4 mb-2 flex items-center gap-2 border-b border-white/10 pb-1"
            >
              {renderInlineSpans(line.slice(2))}
            </h1>
          );
        }

        // H2 Heading
        if (line.startsWith('## ')) {
          return (
            <h2
              key={lIdx}
              className="text-base sm:text-lg font-extrabold text-white mt-3.5 mb-1.5 flex items-center gap-2 text-cyan-300"
            >
              {renderInlineSpans(line.slice(3))}
            </h2>
          );
        }

        // H3 Heading
        if (line.startsWith('### ')) {
          return (
            <h3
              key={lIdx}
              className="text-sm sm:text-base font-bold text-emerald-300 mt-2.5 mb-1"
            >
              {renderInlineSpans(line.slice(4))}
            </h3>
          );
        }

        // Bullet list item (- or *)
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={lIdx} className="flex items-start gap-2.5 pl-1.5 my-1">
              <span className="size-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-sm shadow-emerald-400" />
              <span className="flex-1 text-slate-200 leading-relaxed">
                {renderInlineSpans(line.slice(2))}
              </span>
            </div>
          );
        }

        // Numbered list (1. 2. etc)
        const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={lIdx} className="flex items-start gap-2.5 pl-1.5 my-1">
              <span className="size-5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                {numMatch[1]}
              </span>
              <span className="flex-1 text-slate-200 leading-relaxed">
                {renderInlineSpans(numMatch[2])}
              </span>
            </div>
          );
        }

        // Blockquote (> text)
        if (line.startsWith('> ')) {
          return (
            <blockquote
              key={lIdx}
              className="pl-3.5 py-1 border-l-2 border-emerald-400 bg-emerald-500/[0.04] text-slate-300 rounded-r-lg my-1.5 italic"
            >
              {renderInlineSpans(line.slice(2))}
            </blockquote>
          );
        }

        // Regular Paragraph
        return (
          <p key={lIdx} className="leading-relaxed text-slate-200">
            {renderInlineSpans(line)}
          </p>
        );
      })}
    </div>
  );
}

// 3. Inline parser for **bold**, `inline code`, and *italic*
function renderInlineSpans(text: string): React.ReactNode {
  // Regex to match `code` or **bold** or *italic*
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push preceding text
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith('`') && token.endsWith('`')) {
      // Inline Code Badge
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] sm:text-xs font-semibold mx-0.5 shadow-xs"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      // Bold Text
      parts.push(
        <strong key={match.index} className="font-extrabold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      // Italic Text
      parts.push(
        <em key={match.index} className="italic text-cyan-200">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// 4. Parser Helper to extract ```code``` blocks
interface ParsedBlock {
  type: 'text' | 'code';
  language?: string;
  content: string;
}

function parseMarkdownBlocks(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text before the code block
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    const language = match[1] || 'code';
    const codeContent = match[2];

    blocks.push({
      type: 'code',
      language,
      content: codeContent.replace(/\n$/, ''),
    });

    lastIndex = codeBlockRegex.lastIndex;
  }

  // Remaining text
  if (lastIndex < text.length) {
    blocks.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return blocks;
}
