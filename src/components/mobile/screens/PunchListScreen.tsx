"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { parseIso, todayIso } from "@/lib/mobile/dailyLogs";
import { mobilePageBg } from "@/lib/mobile/mobileUi";
import { photoThumbSrc } from "@/lib/mobile/photoEvidence";
import {
  drawingPinLine,
  duePresentation,
  isPunchOverdue,
  isPendingVerification,
  needsAttentionPunch,
  punchStatusLabel,
  punchWorkflowLabel,
  projectPunchItems,
  punchSummary,
  PUNCH_FILTERS,
  subscribePunch,
  getPunchSession,
  getServerPunchSession,
  visiblePunchItems,
  type ProjectPunch,
  type PunchFilter,
} from "@/lib/mobile/punch";
import { canAccessMoreMenuItem } from "@/lib/mobile/roleConfig";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { PermissionDeniedScreen } from "./PermissionDeniedScreen";
import { IconChevronDown, IconChevronRight, IconSearch } from "../icons";

type RowAccent = "open" | "active" | "completed" | "pending" | "verified" | "overdue" | "void" | "settled";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function daysOverdue(punch: ProjectPunch, today: string): number {
  if (!punch.dueDate) return 0;
  const span = parseIso(today).getTime() - parseIso(punch.dueDate).getTime();
  return Math.max(1, Math.round(span / 86400000));
}

function punchEvidenceCount(punch: ProjectPunch): number {
  return [...punch.photos, ...punch.completionPhotos].filter(
    (photo) => photoThumbSrc(photo) || photo.legacyLabel,
  ).length;
}

function rowAccent(punch: ProjectPunch, today: string): RowAccent {
  if (punch.status === "void") return "void";
  if (punch.status === "verified") return "verified";
  if (isPendingVerification(punch)) return "pending";
  if (punch.status === "completed") return "completed";
  if (isPunchOverdue(punch, today)) return "overdue";
  if (punch.status === "in_progress") return punch.correctionNeeded ? "overdue" : "active";
  if (punch.status === "open") return "open";
  return "settled";
}

const ACCENT_BAR: Record<RowAccent, string> = {
  open: "bg-brand-blue/70",
  active: "bg-[#C9957A]",
  completed: "bg-status-success/80",
  pending: "bg-[#C9957A]",
  verified: "bg-brand-navy",
  overdue: "bg-[#B8745E]",
  void: "bg-brand-mist",
  settled: "bg-brand-line",
};

function ListStatus({ punch }: { punch: ProjectPunch }) {
  const pending = isPendingVerification(punch);
  const workflow = punchWorkflowLabel(punch);
  const base = punchStatusLabel(punch.status);

  let label = base;
  let tone = "text-brand-navy";

  if (pending) {
    label = "Completed · Pending verification";
    tone = "text-[#8A6232]";
  } else if (punch.correctionNeeded && punch.status === "in_progress") {
    label = "Correction needed";
    tone = "text-[#8A4B3A]";
  } else if (workflow !== base) {
    label = workflow;
  } else if (punch.status === "open") {
    tone = "text-brand-muted";
  } else if (punch.status === "in_progress") {
    tone = "text-[#8A6232]";
  } else if (punch.status === "completed") {
    tone = "text-[#1B6B45]";
  } else if (punch.status === "verified") {
    tone = "text-brand-navy";
  } else if (punch.status === "void") {
    tone = "text-brand-muted";
  }

  const dot =
    punch.status === "verified"
      ? "bg-brand-navy"
      : pending
        ? "bg-[#C9957A]"
        : punch.status === "completed"
          ? "bg-status-success"
          : punch.status === "in_progress"
            ? "bg-[#C9957A]"
            : punch.status === "open"
              ? "bg-brand-blue"
              : "bg-brand-mist";

  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${tone}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function StatusRail({
  open,
  inProgress,
  overdue,
  awaiting,
}: {
  open: number;
  inProgress: number;
  overdue: number;
  awaiting: number;
}) {
  const cells = [
    { key: "open", label: "Open", value: open, valueTone: "text-brand-navy", hint: "Open punch items" },
    { key: "progress", label: "In progress", value: inProgress, valueTone: "text-brand-navy", hint: "In progress" },
    { key: "overdue", label: "Overdue", value: overdue, valueTone: overdue > 0 ? "text-[#8A4B3A]" : "text-brand-navy/40", hint: "Overdue punch items" },
    {
      key: "awaiting",
      label: "Awaiting",
      value: awaiting,
      valueTone: awaiting > 0 ? "text-[#8A6232]" : "text-brand-navy/40",
      hint: "Awaiting verification",
    },
  ] as const;

  return (
    <div
      className="mt-5 grid grid-cols-4 divide-x divide-brand-line/60 rounded-[14px] border border-brand-line/55 bg-white/90 py-2.5"
      aria-label="Punch status overview"
    >
      {cells.map((cell) => (
        <div key={cell.key} className="flex flex-col items-center px-0.5 text-center" title={cell.hint}>
          <span className="text-[9px] font-semibold uppercase leading-tight tracking-[0.16em] text-brand-mist">{cell.label}</span>
          <span className={`mt-0.5 text-[20px] font-semibold tabular-nums leading-none tracking-[-0.04em] ${cell.valueTone}`}>
            {pad2(cell.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PunchSkeleton() {
  return (
    <div className="mt-6 space-y-5 pb-6" aria-hidden="true">
      <div className="grid grid-cols-4 divide-x divide-brand-line/60 rounded-[14px] border border-brand-line/55 bg-white/80 py-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 px-1">
            <div className="h-2 w-10 animate-pulse rounded-sm bg-brand-line/60" />
            <div className="h-5 w-6 animate-pulse rounded-sm bg-brand-line/70" />
          </div>
        ))}
      </div>
      <div className="rounded-[16px] border border-[#E6D4C8]/75 bg-[#FBF6F1] p-4">
        <div className="h-2.5 w-24 animate-pulse rounded-sm bg-brand-line/60" />
        <div className="mt-4 h-6 w-4/5 animate-pulse rounded-sm bg-brand-line/75" />
      </div>
      <div className="overflow-hidden rounded-[16px] border border-brand-line/55 bg-white">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-brand-line/50 px-4 py-4 last:border-b-0">
            <div className="h-2.5 w-16 animate-pulse rounded-sm bg-brand-line/60" />
            <div className="mt-2 h-4 w-full animate-pulse rounded-sm bg-brand-line/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

function spotlightMatchesFilter(punch: ProjectPunch, filter: PunchFilter): boolean {
  if (filter === "all") return true;
  if (filter === punch.status) return true;
  if (filter === "completed" && isPendingVerification(punch)) return true;
  return false;
}

export function PunchListScreen() {
  const { currentProject, openProjectSelector, isOffline, accessibleProjects, user } = useMobileApp();
  const allowed = canAccessMoreMenuItem("punch", user.role, accessibleProjects.map((p) => p.id), currentProject.id);
  void useSyncExternalStore(subscribePunch, getPunchSession, getServerPunchSession);

  const [filter, setFilter] = useState<PunchFilter>("all");
  const [query, setQuery] = useState("");
  const [today, setToday] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    setToday(todayIso());
  }, [currentProject.id]);

  useEffect(() => {
    if (!today) return;
    setPhase("loading");
    const timer = window.setTimeout(() => setPhase("ready"), 280);
    return () => window.clearTimeout(timer);
  }, [currentProject.id, today]);

  const records = useMemo(() => {
    if (!today) return [];
    return projectPunchItems(currentProject.id, today);
  }, [currentProject.id, today]);

  const visible = today ? visiblePunchItems(records, filter, query) : [];
  const summary = today ? punchSummary(records, today) : null;
  const spotlight = today && !query.trim() ? needsAttentionPunch(records, today) : null;
  const showSpotlight = Boolean(spotlight && spotlightMatchesFilter(spotlight, filter));
  const listItems = useMemo(() => {
    if (!spotlight || !showSpotlight) return visible;
    return visible.filter((item) => item.id !== spotlight.id);
  }, [visible, spotlight, showSpotlight]);

  if (!allowed) {
    return <PermissionDeniedScreen backHref="/mobile-preview/more" />;
  }

  return (
    <div className={`${mobilePageBg} overflow-x-hidden`}>
      <div className="mx-auto max-w-lg px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(12px,env(safe-area-inset-top))]">
        <header className="border-b border-brand-line/45 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-mist">Punch</p>
              <h1 className="mt-1 text-[26px] font-bold leading-none tracking-[-0.04em] text-brand-navy">Punch List</h1>
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

          {phase === "ready" && summary ? (
            <StatusRail
              open={summary.open}
              inProgress={summary.inProgress}
              overdue={summary.overdue}
              awaiting={summary.pendingVerification}
            />
          ) : null}
        </header>

        {phase === "loading" ? <PunchSkeleton /> : null}

        {phase === "ready" && today ? (
          <>
            {showSpotlight && spotlight ? (
              <section className="mt-6">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-mist">Needs attention</h2>
                <AttentionSpotlight punch={spotlight} today={today} />
              </section>
            ) : null}

            {records.length > 0 ? (
              <section className={showSpotlight ? "mt-8" : "mt-7"}>
                <div className="flex items-end justify-between gap-3">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-mist">All punch items</h2>
                  <p className="text-[13px] tabular-nums font-semibold text-brand-navy">{pad2(visible.length)}</p>
                </div>

                <div
                  className="mt-3 -mx-4 flex gap-0 overflow-x-auto scroll-smooth px-4 pb-0.5 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="tablist"
                  aria-label="Punch status filter"
                >
                  {PUNCH_FILTERS.map((item, index) => {
                    const active = filter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setFilter(item.id)}
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

                <label className="mt-3 flex h-9 items-center gap-2 rounded-[12px] border border-brand-line/45 bg-white/80 px-3">
                  <IconSearch className="h-[15px] w-[15px] shrink-0 text-brand-mist" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search punch items…"
                    aria-label="Search punch items"
                    className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-brand-navy outline-none placeholder:text-brand-mist/90"
                  />
                </label>

                {visible.length === 0 ? (
                  <div className="pt-10">
                    <h3 className="text-[18px] font-bold tracking-[-0.03em] text-brand-navy">Nothing in this view</h3>
                    <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
                      Try another status, or search by number, description, or location.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-[16px] border border-brand-line/55 bg-white shadow-[0_1px_0_rgba(8,35,63,0.04)]">
                    <ul className="divide-y divide-brand-line/50">
                      {listItems.map((punch, index) => (
                        <RegisterRow key={punch.id} punch={punch} today={today} alternate={index % 2 === 1} />
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ) : (
              <div className="pt-12">
                <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">No punch items</h2>
                <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
                  Punch items for this project will appear here when assigned.
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function dueLineUpper(punch: ProjectPunch, today: string): string | null {
  if (!punch.dueDate) return null;
  if (isPunchOverdue(punch, today)) {
    const days = daysOverdue(punch, today);
    return `Overdue · ${days} ${days === 1 ? "day" : "days"}`;
  }
  return `DUE ${formatShortDateUpper(punch.dueDate)}`;
}

function formatShortDateUpper(iso: string): string {
  const date = parseIso(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}`.toUpperCase();
}

function AttentionSpotlight({ punch, today }: { punch: ProjectPunch; today: string }) {
  const href = `/mobile-preview/tools/punch/${punch.id}`;
  const overdue = isPunchOverdue(punch, today);
  const pending = isPendingVerification(punch);
  const dueLine = dueLineUpper(punch, today);
  const evidence = punchEvidenceCount(punch);
  const drawing = drawingPinLine(punch.drawingPin);

  const flag = pending ? "Awaiting" : overdue ? "Overdue" : "Attention";

  return (
    <Link
      href={href}
      className="m-press group relative mt-2 block overflow-hidden rounded-[16px] border border-[#E6D4C8]/80 bg-[#FBF6F1] transition active:scale-[0.995]"
    >
      <span className="absolute inset-y-0 left-0 w-[3px] bg-[#C9957A]" aria-hidden="true" />
      <div className="px-4 py-3 pl-[17px]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-brand-mist">{punch.number}</p>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A6232]">{flag}</span>
        </div>
        <p className="mt-1.5 text-[17px] font-semibold leading-[1.28] tracking-[-0.03em] text-brand-navy">{punch.description}</p>
        <div className="mt-1.5">
          <ListStatus punch={punch} />
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-brand-navy/78">{punch.location}</p>
        <p className="mt-0.5 text-[12px] text-brand-muted">Assigned to {punch.assignedTo}</p>
        {dueLine ? (
          <p className={`mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${overdue ? "text-[#8A4B3A]" : "text-brand-muted"}`}>
            {dueLine}
          </p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-brand-muted">
          {evidence > 0 ? <span>{evidence} photos</span> : null}
          {drawing ? <span>{drawing}</span> : null}
        </div>
        <p className="mt-1.5 flex items-center justify-end gap-0.5 text-[13px] font-semibold text-brand-navy">
          View
          <IconChevronRight className="h-3.5 w-3.5 text-brand-mist transition group-active:translate-x-0.5 group-active:text-brand-muted" />
        </p>
      </div>
    </Link>
  );
}

function RegisterRow({ punch, today, alternate }: { punch: ProjectPunch; today: string; alternate: boolean }) {
  const href = `/mobile-preview/tools/punch/${punch.id}`;
  const accent = rowAccent(punch, today);
  const overdue = isPunchOverdue(punch, today);
  const due = duePresentation(punch, today);
  const evidence = punchEvidenceCount(punch);
  const drawing = drawingPinLine(punch.drawingPin);
  const settled = punch.status === "verified" || punch.status === "void" || (punch.status === "completed" && !isPendingVerification(punch));

  return (
    <li>
      <Link
        href={href}
        className={`m-press group flex gap-0 transition active:bg-brand-soft/40 ${alternate ? "bg-[#FAFCFE]/80" : "bg-white"}`}
      >
        <span className={`w-[3px] shrink-0 self-stretch ${ACCENT_BAR[accent]}`} aria-hidden="true" />
        <span className="flex min-w-0 flex-1 items-center gap-1 py-3 pl-3 pr-3">
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-[0.1em] text-brand-mist">{punch.number}</span>
              {evidence > 0 ? (
                <span className="text-[10px] font-medium tabular-nums text-brand-mist">{evidence} photos</span>
              ) : null}
            </span>
            <span
              className={`mt-0.5 block font-semibold leading-[1.28] tracking-[-0.02em] ${
                settled ? "text-[15px] text-brand-navy/68" : "text-[15px] text-brand-navy"
              }`}
            >
              {punch.description}
            </span>
            <span className="mt-1.5 block">
              <ListStatus punch={punch} />
            </span>
            <span className={`mt-1 block text-[12px] leading-snug ${settled ? "text-brand-muted" : "text-brand-navy/75"}`}>
              {punch.location}
            </span>
            <span className="mt-0.5 block text-[12px] text-brand-muted">Assigned to {punch.assignedTo}</span>
            {drawing ? <span className="mt-0.5 block text-[11px] text-brand-mist">{drawing}</span> : null}
            {due ? (
              <span
                className={`mt-1 block text-[11px] font-semibold ${
                  overdue && !settled
                    ? "uppercase tracking-[0.08em] text-[#8A4B3A]"
                    : settled
                      ? "text-brand-muted"
                      : "text-brand-navy/80"
                }`}
              >
                {overdue && !settled
                  ? `Overdue · ${daysOverdue(punch, today)} ${daysOverdue(punch, today) === 1 ? "day" : "days"}`
                  : due}
              </span>
            ) : null}
            {punch.sync !== "synced" ? (
              <span className="mt-0.5 block text-[11px] font-medium text-brand-muted">{punch.syncLabel}</span>
            ) : null}
          </span>
          <IconChevronRight className="h-4 w-4 shrink-0 self-center text-brand-mist/80 transition group-active:text-brand-muted" />
        </span>
      </Link>
    </li>
  );
}
