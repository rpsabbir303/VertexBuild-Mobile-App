"use client";

import type { DrawingOfflineCopy } from "@/lib/mobile/drawingOffline";
import { currentRevisionLine } from "@/lib/mobile/drawings";

type Props = {
  copy: DrawingOfflineCopy;
  stale: boolean;
  online: boolean;
  onViewLatest?: () => void;
};

export function DrawingOfflineViewerBar({ copy, stale, online, onViewLatest }: Props) {
  return (
    <div
      className={`shrink-0 border-b px-4 py-2.5 ${stale ? "border-[#E6D4C8]/80 bg-[#FBF6F1]" : "border-brand-line/45 bg-[#F4F7FA]"}`}
      role="status"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-navy">
          {online ? "Online" : "Offline"}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">·</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1B6B45]">Available offline</span>
      </div>
      <p className="mt-1 text-[12px] font-medium text-brand-navy">
        {currentRevisionLine(copy.revision)} ·{" "}
        {stale ? "Older revision" : "Current when downloaded"}
      </p>
      {stale ? (
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A6232]">Newer revision available</p>
          <p className="mt-0.5 text-[12px] leading-snug text-brand-navy/85">
            You are viewing {currentRevisionLine(copy.revision)} offline. {currentRevisionLine(copy.latestKnownRevision)} is
            the latest revision{online ? "" : " when last synced"}.
          </p>
          {online && onViewLatest ? (
            <button type="button" onClick={onViewLatest} className="m-press mt-2 text-[13px] font-semibold text-brand-navy">
              View latest
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
