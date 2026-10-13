"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  TIMESHEET_APPROVED_DEMO_EMAIL,
  loadTimesheetApprovalSnapshot,
  type TimesheetApprovalSnapshot,
} from "@/lib/mobile/timesheet";
import {
  TIME_ROUTES,
  formatDurationMinutes,
  formatTimeLabel,
  loadTimeShiftState,
  syncProjectContext,
  timesheetStatusLabel,
} from "@/lib/mobile/timeTracking";
import { mobileElevatedCard, mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { IconBack } from "../icons";
import { StatusBadge } from "../ui/StatusBadge";

type Phase = "loading" | "ready" | "error";

function ApprovedMark() {
  return (
    <div
      className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-status-success ring-2 ring-status-success/25"
      aria-hidden="true"
    >
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6 9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function TimesheetApprovedScreen() {
  const { user, currentProject } = useMobileApp();
  const { session } = useMobileAuth();

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;
  const reporterEmail = session?.email ?? "demo@summitconstruction.com";

  const [phase, setPhase] = useState<Phase>("loading");
  const [snapshot, setSnapshot] = useState<TimesheetApprovalSnapshot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reloadShift = useCallback(() => {
    let state = loadTimeShiftState(userKey, currentProject.id, currentProject.name);
    state = syncProjectContext(userKey, state, currentProject.id, currentProject.name);
    return state;
  }, [userKey, currentProject.id, currentProject.name]);

  const fetchApproval = useCallback(async () => {
    setPhase("loading");
    setErrorMessage(null);
    const shift = reloadShift();
    const result = await loadTimesheetApprovalSnapshot({
      userKey,
      reporterEmail,
      shift,
      projectId: currentProject.id,
      projectName: currentProject.name,
    });

    if (!result.ok) {
      setErrorMessage(result.message);
      setPhase("error");
      return;
    }

    setSnapshot(result.snapshot);
    setPhase("ready");
  }, [userKey, reporterEmail, reloadShift, currentProject.id, currentProject.name]);

  useEffect(() => {
    void fetchApproval();
  }, [fetchApproval]);

  if (phase === "loading") {
    return (
      <div className={mobilePageBg}>
        <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="h-6 w-52 animate-pulse rounded bg-brand-soft" />
          <div className="mt-6 h-52 animate-pulse rounded-[18px] bg-brand-soft/80" />
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={mobilePageBg}>
        <header className="border-b border-brand-line/50 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <Link href={TIME_ROUTES.timesheet} className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft" aria-label="Back">
              <IconBack />
            </Link>
            <h1 className="text-[17px] font-semibold text-brand-navy">Timesheet status</h1>
          </div>
        </header>
        <main className="px-4 py-8">
          <div className={`${mobileInsetCard} p-5`} role="alert">
            <p className="text-[15px] font-semibold text-status-danger">Status unavailable</p>
            <p className="mt-2 text-[14px] text-brand-navy">{errorMessage}</p>
            <button type="button" onClick={() => void fetchApproval()} className="m-press mt-4 text-[14px] font-semibold text-brand-blue">
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!snapshot) return null;

  const isApproved = snapshot.phase === "approved";

  return (
    <div className={mobilePageBg}>
      <header className="border-b border-brand-line/50 bg-brand-canvas/95 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <Link
            href={TIME_ROUTES.timesheet}
            className="m-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
            aria-label="Back to timesheet"
          >
            <IconBack />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-brand-navy">Timesheet status</h1>
            <p className="text-[13px] text-brand-muted">{snapshot.weekLabel}</p>
          </div>
        </div>
      </header>

      <main className="space-y-4 px-4 py-4 pb-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))]">
        <p className="text-[11px] font-medium uppercase tracking-wide text-brand-mist">
          Payroll status — refreshed from device storage
        </p>

        {isApproved ? (
          <section className={`${mobileElevatedCard} p-5 text-center`} aria-labelledby="approved-heading">
            <ApprovedMark />
            <h2 id="approved-heading" className="mt-4 text-[20px] font-bold tracking-[-0.02em] text-brand-navy">
              Timesheet approved
            </h2>
            <div className="mt-3 flex justify-center">
              <StatusBadge tone="success" label={timesheetStatusLabel("approved")} />
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-brand-navy">
              Your submitted time for <span className="font-semibold">{snapshot.projectName}</span> is approved.
            </p>
          </section>
        ) : snapshot.phase === "pending_review" ? (
          <section className={`${mobileElevatedCard} p-5`} role="status">
            <StatusBadge tone="warning" label="Pending review" />
            <h2 className="mt-3 text-[18px] font-bold text-brand-navy">Not approved yet</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">
              This timesheet was submitted and is waiting for reviewer approval. Submission does not mean approved.
            </p>
            {snapshot.submittedAt ? (
              <p className="mt-2 text-[13px] text-brand-navy">
                Submitted {formatTimeLabel(new Date(snapshot.submittedAt))}
              </p>
            ) : null}
            <p className="mt-3 text-[12px] text-brand-mist">
              Sign in as {TIMESHEET_APPROVED_DEMO_EMAIL} and refresh to simulate approver completion.
            </p>
          </section>
        ) : (
          <section className={`${mobileElevatedCard} p-5`} role="status">
            <StatusBadge tone="neutral" label="Not submitted" />
            <h2 className="mt-3 text-[18px] font-bold text-brand-navy">No submitted timesheet</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">
              Submit your timesheet before approval status applies.
            </p>
            <Link href={TIME_ROUTES.submitTimesheet} className="m-press mt-4 inline-flex text-[14px] font-semibold text-brand-blue">
              Go to submit timesheet
            </Link>
          </section>
        )}

        <section className={`${mobileInsetCard} p-4`}>
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">Summary</h3>
          <p className="mt-2 text-[16px] font-bold text-brand-navy">{snapshot.projectName}</p>
          <p className="mt-3 font-mono text-[24px] font-bold tabular-nums text-brand-navy">
            {formatDurationMinutes(snapshot.periodTotalMinutes)}
          </p>
          <p className="mt-1 text-[13px] text-brand-muted">
            {snapshot.entryCount} entr{snapshot.entryCount === 1 ? "y" : "ies"} · {timesheetStatusLabel(snapshot.approvalStatus)}
          </p>
        </section>

        {isApproved && snapshot.approvedAt ? (
          <section className={`${mobileInsetCard} p-4`}>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">Approval details</h3>
            <p className="mt-2 text-[14px] text-brand-navy">
              Approved {formatTimeLabel(new Date(snapshot.approvedAt))}
            </p>
            {snapshot.approverName ? (
              <p className="mt-1 text-[14px] text-brand-navy">
                Approver: <span className="font-semibold">{snapshot.approverName}</span>
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href={TIME_ROUTES.timesheet}
            className="m-press flex h-12 items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white"
          >
            View timesheet
          </Link>
          <Link href={TIME_ROUTES.home} className="m-press flex h-11 items-center justify-center text-[15px] font-semibold text-brand-blue">
            Back to Time
          </Link>
          {!isApproved ? (
            <button type="button" onClick={() => void fetchApproval()} className="m-press text-[13px] font-semibold text-brand-blue">
              Refresh status
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
}
