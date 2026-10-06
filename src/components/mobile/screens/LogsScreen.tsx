"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { mobilePageBg } from "@/lib/mobile/mobileUi";
import {
  addIsoDays,
  canAuthorDailyLog,
  createDailyLog,
  dayNumber,
  findDailyLog,
  formatHeroDate,
  formatMonthShort,
  formatMonthYear,
  formatWeekdayShort,
  getServerSessionLogs,
  getSessionLogs,
  logActionLabel,
  projectDailyLogs,
  projectSyncLine,
  startOfWeekIso,
  subscribeDailyLogs,
  todayIso,
} from "@/lib/mobile/dailyLogs";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import type { MockDailyLog } from "@/lib/mobile/types";
import { DailyLogStatusMark } from "../DailyLogStatusMark";
import { IconChevronDown, IconChevronRight } from "../icons";

function recentMeta(log: MockDailyLog): string | null {
  if (log.status === "submitted") return log.savedLabel.replace(/^Submitted\s+/i, "") || null;
  if (log.status === "synced") return log.savedLabel.replace(/^Synced\s+/i, "") || null;
  return log.savedLabel;
}

function WeekButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="m-press flex h-9 w-9 items-center justify-center rounded-full text-brand-navy disabled:opacity-30"
    >
      <IconChevronRight className={label.startsWith("Previous") ? "rotate-180" : undefined} />
    </button>
  );
}

function LogsSkeleton() {
  return (
    <div className="px-4 pb-6" aria-hidden="true">
      <div className="mt-5 h-[92px] animate-pulse rounded-[18px] bg-white/80" />
      <div className="mt-5 h-[148px] animate-pulse rounded-[18px] border border-brand-line/50 bg-white" />
      <div className="mt-6 h-3 w-16 animate-pulse rounded bg-brand-line/80" />
      <div className="mt-3 space-y-2">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-[76px] animate-pulse rounded-[16px] border border-brand-line/50 bg-white"
          />
        ))}
      </div>
    </div>
  );
}

export function LogsScreen() {
  const router = useRouter();
  const { user, currentProject, openProjectSelector, isOffline } = useMobileApp();
  const session = useSyncExternalStore(subscribeDailyLogs, getSessionLogs, getServerSessionLogs);
  const canAuthor = canAuthorDailyLog(user.role);

  const [today, setToday] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [retryTick, setRetryTick] = useState(0);
  const [duplicateDate, setDuplicateDate] = useState<string | null>(null);

  useEffect(() => {
    setToday(todayIso());
    setSelectedDate(todayIso());
    setDuplicateDate(null);
  }, [currentProject.id]);

  useEffect(() => {
    if (!today) return;
    setPhase("loading");
    const timer = window.setTimeout(() => {
      const cached = projectDailyLogs(currentProject.id, getSessionLogs(), today);
      setPhase(isOffline && cached.length === 0 ? "error" : "ready");
    }, 360);
    return () => window.clearTimeout(timer);
  }, [currentProject.id, today, isOffline, retryTick]);

  const logs = useMemo(() => {
    if (!today) return [];
    return projectDailyLogs(currentProject.id, session, today);
  }, [currentProject.id, session, today]);

  const selected = selectedDate ?? today;
  const selectedLog = selected ? findDailyLog(logs, selected) : undefined;
  const recent = selected ? logs.filter((log) => log.date !== selected) : logs;
  const week = selected ? Array.from({ length: 7 }, (_, index) => addIsoDays(startOfWeekIso(selected), index)) : [];
  const isToday = Boolean(selected && today && selected === today);
  const isFuture = Boolean(selected && today && selected > today);
  const projectEmpty = logs.length === 0;
  const showDuplicate = Boolean(duplicateDate && selected && duplicateDate === selected);

  function openLog(log: MockDailyLog) {
    router.push(`/mobile-preview/logs/${log.id}`);
  }

  function startLog(date: string) {
    if (!today || !canAuthor || date > today) return;
    const result = createDailyLog(currentProject.id, date, today);
    if (!result.created) {
      setDuplicateDate(date);
      setSelectedDate(date);
      return;
    }
    openLog(result.log);
  }

  function requestNewLog() {
    if (!selected || !today || !canAuthor || phase !== "ready") return;
    const date = selected > today ? today : selected;
    if (selected > today) setSelectedDate(today);
    const existing = findDailyLog(logs, date);
    if (existing) {
      setDuplicateDate(date);
      setSelectedDate(date);
      return;
    }
    startLog(date);
  }

  function shiftWeek(days: number) {
    if (!selected || !today) return;
    const next = addIsoDays(selected, days);
    setSelectedDate(next > today ? today : next);
    setDuplicateDate(null);
  }

  return (
    <div className={mobilePageBg}>
      <header className="px-4 pb-1 pt-[max(14px,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-brand-navy">Daily Logs</h1>
          {canAuthor ? (
            <button
              type="button"
              onClick={requestNewLog}
              disabled={phase !== "ready"}
              className="m-press mt-0.5 inline-flex h-10 items-center rounded-full bg-brand-navy px-4 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              New Log
            </button>
          ) : (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">
              View only
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={openProjectSelector}
          className="m-press mt-3 flex min-h-[44px] w-full items-center gap-3 py-1 text-left"
          aria-label={`Active project, ${currentProject.name}, ${currentProject.city}, ${currentProject.state}. Change project.`}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[16px] font-semibold tracking-[-0.02em] text-brand-navy">
              {currentProject.name}
            </span>
            <span className="mt-0.5 block truncate text-[13px] text-brand-muted">
              {currentProject.city}, {currentProject.state}
            </span>
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-mist">
            <IconChevronDown />
          </span>
        </button>

        {phase === "ready" && projectSyncLine(logs, isOffline) ? (
          <p className="pb-1 text-[12px] font-medium text-brand-muted" role="status">
            {projectSyncLine(logs, isOffline)}
          </p>
        ) : null}
      </header>

      {phase === "error" ? (
        <main className="px-4 pb-8 pt-8">
          <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">
            Daily Logs unavailable
          </h2>
          <p className="mt-2 max-w-[32ch] text-[14px] leading-relaxed text-brand-muted">
            We couldn&apos;t load your project logs right now.
          </p>
          <button
            type="button"
            onClick={() => setRetryTick((value) => value + 1)}
            className="m-press mt-5 inline-flex h-11 items-center rounded-full bg-brand-navy px-5 text-[14px] font-semibold text-white"
          >
            Try Again
          </button>
        </main>
      ) : null}

      {phase !== "ready" && phase !== "error" ? <LogsSkeleton /> : null}

      {phase === "ready" && selected && today ? (
        <main className="px-4 pb-8 pt-2">
          <section aria-label="Choose a date">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold tracking-[-0.01em] text-brand-navy">
                {formatMonthYear(selected)}
              </p>
              <div className="flex items-center">
                <WeekButton label="Previous week" onClick={() => shiftWeek(-7)} />
                <WeekButton
                  label="Next week"
                  onClick={() => shiftWeek(7)}
                  disabled={addIsoDays(startOfWeekIso(selected), 7) > today}
                />
              </div>
            </div>
            <div className="mt-1 grid grid-cols-7 border-b border-brand-line/70 pb-3">
              {week.map((iso) => {
                const active = iso === selected;
                const hasLog = Boolean(findDailyLog(logs, iso));
                const future = iso > today;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(iso);
                      setDuplicateDate(null);
                    }}
                    aria-pressed={active}
                    aria-label={`${formatHeroDate(iso)}${hasLog ? ", log on file" : ", no log"}${active ? ", selected" : ""}`}
                    className={`m-press flex h-[62px] flex-col items-center justify-center rounded-[14px] ${
                      active
                        ? "bg-brand-navy text-white"
                        : future
                          ? "text-brand-mist"
                          : "text-brand-navy"
                    }`}
                  >
                    <span className={`text-[10px] font-semibold tracking-[0.01em] ${active ? "text-white/75" : "text-brand-mist"}`}>
                      {formatWeekdayShort(iso)}
                    </span>
                    <span
                      className={`mt-0.5 text-[15px] font-semibold tabular-nums ${
                        !active && iso === today ? "text-brand-blue" : ""
                      }`}
                    >
                      {dayNumber(iso)}
                    </span>
                    <span
                      className={`mt-1 h-1 w-1 rounded-full ${
                        hasLog ? (active ? "bg-white" : "bg-brand-blue") : "opacity-0"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </section>

          <article
            className="mt-4 rounded-[18px] border border-brand-line/60 bg-white px-4 py-4 shadow-[0_2px_12px_rgba(8,35,63,0.06)]"
            aria-live="polite"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">
              {isToday ? "Today" : formatWeekdayShort(selected)}
            </p>
            <h2 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-brand-navy">
              {formatHeroDate(selected)}
            </h2>

            {selectedLog ? (
              <>
                <p className="mt-4 text-[12px] font-medium text-brand-mist">Daily Log</p>
                <p className="mt-0.5 text-[16px] font-semibold tracking-[-0.02em] text-brand-navy">
                  {selectedLog.summary}
                </p>
                <p className="mt-1 truncate text-[13px] text-brand-muted">{currentProject.name}</p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-line/70 pt-3">
                  <DailyLogStatusMark status={selectedLog.status} />
                  <p className="text-right text-[12px] text-brand-muted">{selectedLog.savedLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openLog(selectedLog)}
                  className="m-press mt-4 inline-flex h-11 items-center rounded-full bg-brand-navy px-5 text-[14px] font-semibold text-white"
                >
                  {logActionLabel(selectedLog.status, canAuthor)}
                </button>
              </>
            ) : projectEmpty && isToday ? (
              <>
                <p className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-brand-navy">
                  No daily logs yet
                </p>
                <p className="mt-2 max-w-[30ch] text-[14px] leading-relaxed text-brand-muted">
                  {canAuthor
                    ? "Start documenting today's field activity."
                    : "Logs for this project will appear here."}
                </p>
                {canAuthor ? (
                  <button
                    type="button"
                    onClick={() => startLog(selected)}
                    className="m-press mt-4 inline-flex h-11 items-center rounded-full bg-brand-navy px-5 text-[14px] font-semibold text-white"
                  >
                    Start New Log
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <p className="mt-4 text-[16px] font-semibold tracking-[-0.02em] text-brand-navy">
                  {isFuture ? "This day hasn't started." : "No daily log started yet."}
                </p>
                <p className="mt-1.5 max-w-[32ch] text-[13px] leading-relaxed text-brand-muted">
                  {isFuture
                    ? "Daily logs are recorded on the day of the work."
                    : canAuthor
                      ? "One log is kept for each project and date."
                      : "Nothing has been filed for this date."}
                </p>
                {canAuthor && !isFuture ? (
                  <button
                    type="button"
                    onClick={() => startLog(selected)}
                    className="m-press mt-4 inline-flex h-11 items-center rounded-full bg-brand-navy px-5 text-[14px] font-semibold text-white"
                  >
                    {isToday ? "Start Today's Log" : "Start Log"}
                  </button>
                ) : null}
              </>
            )}

            {showDuplicate ? (
              <p className="mt-4 rounded-[12px] bg-[#F6F3EE] px-3 py-2.5 text-[13px] leading-snug text-[#5C5348]">
                A daily log already exists for this project and date. Open that log instead of
                starting another.
              </p>
            ) : null}
          </article>

          {recent.length > 0 ? (
            <section className="mt-7" aria-label="Recent logs">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-mist">
                Recent
              </h2>
              <ul className="mt-2.5 space-y-2">
                {recent.map((log) => (
                  <li key={log.id}>
                    <button
                      type="button"
                      onClick={() => openLog(log)}
                      className="m-press flex w-full items-center gap-3 rounded-[16px] border border-brand-line/60 bg-white px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(8,35,63,0.04)]"
                    >
                      <span className="w-11 shrink-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-mist">
                          {formatMonthShort(log.date)}
                        </span>
                        <span className="mt-0.5 block text-[20px] font-bold leading-none tracking-[-0.03em] text-brand-navy">
                          {dayNumber(log.date)}
                        </span>
                        <span className="mt-1 block text-[11px] text-brand-muted">
                          {formatWeekdayShort(log.date)}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 border-l border-brand-line/80 pl-3">
                        <span className="block text-[12px] font-medium text-brand-mist">Daily Log</span>
                        <span className="mt-0.5 block truncate text-[14px] font-semibold text-brand-navy">
                          {log.summary}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <DailyLogStatusMark status={log.status} />
                          {recentMeta(log) ? (
                            <span className="text-[11px] text-brand-muted">{recentMeta(log)}</span>
                          ) : null}
                        </span>
                      </span>
                      <IconChevronRight className="shrink-0 text-brand-mist" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>
      ) : null}
    </div>
  );
}
