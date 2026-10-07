"use client";

import type { DrawingOfflineCopy } from "@/lib/mobile/drawingOffline";
import { currentRevisionLine } from "@/lib/mobile/drawings";

type Props = {
  copy: DrawingOfflineCopy | null;
  sheetNumber: string;
  title: string;
  viewRevision: number;
  currentRevision: number;
  stale: boolean;
  online: boolean;
  connectionNotice: boolean;
  onDownload: () => void;
  onRetry: () => void;
  onDismissConnectionNotice: () => void;
};

export function DrawingOfflineBar({
  copy,
  sheetNumber,
  title,
  viewRevision,
  currentRevision,
  stale,
  online,
  connectionNotice,
  onDownload,
  onRetry,
  onDismissConnectionNotice,
}: Props) {
  if (connectionNotice && !online) {
    return (
      <div className="shrink-0 border-b border-brand-line/45 bg-[#FBF6F1] px-4 py-3" role="status">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A6232]">Connection required</p>
        <p className="mt-1 text-[13px] leading-snug text-brand-navy/85">
          Connect to the internet to download this drawing for offline use.
        </p>
        <button type="button" onClick={onDismissConnectionNotice} className="m-press mt-2 text-[13px] font-semibold text-brand-navy">
          Try again
        </button>
      </div>
    );
  }

  if (copy?.status === "downloading") {
    const progress = copy.progress ?? 0;
    return (
      <div className="shrink-0 border-b border-brand-line/45 bg-white/95 px-4 py-2.5" role="status" aria-live="polite">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-mist">Downloading</p>
        <p className="mt-0.5 font-mono text-[13px] font-semibold text-brand-navy">{sheetNumber}</p>
        <p className="truncate text-[12px] text-brand-muted">{title}</p>
        <p className="mt-1.5 text-[12px] font-medium text-brand-navy">
          Downloading… <span className="tabular-nums">{progress}%</span>
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-brand-line/50">
          <div className="h-full rounded-full bg-brand-navy transition-[width] duration-150" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  if (copy?.status === "failed") {
    return (
      <div className="shrink-0 border-b border-brand-line/45 bg-[#FCF8F5] px-4 py-2.5" role="alert">
        <p className="text-[13px] font-semibold text-[#8A4B3A]">Download failed</p>
        <p className="mt-0.5 text-[12px] text-brand-muted">
          {sheetNumber} · {currentRevisionLine(viewRevision)}
        </p>
        <button type="button" onClick={onRetry} className="m-press mt-2 text-[13px] font-semibold text-brand-navy">
          Retry
        </button>
      </div>
    );
  }

  if (copy?.status === "available" && copy.revision === viewRevision) {
    return (
      <div className="shrink-0 border-b border-brand-line/45 bg-white/95 px-4 py-2.5" role="status">
        <p className="text-[12px] font-semibold text-[#1B6B45]">✓ Available offline</p>
        <p className="mt-0.5 text-[11px] text-brand-navy">
          {sheetNumber} · {currentRevisionLine(copy.revision)}
          {copy.revision === currentRevision ? " · Current" : ""}
        </p>
        {stale ? (
          <div className="mt-2 border-t border-brand-line/40 pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A6232]">New revision available</p>
            <p className="mt-0.5 text-[11px] text-brand-muted">
              Your offline copy: {currentRevisionLine(copy.revision)} · Latest: {currentRevisionLine(currentRevision)}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  if (copy?.status === "available" && copy.revision !== viewRevision) {
    return (
      <div className="shrink-0 border-b border-brand-line/45 bg-white/95 px-4 py-2.5">
        <p className="text-[11px] text-brand-muted">
          Offline copy: {currentRevisionLine(copy.revision)} · Viewing {currentRevisionLine(viewRevision)}
        </p>
        <button
          type="button"
          onClick={onDownload}
          className="m-press mt-2 w-full rounded-[10px] border border-brand-line/55 px-3 py-2 text-left text-[13px] font-semibold text-brand-navy"
        >
          Download for offline · {currentRevisionLine(viewRevision)}
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-brand-line/45 bg-white/95 px-4 py-2">
      <button
        type="button"
        onClick={onDownload}
        className="m-press flex w-full items-center justify-between gap-3 rounded-[10px] border border-brand-line/55 px-3 py-2 text-left"
      >
        <span>
          <span className="block text-[13px] font-semibold text-brand-navy">Download for offline</span>
          <span className="mt-0.5 block text-[11px] text-brand-muted">
            {currentRevisionLine(viewRevision)} · {viewRevision === currentRevision ? "Current" : "Selected revision"}
          </span>
        </span>
        <span className="text-[11px] font-semibold text-brand-muted" aria-hidden="true">
          ↓
        </span>
      </button>
    </div>
  );
}
