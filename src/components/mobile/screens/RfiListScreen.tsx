"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { parseIso, todayIso } from "@/lib/mobile/dailyLogs";
import {
  canAuthorRfi,
  formatShortDate,
  getRfiSession,
  getServerRfiSession,
  isOverdue,
  projectRfis,
  RFI_FILTERS,
  rfiPriorityLabel,
  rfiResponsibility,
  rfiStatusLabel,
  rfiSummary,
  subscribeRfis,
  visibleRfis,
  type ProjectRfi,
  type RfiFilter,
  type RfiPriority,
  type RfiStatus,
} from "@/lib/mobile/rfis";
import { mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconChevronDown, IconChevronRight, IconPlus, IconSearch } from "../icons";

type RecordTone = "attention" | "active" | "normal" | "settled";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function daysOverdue(due: string, today: string): number {
  const span = parseIso(today).getTime() - parseIso(due).getTime();
  return Math.max(1, Math.round(span / 86400000));
}

function attentionRank(rfi: ProjectRfi, today: string): number {
  const overdue = isOverdue(rfi, today);
  const dueToday = Boolean(rfi.dueDate && rfi.dueDate === today && !overdue);
  if (overdue && rfi.priority === "urgent") return 0;
  if (overdue && rfi.priority === "high") return 1;
  if (overdue) return 2;
  if (dueToday && rfi.priority === "urgent") return 3;
  if (dueToday && rfi.priority === "high") return 4;
  if (dueToday) return 5;
  if (rfi.status === "open" && rfi.priority === "urgent") return 6;
  if (rfi.status === "open" && rfi.priority === "high") return 7;
  return 99;
}

function needsAttentionCandidate(rfi: ProjectRfi, today: string): boolean {
  if (rfi.status !== "open" && rfi.status !== "draft") return false;
  if (isOverdue(rfi, today)) return true;
  if (rfi.dueDate === today) return true;
  if (rfi.priority === "urgent" || rfi.priority === "high") return true;
  return false;
}

function pickNeedsAttention(records: ProjectRfi[], today: string): ProjectRfi | null {
  const candidates = records.filter((rfi) => needsAttentionCandidate(rfi, today));
  if (candidates.length === 0) return null;
  return candidates.slice().sort((a, b) => attentionRank(a, today) - attentionRank(b, today))[0] ?? null;
}

function recordTone(rfi: ProjectRfi, today: string): RecordTone {
  if (rfi.status === "answered" || rfi.status === "closed" || rfi.status === "void") return "settled";
  if (isOverdue(rfi, today)) return "attention";
  if (rfi.dueDate === today || rfi.priority === "urgent") return "active";
  if (rfi.priority === "high") return "active";
  return "normal";
}

function statusDot(status: RfiStatus): string {
  if (status === "draft") return "bg-[#C4B8A8]";
  if (status === "open") return "bg-brand-blue";
  if (status === "answered") return "bg-status-success";
  if (status === "closed") return "bg-brand-mist";
  return "bg-[#C5CED6]";
}

function responsibilityHeading(label: string): string {
  if (label === "Ball in court") return "Ball in court";
  if (label === "Draft with") return "Draft with";
  return label;
}

const PRIORITY_STYLE: Record<RfiPriority, string> = {
  urgent: "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A4B3A]",
  high: "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A6232]",
  normal: "text-[11px] font-medium uppercase tracking-[0.1em] text-brand-mist",
  low: "text-[11px] font-medium uppercase tracking-[0.1em] text-brand-mist/80",
};

function RfiSkeleton() {
  return (
    <div className="mt-4 space-y-2 pb-6" aria-hidden="true">
      <div className="rounded-[14px] border border-[#E6D4C8]/70 bg-[#FBF6F1] p-3.5">
        <div className="h-2.5 w-14 animate-pulse rounded-sm bg-brand-line/70" />
        <div className="mt-3 h-5 w-4/5 animate-pulse rounded-sm bg-brand-line/75" />
        <div className="mt-2 h-3 w-32 animate-pulse rounded-sm bg-brand-line/55" />
      </div>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-[14px] border border-brand-line/60 bg-white p-3.5 shadow-[0_1px_8px_rgba(8,35,63,0.04)]"
        >
          <div className="flex justify-between">
            <div className="h-2.5 w-16 animate-pulse rounded-sm bg-brand-line/65" />
            <div className="h-2.5 w-10 animate-pulse rounded-sm bg-brand-line/50" />
          </div>
          <div className="mt-2.5 h-4 w-full animate-pulse rounded-sm bg-brand-line/70" />
          <div className="mt-2 h-3 w-28 animate-pulse rounded-sm bg-brand-line/50" />
        </div>
      ))}
    </div>
  );
}

function recordSurface(tone: RecordTone, spotlight?: boolean): string {
  if (spotlight) {
    return "rounded-[14px] border border-[#E6D4C8]/90 bg-[#FBF6F1] shadow-[0_2px_12px_rgba(138,75,58,0.07)]";
  }
  if (tone === "attention") {
    return "rounded-[14px] border border-[#E8DDD4]/85 bg-[#FCF8F5] shadow-[0_1px_10px_rgba(138,75,58,0.05)]";
  }
  if (tone === "settled") {
    return "rounded-[14px] border border-brand-line/55 bg-[#FAFCFE] shadow-[0_1px_8px_rgba(8,35,63,0.04)]";
  }
  if (tone === "active") {
    return "rounded-[14px] border border-brand-line/70 bg-white shadow-[0_1px_10px_rgba(8,35,63,0.06)]";
  }
  return "rounded-[14px] border border-brand-line/65 bg-white shadow-[0_1px_10px_rgba(8,35,63,0.05)]";
}

export function RfiListScreen() {
  const { user, currentProject, openProjectSelector, isOffline } = useMobileApp();
  const session = useSyncExternalStore(subscribeRfis, getRfiSession, getServerRfiSession);
  const canCreate = canAuthorRfi(user.role);
  const [filter, setFilter] = useState<RfiFilter>("all");
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
      const cached = projectRfis(currentProject.id, getRfiSession(), today);
      setPhase(isOffline && cached.length === 0 ? "error" : "ready");
    }, 360);
    return () => window.clearTimeout(timer);
  }, [currentProject.id, today, isOffline, retry]);

  const records = useMemo(() => {
    if (!today) return [];
    return projectRfis(currentProject.id, session, today);
  }, [currentProject.id, session, today]);

  const visible = today ? visibleRfis(records, filter, query) : [];
  const summary = today ? rfiSummary(records, today) : null;
  const spotlight = today && !query.trim() ? pickNeedsAttention(records, today) : null;
  const showSpotlight = Boolean(spotlight && !query.trim() && (filter === "all" || spotlight.status === filter));

  const listItems = useMemo(() => {
    if (!spotlight || !showSpotlight) return visible;
    return visible.filter((rfi) => rfi.id !== spotlight.id);
  }, [visible, spotlight, showSpotlight]);

  const figures = summary
    ? [
        summary.open > 0 ? { label: "Open", value: summary.open, tone: "text-brand-navy" } : null,
        summary.awaiting > 0 ? { label: "Awaiting", value: summary.awaiting, tone: "text-brand-navy" } : null,
        summary.overdue > 0 ? { label: "Overdue", value: summary.overdue, tone: "text-[#8A4B3A]" } : null,
      ].filter((item): item is { label: string; value: number; tone: string } => Boolean(item))
    : [];
  const waiting = records.some((rfi) => rfi.sync !== "synced");

  return (
    <div className={mobilePageBg}>
      <div className="px-4 pt-[max(14px,env(safe-area-inset-top))] pb-8">
        <header>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[22px] font-bold tracking-[-0.03em] text-brand-navy">RFI</h1>
            {canCreate ? (
              <Link
                href="/mobile-preview/tools/rfis/new"
                className="m-press inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-brand-navy px-3.5 text-[13px] font-semibold text-white"
              >
                <IconPlus className="h-3.5 w-3.5" />
                New RFI
              </Link>
            ) : (
              <p className="pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">Read only</p>
            )}
          </div>

          <button
            type="button"
            onClick={openProjectSelector}
            className="m-press mt-2 flex min-h-[44px] w-full items-start gap-2 text-left"
            aria-label={`Active project, ${currentProject.name}. Change project.`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-semibold leading-tight tracking-[-0.02em] text-brand-navy">
                {currentProject.name}
              </span>
              <span className="mt-0.5 block text-[13px] text-brand-muted">
                {currentProject.city}, {currentProject.state}
              </span>
            </span>
            <IconChevronDown className="mt-1 shrink-0 text-brand-mist" />
          </button>

          {phase === "ready" && isOffline && records.length > 0 ? (
            <p className="mt-1 text-[12px] font-medium text-brand-muted" role="status">
              {waiting ? "On this device · waiting to sync" : "On this device"}
            </p>
          ) : null}

          {phase === "ready" && figures.length > 0 ? (
            <p className="mt-4 flex flex-wrap items-baseline gap-y-1" aria-label="RFI summary">
              {figures.map((figure, index) => (
                <span key={figure.label} className="inline-flex items-baseline">
                  {index > 0 ? (
                    <span className="mx-3 text-[11px] text-brand-line" aria-hidden="true">
                      |
                    </span>
                  ) : null}
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-mist">{figure.label}</span>
                  <span className={`ml-1.5 text-[15px] font-semibold tabular-nums tracking-[-0.03em] ${figure.tone}`}>
                    {pad2(figure.value)}
                  </span>
                </span>
              ))}
            </p>
          ) : null}
        </header>

        {phase === "loading" ? <RfiSkeleton /> : null}

        {phase === "error" ? (
          <div className="pt-8">
            <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">Unable to load RFIs</h2>
            <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
              We couldn&apos;t load this project&apos;s RFIs right now.
            </p>
            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
              className="m-press mt-5 inline-flex h-11 items-center rounded-full bg-brand-navy px-5 text-[14px] font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : null}

        {phase === "ready" && today ? (
          <>
            {showSpotlight && spotlight ? (
              <section className="mt-5 border-b border-brand-line/70 pb-4">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-mist">Needs attention</h2>
                <AttentionRow rfi={spotlight} today={today} />
              </section>
            ) : null}

            {records.length > 0 ? (
              <section className={showSpotlight ? "mt-5" : "mt-6"}>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-brand-navy">All RFIs</h2>
                  <p className="text-[12px] tabular-nums text-brand-muted">{visible.length}</p>
                </div>

                <div className="mt-3 flex gap-5 overflow-x-auto border-b border-brand-line/70" role="tablist" aria-label="RFI status">
                  {RFI_FILTERS.map((item) => {
                    const active = filter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setFilter(item.id)}
                        className={`relative shrink-0 pb-2.5 text-[13px] font-semibold ${
                          active ? "text-brand-navy" : "text-brand-mist"
                        }`}
                      >
                        {item.label}
                        {active ? <span className="absolute inset-x-0 bottom-0 h-px bg-brand-navy" /> : null}
                      </button>
                    );
                  })}
                </div>

                <label className="mt-3 flex h-9 items-center gap-2 border-b border-brand-line/80 bg-transparent">
                  <IconSearch className="h-4 w-4 shrink-0 text-brand-mist" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search RFIs"
                    aria-label="Search RFIs"
                    className="h-full w-full bg-transparent text-[14px] text-brand-navy outline-none placeholder:text-brand-mist"
                  />
                </label>

                {visible.length === 0 ? (
                  <div className="pt-8">
                    <h3 className="text-[18px] font-bold tracking-[-0.02em] text-brand-navy">Nothing in this view</h3>
                    <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
                      Try another status, or search by number, subject, or question.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {listItems.map((rfi) => (
                      <RegisterRow key={rfi.id} rfi={rfi} today={today} />
                    ))}
                  </ul>
                )}
              </section>
            ) : null}

            {records.length === 0 ? (
              <div className="pt-10">
                <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">No RFIs yet</h2>
                <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
                  Project questions and responses will appear here.
                </p>
                {canCreate ? (
                  <Link
                    href="/mobile-preview/tools/rfis/new"
                    className="m-press mt-5 inline-flex h-11 items-center gap-1 rounded-full bg-brand-navy px-5 text-[14px] font-semibold text-white"
                  >
                    <IconPlus className="h-3.5 w-3.5" />
                    New RFI
                  </Link>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function RowShell({
  href,
  tone,
  spotlight,
  children,
}: {
  href: string;
  tone: RecordTone;
  spotlight?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`m-press flex gap-2 px-3.5 py-3.5 active:scale-[0.995] ${recordSurface(tone, spotlight)}`}
    >
      {!spotlight && tone === "attention" ? (
        <span className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full bg-[#C9957A]/45" aria-hidden="true" />
      ) : null}
      <span className="min-w-0 flex-1">{children}</span>
      <IconChevronRight className="mt-1 shrink-0 text-brand-mist" />
    </Link>
  );
}

function AttentionRow({ rfi, today }: { rfi: ProjectRfi; today: string }) {
  const party = rfiResponsibility(rfi);

  return (
    <div className="mt-2">
      <RowShell href={`/mobile-preview/tools/rfis/${rfi.id}`} tone="attention" spotlight>
        <RecordBody rfi={rfi} today={today} party={party} compact subjectClass="text-[17px] text-brand-navy" />
      </RowShell>
    </div>
  );
}

function RegisterRow({ rfi, today }: { rfi: ProjectRfi; today: string }) {
  const tone = recordTone(rfi, today);
  const party = rfiResponsibility(rfi);

  return (
    <li>
      <RowShell href={`/mobile-preview/tools/rfis/${rfi.id}`} tone={tone}>
        <RecordBody
          rfi={rfi}
          today={today}
          party={party}
          settled={tone === "settled"}
          subjectClass={tone === "settled" ? "text-[16px] text-brand-navy/72" : "text-[17px] text-brand-navy"}
        />
      </RowShell>
    </li>
  );
}

function RecordBody({
  rfi,
  today,
  party,
  compact,
  settled,
  subjectClass = "text-[17px] text-brand-navy",
}: {
  rfi: ProjectRfi;
  today: string;
  party: { label: string; name: string } | null;
  compact?: boolean;
  settled?: boolean;
  subjectClass?: string;
}) {
  return (
    <>
      <span className="flex items-baseline justify-between gap-2 pr-1">
        <span className="text-[11px] font-semibold tracking-[0.06em] text-brand-mist">{rfi.number}</span>
        <span className={PRIORITY_STYLE[rfi.priority]}>{rfiPriorityLabel(rfi.priority)}</span>
      </span>
      <span className={`mt-1 block font-semibold leading-snug tracking-[-0.02em] ${subjectClass}`}>{rfi.title}</span>
      <StatusLine rfi={rfi} settled={settled} />
      <DueBlock rfi={rfi} today={today} compact={compact} settled={settled} />
      {party ? <ResponsibilityBlock label={party.label} name={party.name} settled={settled} /> : null}
      {rfi.sync !== "synced" ? (
        <span className="mt-1.5 block text-[12px] font-medium text-brand-muted">{rfi.syncLabel}</span>
      ) : null}
    </>
  );
}

function StatusLine({ rfi, settled }: { rfi: ProjectRfi; settled?: boolean }) {
  return (
    <span
      className={`mt-1.5 inline-flex max-w-full items-center gap-1.5 ${
        settled ? "text-[13px] text-brand-muted" : "text-[13px] font-medium text-brand-navy"
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot(rfi.status)}`} aria-hidden="true" />
      {rfiStatusLabel(rfi)}
    </span>
  );
}

function DueBlock({
  rfi,
  today,
  compact,
  settled,
}: {
  rfi: ProjectRfi;
  today: string;
  compact?: boolean;
  settled?: boolean;
}) {
  const overdue = isOverdue(rfi, today);
  const dueToday = Boolean(rfi.dueDate && rfi.dueDate === today && !overdue);

  if (!rfi.dueDate) return null;

  if (overdue) {
    const days = daysOverdue(rfi.dueDate, today);
    const phrase = days === 1 ? "1 day" : `${days} days`;
    if (compact) {
      return (
        <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A4B3A]">
          Overdue · {phrase}
        </span>
      );
    }
    return (
      <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A4B3A]">
        Overdue · {phrase}
      </span>
    );
  }

  if (dueToday && !settled) {
    return (
      <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-navy">Due today</span>
    );
  }

  return (
    <span className={`mt-1.5 block text-[11px] uppercase tracking-[0.1em] ${settled ? "text-brand-mist" : "text-brand-muted"}`}>
      Due {formatShortDate(rfi.dueDate)}
    </span>
  );
}

function ResponsibilityBlock({
  label,
  name,
  settled,
}: {
  label: string;
  name: string;
  settled?: boolean;
}) {
  const heading = responsibilityHeading(label);
  return (
    <span className="mt-2.5 block">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-mist">{heading}</span>
      <span className={`mt-0.5 block truncate ${settled ? "text-[14px] text-brand-muted" : "text-[14px] font-semibold text-brand-navy"}`}>
        {name}
      </span>
    </span>
  );
}
