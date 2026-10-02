"use client";

import { useEffect, useState } from "react";
import { projectSubtitle } from "@/lib/mobile/mockData";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconCheck, IconClose } from "./icons";

const EXIT_MS = 220;

export function NotificationProjectFilterSheet() {
  const {
    notificationProjectSelectorOpen,
    closeNotificationProjectSelector,
    notificationProjectFilterId,
    setNotificationProjectFilterId,
    accessibleProjects,
  } = useMobileApp();

  const [rendered, setRendered] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (notificationProjectSelectorOpen) {
      setRendered(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(frame);
    }
    setEntered(false);
    const timer = window.setTimeout(() => setRendered(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [notificationProjectSelectorOpen]);

  useEffect(() => {
    if (!notificationProjectSelectorOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNotificationProjectSelector();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notificationProjectSelectorOpen, closeNotificationProjectSelector]);

  if (!rendered) return null;

  function selectProject(id: "all" | string) {
    setNotificationProjectFilterId(id);
    closeNotificationProjectSelector();
  }

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center" role="presentation">
      <button
        type="button"
        className={`absolute inset-0 z-0 bg-brand-ink/35 transition-opacity duration-200 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Dismiss project filter"
        onClick={closeNotificationProjectSelector}
      />
      <div
        className={`relative z-10 flex max-h-[min(78vh,620px)] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/80 bg-white/95 shadow-float backdrop-blur-xl transition-transform duration-200 ease-out ${
          entered ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-project-filter-title"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex justify-center pt-3" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-brand-line" />
        </div>
        <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
          <div>
            <h2
              id="notif-project-filter-title"
              className="text-[18px] font-bold tracking-[-0.02em] text-brand-navy"
            >
              Filter by project
            </h2>
            <p className="mt-1 text-[13px] text-brand-muted">
              Show notifications for one project or all accessible projects.
            </p>
          </div>
          <button
            type="button"
            onClick={closeNotificationProjectSelector}
            className="m-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-muted"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
          <li className="mb-1.5">
            <button
              type="button"
              onClick={() => selectProject("all")}
              className={`m-press flex w-full items-center justify-between rounded-mobile-lg px-3.5 py-3.5 text-left ${
                notificationProjectFilterId === "all"
                  ? "bg-brand-softblue ring-1 ring-brand-blue/20"
                  : "active:bg-brand-soft"
              }`}
            >
              <span className="text-[15px] font-semibold text-brand-navy">All Projects</span>
              {notificationProjectFilterId === "all" ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue text-white">
                  <IconCheck strokeWidth={2.5} />
                </span>
              ) : (
                <span className="h-7 w-7 rounded-full border border-brand-line" />
              )}
            </button>
          </li>
          {accessibleProjects.map((project) => {
            const selected = notificationProjectFilterId === project.id;
            return (
              <li key={project.id} className="mb-1.5">
                <button
                  type="button"
                  onClick={() => selectProject(project.id)}
                  className={`m-press flex w-full items-center gap-3 rounded-mobile-lg px-3.5 py-3.5 text-left ${
                    selected
                      ? "bg-brand-softblue ring-1 ring-brand-blue/20"
                      : "active:bg-brand-soft"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-brand-navy">
                      {project.name}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-brand-muted">
                      {projectSubtitle(project)}
                    </p>
                  </div>
                  {selected ? (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white">
                      <IconCheck strokeWidth={2.5} />
                    </span>
                  ) : (
                    <span className="h-7 w-7 shrink-0 rounded-full border border-brand-line" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
