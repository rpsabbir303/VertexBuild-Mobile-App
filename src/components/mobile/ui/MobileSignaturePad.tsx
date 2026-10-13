"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  onChange: (payload: { dataUrl: string | null; hasInk: boolean }) => void;
  disabled?: boolean;
  className?: string;
};

export function MobileSignaturePad({ onChange, disabled = false, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const labelId = useId();

  const emitChange = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInkRef.current) {
      onChange({ dataUrl: null, hasInk: false });
      return;
    }
    onChange({ dataUrl: canvas.toDataURL("image/png"), hasInk: true });
  }, [onChange]);

  const layoutCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.25;
    ctx.strokeStyle = "#08233F";
  }, []);

  useEffect(() => {
    layoutCanvas();
    const onResize = () => {
      if (hasInkRef.current) return;
      layoutCanvas();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [layoutCanvas]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const { x, y } = pointFromEvent(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    event.preventDefault();
    const { x, y } = pointFromEvent(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInkRef.current) {
      hasInkRef.current = true;
      setHasInk(true);
    }
  }

  function finishStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    emitChange();
  }

  function clearPad() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInkRef.current = false;
    setHasInk(false);
    onChange({ dataUrl: null, hasInk: false });
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p id={labelId} className="text-[12px] font-semibold text-brand-navy">
          Signature *
        </p>
        <button
          type="button"
          disabled={disabled || !hasInk}
          onClick={clearPad}
          className="text-[13px] font-semibold text-brand-blue disabled:opacity-40"
        >
          Clear
        </button>
      </div>
      <div
        className={`relative overflow-hidden rounded-[14px] border-2 bg-white ${
          hasInk ? "border-brand-navy/30" : "border-dashed border-brand-line"
        } ${disabled ? "opacity-60" : ""}`}
      >
        {!hasInk ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-[13px] text-brand-mist">
            Sign with your finger or stylus
          </p>
        ) : null}
        <canvas
          ref={canvasRef}
          aria-labelledby={labelId}
          role="img"
          aria-label="Signature drawing area"
          className="touch-none block h-[168px] w-full"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
          onPointerCancel={finishStroke}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-brand-muted">Use landscape orientation if you need more space.</p>
    </div>
  );
}
