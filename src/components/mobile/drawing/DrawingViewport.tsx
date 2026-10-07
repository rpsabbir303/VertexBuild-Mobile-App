"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.35;

type Point = { x: number; y: number };

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function DrawingViewport({
  children,
  navigationEnabled = true,
}: {
  children: ReactNode;
  /** When false, touch pan/pinch is disabled (e.g. markup mode). Zoom buttons still work. */
  navigationEnabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const pinchRef = useRef<{ startDistance: number; startScale: number } | null>(null);
  const panRef = useRef<{ start: Point; origin: Point } | null>(null);

  const clampOffset = useCallback((next: Point, nextScale: number): Point => {
    const el = containerRef.current;
    if (!el || nextScale <= 1) return { x: 0, y: 0 };
    const maxX = ((nextScale - 1) * el.clientWidth) / 2;
    const maxY = ((nextScale - 1) * el.clientHeight) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  }, []);

  const fit = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback(
    (delta: number) => {
      setScale((current) => {
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number((current + delta).toFixed(2))));
        if (next <= 1) setOffset({ x: 0, y: 0 });
        else setOffset((origin) => clampOffset(origin, next));
        return next;
      });
    },
    [clampOffset],
  );

  useEffect(() => {
    fit();
  }, [children, fit]);

  function onTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (!navigationEnabled) return;
    if (event.touches.length === 2) {
      const a = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      const b = { x: event.touches[1].clientX, y: event.touches[1].clientY };
      pinchRef.current = { startDistance: distance(a, b), startScale: scale };
      panRef.current = null;
      return;
    }
    if (event.touches.length === 1 && scale > 1) {
      panRef.current = {
        start: { x: event.touches[0].clientX, y: event.touches[0].clientY },
        origin: offset,
      };
    }
  }

  function onTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    if (!navigationEnabled) return;
    if (event.touches.length === 2 && pinchRef.current) {
      event.preventDefault();
      const a = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      const b = { x: event.touches[1].clientX, y: event.touches[1].clientY };
      const ratio = distance(a, b) / pinchRef.current.startDistance;
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchRef.current.startScale * ratio));
      setScale(Number(next.toFixed(2)));
      if (next <= 1) setOffset({ x: 0, y: 0 });
      return;
    }
    if (event.touches.length === 1 && panRef.current && scale > 1) {
      event.preventDefault();
      const dx = event.touches[0].clientX - panRef.current.start.x;
      const dy = event.touches[0].clientY - panRef.current.start.y;
      setOffset(clampOffset({ x: panRef.current.origin.x + dx, y: panRef.current.origin.y + dy }, scale));
    }
  }

  function onTouchEnd() {
    pinchRef.current = null;
    panRef.current = null;
    if (scale <= 1) setOffset({ x: 0, y: 0 });
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden bg-[#E8EDF2]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div
          className="absolute inset-0 flex items-center justify-center will-change-transform"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        >
          <div className="h-full w-full max-h-full max-w-full">{children}</div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 flex flex-col gap-2">
        <div className="pointer-events-auto flex flex-col overflow-hidden rounded-[12px] border border-brand-line/50 bg-white/95 shadow-[0_2px_12px_rgba(8,35,63,0.08)] backdrop-blur-sm">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => zoomBy(ZOOM_STEP)}
            className="m-press flex h-11 w-11 items-center justify-center text-[20px] font-semibold text-brand-navy"
          >
            +
          </button>
          <div className="h-px bg-brand-line/50" />
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => zoomBy(-ZOOM_STEP)}
            className="m-press flex h-11 w-11 items-center justify-center text-[22px] font-semibold leading-none text-brand-navy"
          >
            −
          </button>
        </div>
        <button
          type="button"
          onClick={fit}
          className="m-press pointer-events-auto rounded-[12px] border border-brand-line/50 bg-white/95 px-3 py-2 text-[12px] font-semibold text-brand-navy shadow-[0_2px_12px_rgba(8,35,63,0.08)] backdrop-blur-sm"
        >
          Fit
        </button>
      </div>
    </div>
  );
}
