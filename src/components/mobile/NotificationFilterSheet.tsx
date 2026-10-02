"use client";

import { useEffect, useState } from "react";
import { NOTIFICATION_FILTER_OPTIONS } from "@/lib/mobile/notifications";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import type { NotificationFilterCategory } from "@/lib/mobile/types";
import { IconCheck, IconClose } from "./icons";

const EXIT_MS = 220;

export function NotificationFilterSheet() {
  const {
    filterSheetOpen,
    closeFilterSheet,
    draftFilters,
    setDraftCategory,
    applyFilters,
    clearFilters,
  } = useMobileApp();

  const [rendered, setRendered] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (filterSheetOpen) {
      setRendered(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(frame);
    }
    setEntered(false);
    const timer = window.setTimeout(() => setRendered(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [filterSheetOpen]);

  useEffect(() => {
    if (!filterSheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFilterSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filterSheetOpen, closeFilterSheet]);

  if (!rendered) return null;

  function selectCategory(category: NotificationFilterCategory | "all") {
    setDraftCategory(category);
  }

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center" role="presentation">
      <button
        type="button"
        className={`absolute inset-0 z-0 bg-brand-ink/35 transition-opacity duration-200 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Dismiss filters"
        onClick={closeFilterSheet}
      />
      <div
        className={`relative z-10 flex max-h-[min(82%,680px)] w-full flex-col overflow-hidden rounded-t-[24px] border border-white/80 bg-white shadow-float transition-transform duration-200 ease-out ${
          entered ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-filter-title"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex justify-center pt-3" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-brand-line" />
        </div>
        <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
          <div>
            <h2 id="notif-filter-title" className="text-[18px] font-bold text-brand-navy">
              Filter notifications
            </h2>
            <p className="mt-1 text-[13px] text-brand-muted">Notification category</p>
          </div>
          <button
            type="button"
            onClick={closeFilterSheet}
            className="m-press flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand-muted"
            aria-label="Close filters"
          >
            <IconClose />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
          <ul className="space-y-1">
            {NOTIFICATION_FILTER_OPTIONS.map((option) => {
              const selected = draftFilters.category === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => selectCategory(option.id)}
                    className={`m-press flex w-full items-center justify-between rounded-mobile px-3 py-2.5 text-left ${
                      selected ? "bg-brand-softblue" : "active:bg-brand-soft"
                    }`}
                  >
                    <span className="text-[14px] font-medium text-brand-navy">{option.label}</span>
                    {selected ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-white">
                        <IconCheck strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span className="h-5 w-5 rounded-full border border-brand-line" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex gap-2 border-t border-brand-line px-4 py-3">
          <button
            type="button"
            onClick={clearFilters}
            className="m-press flex-1 rounded-mobile border border-brand-line py-3 text-[14px] font-semibold text-brand-navy"
          >
            Clear filters
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="m-press flex-1 rounded-mobile bg-brand-blue py-3 text-[14px] font-semibold text-white"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}
