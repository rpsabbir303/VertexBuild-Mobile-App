"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  getDrawingOfflineCopy,
  getDrawingOfflineStoreVersion,
  offlineCopyIsStale,
  subscribeDrawingOffline,
} from "@/lib/mobile/drawingOffline";
import { todayIso } from "@/lib/mobile/dailyLogs";
import {
  currentRevisionLine,
  currentRevisionRecord,
  disciplineFiltersForProject,
  disciplineSectionLabel,
  formatDrawingUpdated,
  groupDrawingsByDiscipline,
  priorRevisions,
  projectDrawings,
  revisionStatusLabel,
  visibleDrawings,
  type DrawingDisciplineFilter,
  type ProjectDrawing,
} from "@/lib/mobile/drawings";
import { mobilePageBg } from "@/lib/mobile/mobileUi";
import { canAccessMoreMenuItem } from "@/lib/mobile/roleConfig";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { PermissionDeniedScreen } from "./PermissionDeniedScreen";
import { IconChevronDown, IconChevronRight, IconSearch } from "../icons";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function ListSkeleton() {
  return (
    <div className="mt-6 space-y-6 pb-6" aria-hidden="true">
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-3 w-14 animate-pulse rounded-sm bg-brand-line/60" />
        ))}
      </div>
      <div className="h-9 animate-pulse rounded-[12px] bg-brand-line/50" />
      <div className="space-y-4">
        <div className="h-2.5 w-28 animate-pulse rounded-sm bg-brand-line/55" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[17px] border border-brand-line/55 bg-white px-4 py-4 shadow-[0_1px_8px_rgba(8,35,63,0.04)]"
          >
            <div className="h-3.5 w-14 animate-pulse rounded-sm bg-brand-line/70" />
            <div className="mt-2 h-4 w-full animate-pulse rounded-sm bg-brand-line/60" />
            <div className="mt-3 h-3 w-24 animate-pulse rounded-sm bg-brand-line/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

const drawingItemSurface =
  "overflow-hidden rounded-[17px] border border-brand-line/60 bg-white shadow-[0_1px_8px_rgba(8,35,63,0.05)]";

function DrawingRow({
  drawing,
  offlineStoreVersion,
}: {
  drawing: ProjectDrawing;
  offlineStoreVersion: number;
}) {
  void offlineStoreVersion;
  const [priorOpen, setPriorOpen] = useState(false);
  const href = `/mobile-preview/tools/drawings/${drawing.id}`;
  const current = currentRevisionRecord(drawing);
  const updated = current ? formatDrawingUpdated(current.updatedIso) : null;
  const prior = priorRevisions(drawing);
  const offline = getDrawingOfflineCopy(drawing.id);
  const offlineReady = offline?.status === "available";
  const offlineStale = offlineReady && offlineCopyIsStale(drawing.id, drawing.currentRevision);
  const priorCountLabel =
    prior.length === 1 ? "1 older revision" : `${prior.length} older revisions`;

  return (
    <li>
      <article className={drawingItemSurface}>
        <Link href={href} className="m-press group flex items-start gap-2 px-4 py-3.5 transition active:bg-brand-soft/25">
          <span className="min-w-0 flex-1">
            <span className="font-mono text-[14px] font-semibold tracking-[0.05em] text-brand-navy/90">
              {drawing.sheetNumber}
            </span>
            <span className="mt-1 block text-[15px] font-semibold leading-snug tracking-[-0.02em] text-brand-navy">
              {drawing.title}
            </span>
            <span className="mt-2.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy">
                {currentRevisionLine(drawing.currentRevision)}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/55" aria-hidden="true">
                ·
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy">Current</span>
              {offlineReady ? (
                <>
                  <span className="text-[11px] font-semibold text-brand-navy/40" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#1B6B45]">
                    {offlineStale ? "Update offline" : "✓ Offline"}
                  </span>
                </>
              ) : null}
            </span>
            {updated ? <span className="mt-1.5 block text-[12px] text-brand-muted">{updated}</span> : null}
          </span>
          <IconChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-mist/80 transition group-active:text-brand-muted" />
        </Link>

        {prior.length > 0 ? (
          <div className="border-t border-brand-line/45">
            <button
              type="button"
              onClick={() => setPriorOpen((open) => !open)}
              className="m-press flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition active:bg-brand-soft/20"
              aria-expanded={priorOpen}
            >
              <span className="text-[12px] font-medium text-brand-muted">
                {priorCountLabel}
              </span>
              <IconChevronDown
                className={`h-4 w-4 shrink-0 text-brand-mist transition-transform ${priorOpen ? "rotate-180" : ""}`}
              />
            </button>
            {priorOpen ? (
              <div className="border-t border-brand-line/35 bg-[#FAFCFE]/90 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Older revisions</p>
                <ul className="mt-2 space-y-1.5">
                  {prior.map((rev) => (
                    <li key={rev.revision} className="text-[12px] font-medium text-brand-navy/70">
                      {currentRevisionLine(rev.revision)} · {revisionStatusLabel(rev, drawing.currentRevision)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </article>
    </li>
  );
}

export function DrawingsListScreen() {
  const { currentProject, openProjectSelector, isOffline, accessibleProjects, user } = useMobileApp();
  const offlineStoreVersion = useSyncExternalStore(
    subscribeDrawingOffline,
    getDrawingOfflineStoreVersion,
    () => 0,
  );

  const allowed = canAccessMoreMenuItem(
    "drawings",
    user.role,
    accessibleProjects.map((p) => p.id),
    currentProject.id,
  );

  const [discipline, setDiscipline] = useState<DrawingDisciplineFilter>("all");
  const [query, setQuery] = useState("");
  const [today, setToday] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setToday(todayIso());
  }, [currentProject.id]);

  useEffect(() => {
    if (!today) return;
    setPhase("loading");
    const timer = window.setTimeout(() => {
      const cached = projectDrawings(currentProject.id, today);
      setPhase(isOffline && cached.length === 0 ? "error" : "ready");
    }, 320);
    return () => window.clearTimeout(timer);
  }, [currentProject.id, today, isOffline, retry]);

  const records = useMemo(() => {
    if (!today) return [];
    return projectDrawings(currentProject.id, today);
  }, [currentProject.id, today]);

  const filters = today ? disciplineFiltersForProject(currentProject.id, today) : [{ id: "all" as const, label: "All" }];
  const visible = today ? visibleDrawings(records, discipline, query) : [];
  const groups = groupDrawingsByDiscipline(visible);

  useEffect(() => {
    if (discipline !== "all" && !filters.some((f) => f.id === discipline)) {
      setDiscipline("all");
    }
  }, [discipline, filters]);

  if (!allowed) {
    return <PermissionDeniedScreen backHref="/mobile-preview/more" />;
  }

  return (
    <div className={`${mobilePageBg} overflow-x-hidden`}>
      <div className="mx-auto max-w-lg px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(12px,env(safe-area-inset-top))]">
        <header className="border-b border-brand-line/45 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-mist">Drawings</p>
              <h1 className="mt-1 text-[26px] font-bold leading-none tracking-[-0.04em] text-brand-navy">Drawings</h1>
            </div>
            <Link
              href="/mobile-preview/more"
              className="m-press mt-1 shrink-0 rounded-full border border-brand-line/70 bg-white/80 px-3 py-1.5 text-[12px] font-semibold text-brand-muted transition active:scale-[0.98]"
            >
              More
            </Link>
          </div>

          <button
            type="button"
            onClick={openProjectSelector}
            className="m-press group mt-4 flex w-full items-start gap-2 text-left transition active:opacity-90"
            aria-label={`Active project, ${currentProject.name}. Change project.`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[18px] font-semibold leading-tight tracking-[-0.025em] text-brand-navy">
                {currentProject.name}
              </span>
              <span className="mt-0.5 block text-[13px] text-brand-muted">
                {currentProject.city}, {currentProject.state}
              </span>
            </span>
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-line/60 bg-white text-brand-mist transition group-active:border-brand-line">
              <IconChevronDown className="h-4 w-4" />
            </span>
          </button>

          {phase === "ready" && isOffline && records.length > 0 ? (
            <p className="mt-2 text-[12px] font-medium text-brand-muted" role="status">
              On this device
            </p>
          ) : null}
        </header>

        {phase === "loading" ? <ListSkeleton /> : null}

        {phase === "error" ? (
          <div className="pt-12">
            <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">Unable to load drawings</h2>
            <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
              Connect to load drawings for this project.
            </p>
            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
              className="m-press mt-5 rounded-full border border-brand-line/70 bg-white px-4 py-2 text-[13px] font-semibold text-brand-navy"
            >
              Try again
            </button>
          </div>
        ) : null}

        {phase === "ready" && today ? (
          records.length > 0 ? (
            <section className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-mist">Drawing sets</h2>
                <p className="text-[13px] font-semibold tabular-nums text-brand-navy">{pad2(visible.length)}</p>
              </div>

              {filters.length > 1 ? (
                <div
                  className="mt-3 -mx-4 flex gap-0 overflow-x-auto scroll-smooth border-b border-brand-line/45 px-4 pb-0 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="tablist"
                  aria-label="Drawing discipline filter"
                >
                  {filters.map((item, index) => {
                    const active = discipline === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setDiscipline(item.id)}
                        className={`relative shrink-0 px-3 py-2 text-[13px] font-semibold transition-colors duration-150 ${
                          index === 0 ? "pl-0 pr-3.5" : "px-3.5"
                        } ${active ? "text-brand-navy" : "text-brand-mist"}`}
                      >
                        {item.label}
                        {active ? (
                          <span
                            className={`absolute -bottom-px h-[2px] rounded-full bg-brand-navy ${index === 0 ? "left-0 right-0" : "inset-x-3.5"}`}
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <label className="mt-3 flex h-9 items-center gap-2 rounded-[12px] border border-brand-line/45 bg-white/80 px-3">
                <IconSearch className="h-[15px] w-[15px] shrink-0 text-brand-mist" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search drawings…"
                  aria-label="Search drawings"
                  className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-brand-navy outline-none placeholder:text-brand-mist/90"
                />
              </label>

              {visible.length === 0 ? (
                <div className="pt-10">
                  <h3 className="text-[18px] font-bold tracking-[-0.03em] text-brand-navy">Nothing in this view</h3>
                  <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
                    Try another discipline, or search by sheet number or title.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-7">
                  {groups.map((group) => (
                    <section key={group.discipline}>
                      <h3 className="border-b border-brand-navy/15 pb-2 text-[11px] font-semibold tracking-[0.2em] text-brand-navy/70">
                        {disciplineSectionLabel(group.discipline)}
                      </h3>
                      <ul className="mt-3 space-y-4">
                        {group.items.map((drawing) => (
                          <DrawingRow key={drawing.id} drawing={drawing} offlineStoreVersion={offlineStoreVersion} />
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <div className="pt-12">
              <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">No drawings yet</h2>
              <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
                No drawings are available for this project.
              </p>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
