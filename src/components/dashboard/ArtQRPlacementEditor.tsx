'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Focus, Move, RefreshCw, Sliders, Sparkles, Square } from 'lucide-react';
import { Placement } from '@/lib/artqr_api';

interface ArtQRPlacementEditorProps {
  imageUrl: string;
  qrImageUrl?: string | null;
  placement: Placement;
  onPlacementChange: (placement: Placement) => void;
  title?: string;
}

export default function ArtQRPlacementEditor({
  imageUrl,
  qrImageUrl,
  placement,
  onPlacementChange,
  title = '3. Tùy chỉnh vùng đặt mã QR trên tranh',
}: ArtQRPlacementEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const [resizeStart, setResizeStart] = useState<{ mouseX: number; startSize: number; startX: number; startY: number } | null>(null);

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const handleCenter = () => {
    const size = placement.size;
    const nextX = (1 - size) / 2;
    const nextY = (1 - size) / 2;
    onPlacementChange({ x: nextX, y: nextY, size });
  };

  const handleReset = () => {
    onPlacementChange({ x: 0.25, y: 0.25, size: 0.5 });
  };

  const handleSizeSlider = (newSize: number) => {
    const size = clamp(newSize, 0.15, 0.9);
    let x = placement.x;
    let y = placement.y;

    if (x + size > 1) x = 1 - size;
    if (y + size > 1) y = 1 - size;

    onPlacementChange({ x, y, size });
  };

  // Mouse & Touch Dragging
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    setDragStart({
      mouseX: clientX,
      mouseY: clientY,
      startX: placement.x,
      startY: placement.y,
    });
  };

  // Mouse & Touch Resizing
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;

    setIsResizing(true);
    setResizeStart({
      mouseX: clientX,
      startSize: placement.size,
      startX: placement.x,
      startY: placement.y,
    });
  };

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (isDragging && dragStart) {
        const deltaX = (clientX - dragStart.mouseX) / rect.width;
        const deltaY = (clientY - dragStart.mouseY) / rect.height;

        let nextX = dragStart.startX + deltaX;
        let nextY = dragStart.startY + deltaY;

        nextX = clamp(nextX, 0, 1 - placement.size);
        nextY = clamp(nextY, 0, 1 - placement.size);

        onPlacementChange({ ...placement, x: nextX, y: nextY });
      } else if (isResizing && resizeStart) {
        const deltaSize = (clientX - resizeStart.mouseX) / rect.width;
        let nextSize = resizeStart.startSize + deltaSize;

        nextSize = clamp(nextSize, 0.15, Math.min(1 - resizeStart.startX, 1 - resizeStart.startY));

        onPlacementChange({ ...placement, size: nextSize });
      }
    },
    [isDragging, isResizing, dragStart, resizeStart, placement, onPlacementChange]
  );

  const handlePointerEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDragStart(null);
    setResizeStart(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerEnd);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerEnd);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerEnd);
    };
  }, [isDragging, isResizing, handlePointerMove, handlePointerEnd]);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const leftPercent = placement.x * 100;
  const topPercent = placement.y * 100;
  const sizePercent = placement.size * 100;

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#0b0e14] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Focus className="size-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCenter}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.08] transition-colors"
          >
            <Move className="size-3" /> Căn giữa
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.08] transition-colors"
          >
            <RefreshCw className="size-3" /> Mặc định
          </button>
        </div>
      </div>

      {/* Editor Canvas Area */}
      <div
        ref={containerRef}
        className="relative aspect-square w-full select-none overflow-hidden rounded-xl border border-white/10 bg-[#07090e] shadow-inner"
      >
        {/* Background Artwork Preview */}
        {!imgError && imageUrl ? (
          <img
            key={imageUrl}
            src={imageUrl}
            alt="Style reference preview"
            onError={() => setImgError(true)}
            className="pointer-events-none h-full w-full object-cover"
          />
        ) : (
          <div className="pointer-events-none flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-950 p-6 text-center">
            <Sparkles className="size-8 text-emerald-400/60 mb-2" />
            <p className="text-xs font-semibold text-slate-300">Khung nền tranh nghệ thuật</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Mã QR sẽ được AI hòa trộn trực tiếp vào vùng bạn chọn</p>
          </div>
        )}

        {/* Subtle Ambient Vignette to emphasize active QR region */}
        <div className="pointer-events-none absolute inset-0 bg-black/20" />

        {/* Draggable & Resizable QR Placement Region */}
        <div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            width: `${sizePercent}%`,
            height: `${sizePercent}%`,
          }}
          className={`group absolute cursor-grab active:cursor-grabbing border-2 border-emerald-400 bg-emerald-400/20 backdrop-blur-[2px] shadow-[0_0_30px_rgba(52,211,153,0.4)] transition-[border-color,background-color] ${
            isDragging ? 'border-emerald-300 bg-emerald-400/35' : ''
          }`}
        >
          {/* Inner QR Visual - Shows actual QR code uploaded by user */}
          <div className="pointer-events-none relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-1.5 text-center">
            {qrImageUrl ? (
              <img
                src={qrImageUrl}
                alt="QR Code Preview"
                className="h-full w-full object-contain mix-blend-multiply opacity-90 drop-shadow-md"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2">
                <div className="rounded-md bg-black/85 px-2 py-0.5 text-[9.5px] font-bold tracking-wider text-emerald-300 shadow-md">
                  VÙNG MÃ QR
                </div>
                <div className="mt-1 text-[8.5px] font-medium text-emerald-200/80">
                  {Math.round(sizePercent)}% kích thước
                </div>
              </div>
            )}
          </div>

          {/* 4 Corner Guides */}
          <div className="absolute left-1 top-1 size-2.5 border-l-2 border-t-2 border-white" />
          <div className="absolute right-1 top-1 size-2.5 border-r-2 border-t-2 border-white" />
          <div className="absolute bottom-1 left-1 size-2.5 border-b-2 border-l-2 border-white" />
          <div className="absolute bottom-1 right-1 size-2.5 border-b-2 border-r-2 border-white" />

          {/* Bottom-Right Resize Handle */}
          <div
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            className="absolute -bottom-2 -right-2 flex size-5.5 cursor-nwse-resize items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-lg transition-transform hover:scale-125 active:scale-95"
            aria-label="Kéo đổi kích thước"
          >
            <Square className="size-2 text-white" />
          </div>
        </div>
      </div>

      {/* Position Metrics & Size Slider */}
      <div className="space-y-2 border-t border-white/[0.06] pt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sliders className="size-3 text-emerald-400" /> Kích thước mã QR:
          </span>
          <span className="font-semibold text-slate-200">{Math.round(sizePercent)}%</span>
        </div>
        <input
          type="range"
          min="15"
          max="90"
          value={Math.round(sizePercent)}
          onChange={(e) => handleSizeSlider(Number(e.target.value) / 100)}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-emerald-400"
        />
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>X: {Math.round(leftPercent)}%</span>
          <span>Y: {Math.round(topPercent)}%</span>
          <span className="text-emerald-400/90 font-medium">Kéo thả khung xanh để đổi vị trí</span>
        </div>
      </div>
    </div>
  );
}
