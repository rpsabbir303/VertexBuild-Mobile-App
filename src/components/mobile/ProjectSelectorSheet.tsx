"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MOCK_PROJECTS, projectSubtitle } from "@/lib/mobile/mockData";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import type { MockProject } from "@/lib/mobile/types";
import { IconCheck, IconClose, IconSearch } from "./icons";

const EXIT_MS = 220;

function matchesQuery(project: MockProject, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    project.name.toLowerCase().includes(q) ||
    project.city.toLowerCase().includes(q) ||
    project.state.toLowerCase().includes(q) ||
    project.sector.toLowerCase().includes(q) ||
    projectSubtitle(project).toLowerCase().includes(q)
  );
}

export function ProjectSelectorSheet() {
  const {
    projectSelectorOpen,
    closeProjectSelector,
    currentProject,
    setCurrentProjectId,
  } = useMobileApp();

  const titleId = useId();
  const descId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [rendered, setRendered] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (projectSelectorOpen) {
      setRendered(true);
      setQuery("");
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    setEntered(false);
    const timer = window.setTimeout(() => setRendered(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [projectSelectorOpen]);

  useEffect(() => {
    if (!entered) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [entered]);

  useEffect(() => {
    if (!projectSelectorOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProjectSelector();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [projectSelectorOpen, closeProjectSelector]);

  const filtered = useMemo(() => {
    const matches = MOCK_PROJECTS.filter((p) => matchesQuery(p, query));
    return [...matches].sort((a, b) => {
      if (a.id === currentProject.id) return -1;
      if (b.id === currentProject.id) return 1;
      return 0;
    });
  }, [query, currentProject.id]);

  if (!rendered) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center"
      role="presentation"
    >
      <button
        type="button"
        className={`absolute inset-0 z-0 bg-brand-ink/35 transition-opacity duration-200 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Dismiss project selector"
        onClick={closeProjectSelector}
      />

      <div
        className={`relative z-10 flex max-h-[min(78vh,620px)] w-full max-w-[412px] flex-col overflow-hidden rounded-t-[28px] border border-white/80 bg-white/95 shadow-float backdrop-blur-xl transition-transform duration-200 ease-out ${
          entered ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex justify-center pt-3" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-brand-line" />
        </div>

        <div className="flex items-start justify-between gap-3 px-4 pb-1 pt-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[18px] font-bold tracking-[-0.02em] text-brand-navy"
            >
              Select project
            </h2>
            <p id={descId} className="mt-1 text-[13px] leading-snug text-brand-muted">
              Choose the project you want to work in.
            </p>
          </div>
          <button
            type="button"
            onClick={closeProjectSelector}
            className="m-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-muted"
            aria-label="Close project selector"
          >
            <IconClose />
          </button>
        </div>

        <div className="px-4 pb-3 pt-3">
          <label className="relative block">
            <span className="sr-only">Search projects</span>
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-mist" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-pill border border-brand-line bg-brand-soft py-3 pl-11 pr-4 text-[15px] text-brand-navy outline-none placeholder:text-brand-mist focus:border-brand-blue/40 focus:bg-white focus:ring-2 focus:ring-brand-blue/15"
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
          {filtered.length === 0 ? (
            <li className="rounded-mobile-lg bg-brand-soft px-4 py-10 text-center">
              <p className="text-[14px] font-semibold text-brand-navy">No projects found</p>
              <p className="mt-1 text-[13px] text-brand-muted">
                Try another name, city, or sector.
              </p>
            </li>
          ) : (
            filtered.map((project) => {
              const selected = project.id === currentProject.id;
              return (
                <li key={project.id} className="mb-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentProjectId(project.id)}
                    aria-current={selected ? "true" : undefined}
                    aria-label={`${project.name}, ${projectSubtitle(project)}${
                      selected ? ", currently selected" : ""
                    }`}
                    className={`m-press flex w-full items-center gap-3 rounded-mobile-lg px-3.5 py-3.5 text-left transition-colors ${
                      selected
                        ? "bg-brand-softblue ring-1 ring-brand-blue/20"
                        : "bg-transparent active:bg-brand-soft"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[15px] leading-snug tracking-[-0.01em] text-brand-navy ${
                          selected ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {project.name}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] leading-snug text-brand-muted">
                        {projectSubtitle(project)}
                      </p>
                    </div>
                    {selected ? (
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white shadow-glow"
                        aria-hidden="true"
                      >
                        <IconCheck strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span
                        className="h-7 w-7 shrink-0 rounded-full border border-brand-line"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
