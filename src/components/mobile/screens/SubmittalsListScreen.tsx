"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { todayIso } from "@/lib/mobile/dailyLogs";
import { mobilePageBg } from "@/lib/mobile/mobileUi";
import { canAccessToolSlug } from "@/lib/mobile/roleConfig";
import {
  currentRevisionLabel,
  duePresentation,
  getServerSubmittalSession,
  getSubmittalStoreVersion,
  isSubmittalOverdue,
  projectSubmittals,
  SUBMITTAL_FILTERS,
  subscribeSubmittals,
  visibleSubmittals,
  type ProjectSubmittal,
  type SubmittalFilter,
} from "@/lib/mobile/submittals";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { SubmittalStatusMark } from "../SubmittalStatusMark";
import { PermissionDeniedScreen } from "./PermissionDeniedScreen";
import { IconChevronDown, IconChevronRight, IconSearch } from "../icons";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

type RowAccent = "open" | "review" | "returned" | "settled" | "overdue";

function rowAccent(record: ProjectSubmittal, today: string): RowAccent {
  if (record.status === "approved" || record.status === "closed" || record.status === "rejected") {
    return "settled";
  }
  if (isSubmittalOverdue(record, today)) return "overdue";
  if (record.status === "returned") return "returned";
  if (record.status === "pending") return "review";
  return "open";
}

const ACCENT_BAR: Record<RowAccent, string> = {
  open: "bg-brand-blue/70",
  review: "bg-[#C9957A]",
  returned: "bg-[#C9957A]",
  settled: "bg-brand-mist",
  overdue: "bg-[#B8745E]",
};

function ListSkeleton() {
  return (
    <div className="mt-6 space-y-4 pb-6" aria-hidden="true">
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-3 w-12 animate-pulse rounded-sm bg-brand-line/60" />
        ))}
      </div>
      <div className="h-9 animate-pulse rounded-[12px] bg-brand-line/50" />
      <div className="overflow-hidden rounded-[16px] border border-brand-line/55 bg-white">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-brand-line/50 px-4 py-4 last:border-b-0">
            <div className="h-2.5 w-24 animate-pulse rounded-sm bg-brand-line/60" />
            <div className="mt-2 h-4 w-full animate-pulse rounded-sm bg-brand-line/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RegisterRow({ record, today, alternate }: { record: ProjectSubmittal; today: string; alternate: boolean }) {
  const href = `/mobile-preview/tools/submittals/${record.id}`;
  const accent = rowAccent(record, today);
  const due = duePresentation(record, today);
  const overdue = isSubmittalOverdue(record, today);
  const settled = accent === "settled";

  return (
    <li>
      <Link
        href={href}
        className={`m-press group flex gap-0 transition active:bg-brand-soft/40 ${alternate ? "bg-[#FAFCFE]/80" : "bg-white"}`}
      >
        <span className={`w-[3px] shrink-0 self-stretch ${ACCENT_BAR[accent]}`} aria-hidden="true" />
        <span className="flex min-w-0 flex-1 items-center gap-1 py-3 pl-3 pr-3">
          <span className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold tracking-[0.1em] text-brand-mist">{record.number}</span>
            <span
              className={`mt-0.5 block font-semibold leading-[1.28] tracking-[-0.02em] ${
                settled ? "text-[15px] text-brand-navy/68" : "text-[15px] text-brand-navy"
              }`}
            >
              {record.title}
            </span>
            <span className="mt-1.5 block">
              <SubmittalStatusMark status={record.status} />
            </span>
            <span className="mt-1 block text-[12px] font-semibold text-brand-navy">{currentRevisionLabel(record)}</span>
            {due ? (
              <span
                className={`mt-0.5 block text-[12px] font-semibold ${
                  overdue && !settled ? "uppercase tracking-[0.08em] text-[#8A4B3A]" : settled ? "text-brand-muted" : "text-brand-navy/80"
                }`}
              >
                {due}
              </span>
            ) : null}
            <span className="mt-1 block text-[13px] text-brand-navy/75">{record.responsibleParty}</span>
          </span>
          <IconChevronRight className="h-4 w-4 shrink-0 self-center text-brand-mist/80 transition group-active:text-brand-muted" />
        </span>
      </Link>
    </li>
  );
}

export function SubmittalsListScreen() {
  const { currentProject, openProjectSelector, isOffline, accessibleProjects, user } = useMobileApp();
  const allowed = canAccessToolSlug(
    "submittals",
    user.role,
    accessibleProjects.map((p) => p.id),
    currentProject.id,
  );
  const storeVersion = useSyncExternalStore(
    subscribeSubmittals,
    getSubmittalStoreVersion,
    () => 0,
  );

  const [filter, setFilter] = useState<SubmittalFilter>("all");
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
      const cached = projectSubmittals(currentProject.id, today);
      setPhase(isOffline && cached.length === 0 ? "error" : "ready");
    }, 320);
    return () => window.clearTimeout(timer);
  }, [currentProject.id, today, isOffline, retry]);

  const records = useMemo(() => {
    if (!today) return [];
    return projectSubmittals(currentProject.id, today);
  }, [currentProject.id, today, storeVersion]);

  const visible = today ? visibleSubmittals(records, filter, query) : [];

  if (!allowed) {
    return <PermissionDeniedScreen backHref="/mobile-preview/more" />;
  }

  return (
    <div className={`${mobilePageBg} overflow-x-hidden`}>
      <div className="mx-auto max-w-lg px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(12px,env(safe-area-inset-top))]">
        <header className="border-b border-brand-line/45 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-mist">Submittals</p>
              <h1 className="mt-1 text-[26px] font-bold leading-none tracking-[-0.04em] text-brand-navy">Submittals</h1>
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
            <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">Unable to load Submittals</h2>
            <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
              Connect to load Submittals for this project.
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
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-mist">All submittals</h2>
                <p className="text-[13px] font-semibold tabular-nums text-brand-navy">{pad2(visible.length)}</p>
              </div>

              <div
                className="mt-3 -mx-4 flex gap-0 overflow-x-auto scroll-smooth border-b border-brand-line/45 px-4 pb-0 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="tablist"
                aria-label="Submittal status filter"
              >
                {SUBMITTAL_FILTERS.map((item, index) => {
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
                  placeholder="Search submittals…"
                  aria-label="Search submittals"
                  className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-brand-navy outline-none placeholder:text-brand-mist/90"
                />
              </label>

              {visible.length === 0 ? (
                <div className="pt-10">
                  <h3 className="text-[18px] font-bold tracking-[-0.03em] text-brand-navy">Nothing in this view</h3>
                  <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
                    Try another status, or search by number, title, or responsible party.
                  </p>
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-[16px] border border-brand-line/55 bg-white shadow-[0_1px_0_rgba(8,35,63,0.04)]">
                  <ul className="divide-y divide-brand-line/50">
                    {visible.map((record, index) => (
                      <RegisterRow key={record.id} record={record} today={today} alternate={index % 2 === 1} />
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ) : (
            <div className="pt-12">
              <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">No Submittals yet</h2>
              <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
                There are no Submittals for this project.
              </p>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
