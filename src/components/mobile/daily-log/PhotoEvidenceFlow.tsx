"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  captureGps,
  formatPhotoTimestamp,
  gpsStatusLine,
  type GpsState,
  type PhotoParentContext,
} from "@/lib/mobile/photoEvidence";
import { IconBack, IconClose } from "../icons";

type FlowStep = "camera" | "preview" | "annotate";

type CaptureMeta = {
  capturedAt: string;
  gpsState: GpsState;
  locationLabel: string | null;
};

type AnnotateTool = "pen" | "arrow" | "rect" | "circle" | "text";

type Stroke = {
  tool: AnnotateTool;
  color: string;
  points: { x: number; y: number }[];
  text?: string;
};

export function PhotoEvidenceFlow({
  parentContext,
  initialSrc,
  onCancel,
  onAttach,
}: {
  parentContext: PhotoParentContext;
  initialSrc?: string | null;
  onCancel: () => void;
  onAttach: (src: string, meta: CaptureMeta) => void;
}) {
  const [step, setStep] = useState<FlowStep>(initialSrc ? "preview" : "camera");
  const [capturedSrc, setCapturedSrc] = useState<string | null>(initialSrc ?? null);
  const [meta, setMeta] = useState<CaptureMeta | null>(
    initialSrc
      ? { capturedAt: new Date().toISOString(), gpsState: "unavailable", locationLabel: null }
      : null,
  );
  const [metaLoading, setMetaLoading] = useState(false);

  useEffect(() => {
    if (!initialSrc || meta?.gpsState === "captured") return;
    let cancelled = false;
    setMetaLoading(true);
    void captureGps().then((gps) => {
      if (cancelled) return;
      setMeta((current) =>
        current
          ? { ...current, gpsState: gps.gpsState, locationLabel: gps.locationLabel }
          : {
              capturedAt: new Date().toISOString(),
              gpsState: gps.gpsState,
              locationLabel: gps.locationLabel,
            },
      );
      setMetaLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [initialSrc, meta?.gpsState]);

  async function finishPreview(src: string) {
    setCapturedSrc(src);
    setStep("preview");
    setMetaLoading(true);
    const capturedAt = new Date().toISOString();
    const gps = await captureGps();
    setMeta({ capturedAt, gpsState: gps.gpsState, locationLabel: gps.locationLabel });
    setMetaLoading(false);
  }

  function handleUsePhoto(finalSrc: string) {
    if (!meta) return;
    onAttach(finalSrc, meta);
  }

  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-brand-ink text-white" role="dialog" aria-modal="true">
      {step === "camera" ? (
        <CameraStep parentContext={parentContext} onCancel={onCancel} onCaptured={(src) => void finishPreview(src)} />
      ) : null}
      {step === "preview" && capturedSrc && meta ? (
        <PreviewStep
          parentContext={parentContext}
          src={capturedSrc}
          meta={meta}
          metaLoading={metaLoading}
          onCancel={onCancel}
          onRetake={() => {
            setCapturedSrc(null);
            setMeta(null);
            setStep("camera");
          }}
          onAnnotate={() => setStep("annotate")}
          onUse={() => handleUsePhoto(capturedSrc)}
        />
      ) : null}
      {step === "annotate" && capturedSrc ? (
        <AnnotateStep
          src={capturedSrc}
          onBack={() => setStep("preview")}
          onDone={(src) => {
            setCapturedSrc(src);
            setStep("preview");
          }}
          onSkip={() => setStep("preview")}
        />
      ) : null}
    </div>
  );
}

function ContextStrip({ parentContext }: { parentContext: PhotoParentContext }) {
  return (
    <div className="border-b border-white/10 px-4 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">Project</p>
      <p className="text-[13px] font-semibold text-white">{parentContext.projectName}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">Record</p>
      <p className="text-[12px] text-white/85">
        {parentContext.recordLabel} · {parentContext.sectionLabel}
      </p>
    </div>
  );
}

function CameraStep({
  parentContext,
  onCancel,
  onCaptured,
}: {
  parentContext: PhotoParentContext;
  onCancel: () => void;
  onCaptured: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [permission, setPermission] = useState<"pending" | "granted" | "denied" | "unsupported">("pending");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermission("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setPermission("granted");
    } catch {
      setPermission("denied");
    }
  }, [facing, stopStream]);

  useEffect(() => {
    void startCamera();
    return () => stopStream();
  }, [startCamera, stopStream]);

  function captureFrame() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    stopStream();
    onCaptured(canvas.toDataURL("image/jpeg", 0.92));
  }

  function onFilePick(list: FileList | null) {
    const file = list?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      stopStream();
      onCaptured(String(reader.result ?? ""));
    };
    reader.readAsDataURL(file);
  }

  if (permission === "unsupported") {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-brand-navy">
        <ContextStrip parentContext={parentContext} />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-[17px] font-bold">Camera not available</p>
          <p className="mt-2 text-[14px] text-white/75">Use your device camera app, then choose from library.</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="m-press mt-6 h-12 rounded-full bg-brand-blue px-6 text-[15px] font-semibold"
          >
            Choose from library
          </button>
        </div>
        <FlowFooter onCancel={onCancel} />
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => onFilePick(e.target.files)} />
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-brand-navy">
        <ContextStrip parentContext={parentContext} />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-[17px] font-bold">Camera access required</p>
          <p className="mt-2 text-[14px] leading-relaxed text-white/75">
            Allow camera access to capture field photos for this work entry.
          </p>
          <button type="button" onClick={() => void startCamera()} className="m-press mt-6 h-12 rounded-full bg-brand-blue px-6 text-[15px] font-semibold">
            Allow camera
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="m-press mt-3 text-[14px] font-semibold text-white/80"
          >
            Choose from library instead
          </button>
        </div>
        <FlowFooter onCancel={onCancel} />
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => onFilePick(e.target.files)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black">
      <div className="flex items-center justify-between px-3 pt-[max(8px,env(safe-area-inset-top))]">
        <button type="button" onClick={onCancel} aria-label="Cancel" className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40">
          <IconBack className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
          className="rounded-full bg-black/40 px-3 py-2 text-[12px] font-semibold"
        >
          Flip
        </button>
      </div>
      <ContextStrip parentContext={parentContext} />
      <div className="relative min-h-0 flex-1 bg-black">
        {permission === "pending" ? (
          <p className="absolute inset-0 flex items-center justify-center text-[14px] text-white/70">Starting camera…</p>
        ) : (
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        )}
        {error ? <p className="absolute bottom-4 inset-x-4 text-center text-[13px] text-red-200">{error}</p> : null}
      </div>
      <div className="flex items-center justify-center gap-8 bg-black/80 px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          onClick={captureFrame}
          disabled={permission !== "granted"}
          aria-label="Capture photo"
          className="m-press flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
        >
          <span className="h-14 w-14 rounded-full bg-white" />
        </button>
      </div>
    </div>
  );
}

function PreviewStep({
  parentContext,
  src,
  meta,
  metaLoading,
  onCancel,
  onRetake,
  onAnnotate,
  onUse,
}: {
  parentContext: PhotoParentContext;
  src: string;
  meta: CaptureMeta;
  metaLoading: boolean;
  onCancel: () => void;
  onRetake: () => void;
  onAnnotate: () => void;
  onUse: () => void;
}) {
  const photoMeta = {
    id: "preview",
    src,
    capturedAt: meta.capturedAt,
    locationLabel: meta.locationLabel,
    gpsState: meta.gpsState,
    uploadStatus: "uploaded" as const,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-brand-navy">
      <div className="flex items-center justify-between px-3 pt-[max(8px,env(safe-area-inset-top))]">
        <button type="button" onClick={onCancel} className="flex h-11 w-11 items-center justify-center rounded-full text-white">
          <IconClose />
        </button>
        <p className="text-[15px] font-semibold">Preview</p>
        <span className="w-11" />
      </div>
      <ContextStrip parentContext={parentContext} />
      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        <img src={src} alt="Captured preview" className="mx-auto max-h-[52vh] w-full rounded-[14px] object-contain" />
        <div className="mt-4 rounded-[14px] border border-white/10 bg-white/5 px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">Context</p>
          {metaLoading ? (
            <p className="mt-1 text-[13px] text-white/70">Reading location…</p>
          ) : (
            <>
              <p className="mt-1 text-[14px] font-semibold">{gpsStatusLine(photoMeta)}</p>
              {photoMeta.locationLabel ? (
                <p className="mt-0.5 text-[12px] text-white/70">{photoMeta.locationLabel}</p>
              ) : null}
              <p className="mt-2 text-[13px] text-white/85">{formatPhotoTimestamp(meta.capturedAt)}</p>
              {meta.gpsState === "denied" ? (
                <p className="mt-2 text-[12px] leading-snug text-white/60">
                  Location permission was denied. You can still attach this photo.
                </p>
              ) : meta.gpsState !== "captured" ? (
                <p className="mt-2 text-[12px] leading-snug text-white/60">
                  Location unavailable. You can still attach this photo.
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
      <div className="space-y-2 border-t border-white/10 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
        <button type="button" onClick={onAnnotate} className="m-press flex h-12 w-full items-center justify-center rounded-[14px] border border-white/20 text-[15px] font-semibold">
          Annotate (optional)
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onRetake} className="m-press h-12 rounded-[14px] bg-white/10 text-[15px] font-semibold">
            Retake
          </button>
          <button type="button" onClick={onUse} className="m-press h-12 rounded-[14px] bg-brand-blue text-[15px] font-semibold">
            Use photo
          </button>
        </div>
      </div>
    </div>
  );
}

function AnnotateStep({
  src,
  onBack,
  onDone,
  onSkip,
}: {
  src: string;
  onBack: () => void;
  onDone: (dataUrl: string) => void;
  onSkip: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<AnnotateTool>("pen");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [draftStroke, setDraftStroke] = useState<Stroke | null>(null);
  const [textNoteOpen, setTextNoteOpen] = useState(false);
  const [textNote, setTextNote] = useState("");
  const [textAnchor, setTextAnchor] = useState<{ x: number; y: number } | null>(null);
  const markColor = "#2F6FED";

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      layoutCanvas(img);
      redraw(img, strokes, null);
    };
    img.src = src;
  }, [src]);

  function layoutCanvas(img: HTMLImageElement) {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const maxW = container.clientWidth || 360;
    const maxH = Math.min(window.innerHeight * 0.52, 480);
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
  }

  function redraw(img: HTMLImageElement, list: Stroke[], draft: Stroke | null) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (canvas.width === 0 || canvas.height === 0) layoutCanvas(img);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const drawList = draft ? [...list, draft] : list;
    for (const stroke of drawList) {
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.tool === "pen" ? 3 : 2;
      if (stroke.tool === "pen" && stroke.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        ctx.stroke();
      }
      if (stroke.tool === "rect" && stroke.points.length >= 2) {
        const [a, b] = stroke.points;
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      }
      if (stroke.tool === "circle" && stroke.points.length >= 2) {
        const [a, b] = stroke.points;
        const rx = Math.abs(b.x - a.x) / 2;
        const ry = Math.abs(b.y - a.y) / 2;
        ctx.beginPath();
        ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (stroke.tool === "arrow" && stroke.points.length >= 2) {
        const [from, to] = stroke.points;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const head = 10;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - head * Math.cos(angle - 0.4), to.y - head * Math.sin(angle - 0.4));
        ctx.lineTo(to.x - head * Math.cos(angle + 0.4), to.y - head * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
      }
      if (stroke.tool === "text" && stroke.text && stroke.points[0]) {
        ctx.font = "600 14px system-ui, sans-serif";
        ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
      }
    }
  }

  useEffect(() => {
    const img = imageRef.current;
    if (img) redraw(img, strokes, draftStroke);
  }, [strokes, draftStroke]);

  useEffect(() => {
    const onResize = () => {
      const img = imageRef.current;
      if (img) {
        layoutCanvas(img);
        redraw(img, strokes, draftStroke);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [strokes, draftStroke]);

  function pointerPos(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerPos(event);
    if (tool === "text") {
      setTextAnchor(point);
      setTextNote("");
      setTextNoteOpen(true);
      return;
    }
    setDraftStroke({ tool, color: markColor, points: [point] });
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!draftStroke) return;
    const point = pointerPos(event);
    if (draftStroke.tool === "pen") {
      setDraftStroke({ ...draftStroke, points: [...draftStroke.points, point] });
      return;
    }
    setDraftStroke({ ...draftStroke, points: [draftStroke.points[0], point] });
  }

  function onPointerUp() {
    if (!draftStroke) return;
    const finalized = draftStroke;
    setDraftStroke(null);
    if (finalized.tool === "pen" && finalized.points.length < 2) return;
    setHistory((h) => [...h, strokes]);
    setStrokes((s) => [...s, finalized]);
  }

  function commitTextNote() {
    const text = textNote.trim();
    if (!text || !textAnchor) {
      setTextNoteOpen(false);
      return;
    }
    setHistory((h) => [...h, strokes]);
    setStrokes((s) => [...s, { tool: "text", color: markColor, points: [textAnchor], text }]);
    setTextNoteOpen(false);
    setTextAnchor(null);
    setTextNote("");
  }

  function undo() {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setStrokes(prev);
  }

  function clearAll() {
    setHistory((h) => [...h, strokes]);
    setStrokes([]);
  }

  function finish() {
    const canvas = canvasRef.current;
    if (!canvas) {
      onDone(src);
      return;
    }
    onDone(canvas.toDataURL("image/jpeg", 0.92));
  }

  const tools: { id: AnnotateTool; label: string }[] = [
    { id: "pen", label: "Pen" },
    { id: "arrow", label: "Arrow" },
    { id: "rect", label: "Rectangle" },
    { id: "circle", label: "Circle" },
    { id: "text", label: "Text note" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-brand-navy">
      <div className="flex items-center justify-between px-3 pt-[max(8px,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full text-white">
          <IconBack className="h-5 w-5" />
        </button>
        <p className="text-[15px] font-semibold">Annotate</p>
        <button type="button" onClick={onSkip} className="text-[14px] font-semibold text-white/80">
          Skip
        </button>
      </div>
      <div ref={containerRef} className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        <canvas
          ref={canvasRef}
          className="max-h-[58vh] w-full touch-none rounded-[14px] border border-white/10 bg-black/30"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
      {textNoteOpen ? (
        <div className="absolute inset-0 z-10 flex items-end bg-brand-ink/50 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <div className="w-full rounded-t-[18px] border border-brand-line/70 bg-white px-4 pb-4 pt-3 text-brand-navy shadow-sheet">
            <p className="text-[15px] font-bold tracking-[-0.02em]">Field note</p>
            <input
              value={textNote}
              onChange={(event) => setTextNote(event.target.value)}
              placeholder="Short note"
              className="mt-3 h-11 w-full rounded-[12px] border border-brand-line/80 px-3 text-[15px] outline-none focus:border-brand-blue"
              autoFocus
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setTextNoteOpen(false)} className="h-11 rounded-[12px] text-[14px] font-semibold text-brand-muted">
                Cancel
              </button>
              <button type="button" onClick={commitTextNote} className="h-11 rounded-[12px] bg-brand-blue text-[14px] font-semibold text-white">
                Add note
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2 px-3">
        {tools.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTool(item.id)}
            className={`rounded-pill px-3 py-1.5 text-[12px] font-semibold ${
              tool === item.id ? "bg-brand-blue text-white" : "bg-white/10 text-white/85"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <button type="button" onClick={undo} className="h-11 rounded-[12px] bg-white/10 text-[14px] font-semibold">
          Undo
        </button>
        <button type="button" onClick={clearAll} className="h-11 rounded-[12px] bg-white/10 text-[14px] font-semibold">
          Clear
        </button>
        <button type="button" onClick={finish} className="h-11 rounded-[12px] bg-brand-blue text-[14px] font-semibold">
          Done
        </button>
      </div>
    </div>
  );
}

function FlowFooter({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
      <button type="button" onClick={onCancel} className="m-press h-11 w-full text-[15px] font-semibold text-white/75">
        Cancel
      </button>
    </div>
  );
}
