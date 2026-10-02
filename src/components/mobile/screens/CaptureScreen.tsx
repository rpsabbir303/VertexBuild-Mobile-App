"use client";

import { useState } from "react";
import { projectSubtitle } from "@/lib/mobile/mockData";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconCapture, IconUpload } from "../icons";
import { DestinationHeader } from "../DestinationHeader";

const captureTypes = ["Site photo", "Progress", "Safety", "Punch evidence"] as const;

export function CaptureScreen() {
  const { currentProject } = useMobileApp();
  const [selectedType, setSelectedType] = useState<(typeof captureTypes)[number]>("Site photo");
  const [syncState, setSyncState] = useState<"idle" | "queued" | "synced">("idle");
  const [lastAction, setLastAction] = useState<string | null>(null);

  const timestamp = "Sep 30, 2026 · 2:14 PM";

  function mockCapture(action: string) {
    setLastAction(action);
    setSyncState("queued");
    window.setTimeout(() => setSyncState("synced"), 900);
  }

  return (
    <>
      <DestinationHeader
        title="Capture"
        subtitle="Capture field evidence for this project"
      />
      <main className="px-4 py-4">
        <section className="rounded-mobile-lg border border-white/80 bg-white/90 p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-mist">
            Project context
          </p>
          <p className="mt-1.5 text-[15px] font-bold text-brand-navy">{currentProject.name}</p>
          <p className="mt-0.5 text-[12px] text-brand-muted">{projectSubtitle(currentProject)}</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-medium text-brand-mist">Capture type</p>
              <p className="mt-1 text-[13px] font-semibold text-brand-navy">{selectedType}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-brand-mist">Timestamp</p>
              <p className="mt-1 text-[13px] font-semibold text-brand-navy">{timestamp}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-mobile bg-brand-soft px-3 py-2.5">
            <p className="text-[12px] text-brand-muted">Upload / sync</p>
            <span
              className={`text-[12px] font-semibold ${
                syncState === "synced"
                  ? "text-status-success"
                  : syncState === "queued"
                    ? "text-status-warning"
                    : "text-brand-mist"
              }`}
            >
              {syncState === "synced"
                ? "Synced"
                : syncState === "queued"
                  ? "Queued for upload"
                  : "Ready"}
            </span>
          </div>
        </section>

        <section className="mt-5">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-brand-mist">
            Capture type
          </p>
          <div className="flex flex-wrap gap-2">
            {captureTypes.map((type) => {
              const active = type === selectedType;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`rounded-pill px-3 py-1.5 text-[12px] font-semibold transition ${
                    active
                      ? "bg-brand-blue text-white"
                      : "border border-brand-line bg-white text-brand-muted"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={() => mockCapture("Take Photo")}
            className="m-press flex w-full items-center gap-3 rounded-mobile-lg border border-white/80 bg-white/90 p-4 text-left shadow-soft"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-softblue text-brand-blue">
              <IconCapture />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-brand-navy">Take Photo</span>
              <span className="mt-0.5 block text-[12px] text-brand-muted">
                Camera capture with GPS photo state
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => mockCapture("Upload Photo")}
            className="m-press flex w-full items-center gap-3 rounded-mobile-lg border border-white/80 bg-white/90 p-4 text-left shadow-soft"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-navy">
              <IconUpload />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-brand-navy">Upload Photo</span>
              <span className="mt-0.5 block text-[12px] text-brand-muted">
                Attach existing photo evidence
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => mockCapture("Add Evidence")}
            className="m-press flex w-full items-center gap-3 rounded-mobile-lg border border-white/80 bg-white/90 p-4 text-left shadow-soft"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-navy">
              <IconCapture strokeWidth={1.6} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-brand-navy">Add Evidence</span>
              <span className="mt-0.5 block text-[12px] text-brand-muted">
                Annotate and attach field evidence
              </span>
            </span>
          </button>
        </section>

        {lastAction ? (
          <p className="mt-4 text-center text-[12px] text-brand-muted">
            Prototype: {lastAction} queued for {currentProject.name}.
          </p>
        ) : null}
      </main>
    </>
  );
}
