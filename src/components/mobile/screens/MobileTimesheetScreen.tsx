"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  loadMobileTimesheet,
  timesheetStatusTone,
  validateTimesheetSubmission,
  type MobileTimesheetView,
} from "@/lib/mobile/timesheet";
import {
  TIME_ROUTES,
  formatDurationMinutes,
  loadTimeShiftState,
  syncProjectContext,
  timesheetStatusLabel,
  type TimeShiftState,
} from "@/lib/mobile/timeTracking";
import { mobileElevatedCard, mobileInsetCard, mobileListRow, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { IconBack, IconChevronRight } from "../icons";
import { StatusBadge } from "../ui/StatusBadge";

type Phase = "loading" | "ready" | "empty" | "error";

export function MobileTimesheetScreen() {
  const { user, currentProject } = useMobileApp();
  const { session } = useMobileAuth();

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;
  const reporterEmail = session?.email ?? "demo@summitconstruction.com";

  const [phase, setPhase] = useState<Phase>("loading");
  const [shift, setShift] = useState<TimeShiftState | null>(null);
  const [view, setView] = useState<MobileTimesheetView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reloadShift = useCallback(() => {
    let state = loadTimeShiftState(userKey, currentProject.id, currentProject.name);
    state = syncProjectContext(userKey, state, currentProject.id, currentProject.name);
    setShift(state);
    return state;
  }, [userKey, currentProject.id, currentProject.name]);

  const fetchTimesheet = useCallback(async () => {
    setPhase("loading");
    setErrorMessage(null);
    const state = reloadShift();
    const result = await loadMobileTimesheet({
      userKey,
      reporterEmail,
      shift: state,
      projectId: currentProject.id,
      projectName: currentProject.name,
    });

    if (!result.ok) {
      setErrorMessage(result.message);
      setPhase("error");
      return;
    }

    setView(result.view);
    setPhase(result.empty ? "empty" : "ready");
  }, [userKey, reporterEmail, reloadShift, currentProject.id, currentProject.name]);

  useEffect(() => {
    void fetchTimesheet();
  }, [fetchTimesheet]);

  if (phase === "loading") {
    return (
      <div className={mobilePageBg}>
        <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="h-6 w-40 animate-pulse rounded bg-brand-soft" />
          <div className="mt-6 h-56 animate-pulse rounded-[18px] bg-brand-soft/80" />
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={mobilePageBg}>
        <header className="border-b border-brand-line/50 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <Link
              href={TIME_ROUTES.home}
              className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
              aria-label="Back to Time"
            >
              <IconBack />
            </Link>
            <h1 className="text-[17px] font-semibold text-brand-navy">Timesheet</h1>
          </div>
        </header>
        <main className="px-4 py-8">
          <div className={`${mobileInsetCard} p-5`} role="alert">
            <p className="text-[15px] font-semibold text-status-danger">Timesheet unavailable</p>
            <p className="mt-2 text-[14px] text-brand-navy">{errorMessage}</p>
            <button type="button" onClick={() => void fetchTimesheet()} className="m-press mt-4 text-[14px] font-semibold text-brand-blue">
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (phase === "empty" || !view) {
    return (
      <div className={mobilePageBg}>
        <header className="border-b border-brand-line/50 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <Link href={TIME_ROUTES.home} className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft" aria-label="Back to Time">
              <IconBack />
            </Link>
            <h1 className="text-[17px] font-semibold text-brand-navy">Timesheet</h1>
          </div>
        </header>
        <main className="px-4 py-8 pb-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))]">
          <div className={`${mobileInsetCard} p-5 text-center`}>
            <StatusBadge tone="neutral" label="No entries" />
            <p className="mt-3 text-[15px] leading-relaxed text-brand-navy">
              No time entries for <span className="font-semibold">{currentProject.name}</span> in this pay period.
            </p>
            <p className="mt-2 text-[13px] text-brand-muted">Clock in from Time home when you start work.</p>
            <Link href={TIME_ROUTES.home} className="m-press mt-5 inline-flex h-11 items-center justify-center rounded-full bg-brand-blue px-6 text-[15px] font-semibold text-white">
              Back to Time
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const statusTone = timesheetStatusTone(view.approvalStatus);
  const submitCheck = validateTimesheetSubmission(view);

  return (
    <div className={mobilePageBg}>
      <header className="border-b border-brand-line/50 bg-brand-canvas/95 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <Link
            href={TIME_ROUTES.home}
            className="m-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
            aria-label="Back to Time"
          >
            <IconBack />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-brand-navy">Timesheet</h1>
            <p className="text-[13px] text-brand-muted">{view.weekLabel}</p>
            <p className="mt-0.5 truncate text-[12px] text-brand-mist">{view.projectName}</p>
          </div>
        </div>
      </header>

      <main className="space-y-4 px-4 py-4 pb-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))]">
        <p className="text-[11px] font-medium uppercase tracking-wide text-brand-mist">Payroll preview</p>

        <section className={`${mobileElevatedCard} p-4`} aria-labelledby="ts-overview">
          <h2 id="ts-overview" className="text-[12px] font-semibold uppercase tracking-wide text-brand-muted">
            Overview
          </h2>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase text-brand-mist">Period total</p>
              <p className="font-mono text-[28px] font-bold tabular-nums tracking-[-0.03em] text-brand-navy">
                {formatDurationMinutes(view.periodTotalMinutes)}
              </p>
              {view.todayMinutes > 0 ? (
                <p className="mt-1 text-[13px] text-brand-muted">
                  Today (active): <span className="font-semibold tabular-nums text-brand-navy">{formatDurationMinutes(view.todayMinutes)}</span>
                </p>
              ) : null}
            </div>
            <StatusBadge tone={statusTone} label={timesheetStatusLabel(view.approvalStatus)} />
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-brand-navy">{view.statusExplanation}</p>
          {view.hasIncompleteEntry ? (
            <p className="mt-2 text-[13px] font-medium text-[#8A6232]" role="status">
              An entry is still in progress — clock-out times are not final until the shift ends.
            </p>
          ) : null}
        </section>

        <section aria-labelledby="ts-entries-heading">
          <h2 id="ts-entries-heading" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
            Time entries
          </h2>
          <ul className={`mt-3 ${mobileElevatedCard} divide-y divide-brand-line/60`}>
            {view.entries.map((entry) => (
              <li key={entry.id} className={`${mobileListRow} flex-col items-stretch gap-2 py-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-brand-navy">{entry.dayLabel}</p>
                    <p className="text-[12px] text-brand-muted">{entry.workDateLabel}</p>
                  </div>
                  {entry.hoursLabel ? (
                    <p className="shrink-0 font-mono text-[15px] font-bold tabular-nums text-brand-navy">{entry.hoursLabel}</p>
                  ) : (
                    <p className="shrink-0 text-[13px] text-brand-muted">—</p>
                  )}
                </div>
                {entry.rangeLabel ? (
                  <p className="text-[13px] text-brand-navy">
                    <span className="text-brand-muted">Hours: </span>
                    {entry.rangeLabel}
                  </p>
                ) : null}
                {entry.crewLabel ? (
                  <p className="text-[12px] text-brand-muted">Crew: {entry.crewLabel}</p>
                ) : null}
                {!entry.complete ? (
                  <StatusBadge tone="warning" label="In progress" />
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className={`${mobileInsetCard} p-4`}>
          <p className="text-[14px] font-semibold text-brand-navy">Next steps</p>
          <p className="mt-1 text-[13px] text-brand-muted">
            {view.pendingSubmit
              ? "When entries are complete, submit for reviewer approval."
              : "Submitted — awaiting review. Check approval status when your reviewer responds."}
          </p>
          {submitCheck.canSubmit ? (
            <Link href={TIME_ROUTES.submitTimesheet} className={`m-press mt-3 ${mobileListRow} active:bg-brand-soft/60`}>
              <span className="flex-1 text-[15px] font-semibold text-brand-navy">Submit timesheet</span>
              <span className="text-[12px] text-brand-muted">Review</span>
              <IconChevronRight className="h-[18px] w-[18px] text-brand-mist" aria-hidden="true" />
            </Link>
          ) : (
            <div className={`mt-3 ${mobileListRow} cursor-default opacity-75`}>
              <span className="flex-1 text-[15px] font-semibold text-brand-muted">Submit timesheet</span>
              <span className="text-[12px] text-brand-muted">Unavailable</span>
            </div>
          )}
          <Link href={TIME_ROUTES.timesheetApproved} className={`m-press mt-2 ${mobileListRow} active:bg-brand-soft/60`}>
            <span className="flex-1 text-[15px] font-semibold text-brand-navy">Approval status</span>
            <span className="text-[12px] text-brand-muted">Status</span>
            <IconChevronRight className="h-[18px] w-[18px] text-brand-mist" aria-hidden="true" />
          </Link>
        </section>

        <button type="button" onClick={() => void fetchTimesheet()} className="m-press text-[13px] font-semibold text-brand-blue">
          Refresh timesheet
        </button>
      </main>
    </div>
  );
}
