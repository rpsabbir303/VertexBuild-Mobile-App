"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadMobileTimesheet,
  submitTimesheet,
  validateTimesheetSubmission,
  type MobileTimesheetView,
} from "@/lib/mobile/timesheet";
import {
  TIME_ROUTES,
  formatDurationMinutes,
  formatTimeLabel,
  loadTimeShiftState,
  syncProjectContext,
  timesheetStatusLabel,
  type TimeShiftState,
} from "@/lib/mobile/timeTracking";
import { mobileElevatedCard, mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { IconBack } from "../icons";
import { StatusBadge } from "../ui/StatusBadge";

type Phase = "loading" | "review" | "success" | "error";

export function SubmitTimesheetScreen() {
  const { user, currentProject, isOffline } = useMobileApp();
  const { session } = useMobileAuth();

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;
  const reporterEmail = session?.email ?? "demo@summitconstruction.com";

  const [phase, setPhase] = useState<Phase>("loading");
  const [shift, setShift] = useState<TimeShiftState | null>(null);
  const [view, setView] = useState<MobileTimesheetView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successReference, setSuccessReference] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const reloadShift = useCallback(() => {
    let state = loadTimeShiftState(userKey, currentProject.id, currentProject.name);
    state = syncProjectContext(userKey, state, currentProject.id, currentProject.name);
    setShift(state);
    return state;
  }, [userKey, currentProject.id, currentProject.name]);

  const loadReview = useCallback(async () => {
    setPhase("loading");
    setLoadError(null);
    setSubmitError(null);
    const state = reloadShift();
    const result = await loadMobileTimesheet({
      userKey,
      reporterEmail,
      shift: state,
      projectId: currentProject.id,
      projectName: currentProject.name,
    });

    if (!result.ok) {
      setLoadError(result.message);
      setPhase("error");
      return;
    }

    setView(result.view);
    setPhase("review");
  }, [userKey, reporterEmail, reloadShift, currentProject.id, currentProject.name]);

  useEffect(() => {
    void loadReview();
  }, [loadReview]);

  const validation = view ? validateTimesheetSubmission(view) : { canSubmit: false, issues: [] };

  async function handleConfirmSubmit() {
    if (!view || !validation.canSubmit || submitting || inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    const result = await submitTimesheet({
      userKey,
      reporterEmail,
      projectId: currentProject.id,
      projectName: currentProject.name,
      view,
      offline: isOffline,
    });

    setSubmitting(false);
    inFlightRef.current = false;
    setConfirmOpen(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    setSuccessReference(result.reference);
    setSubmittedAt(result.submittedAt);
    setPhase("success");
  }

  if (phase === "loading") {
    return (
      <div className={mobilePageBg}>
        <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="h-6 w-48 animate-pulse rounded bg-brand-soft" />
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
            <Link href={TIME_ROUTES.timesheet} className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft" aria-label="Back">
              <IconBack />
            </Link>
            <h1 className="text-[17px] font-semibold text-brand-navy">Submit timesheet</h1>
          </div>
        </header>
        <main className="px-4 py-8">
          <div className={`${mobileInsetCard} p-5`} role="alert">
            <p className="text-[15px] font-semibold text-status-danger">Could not load timesheet</p>
            <p className="mt-2 text-[14px] text-brand-navy">{loadError}</p>
            <button type="button" onClick={() => void loadReview()} className="m-press mt-4 text-[14px] font-semibold text-brand-blue">
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (phase === "success" && successReference) {
    return (
      <div className={mobilePageBg}>
        <main className="px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(24px,env(safe-area-inset-top))]">
          <div className={`${mobileInsetCard} p-5`}>
            <StatusBadge tone="success" label="Submitted for review" />
            <h1 className="mt-3 text-[22px] font-bold tracking-[-0.03em] text-brand-navy">Timesheet submitted</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">
              Status is <span className="font-semibold text-brand-navy">Pending review</span> — not approved. Approval is
              handled separately after submission.
            </p>
            {submittedAt ? (
              <p className="mt-2 text-[13px] text-brand-muted">Submitted {formatTimeLabel(new Date(submittedAt))}</p>
            ) : null}
            <div className="mt-4 rounded-[12px] bg-brand-soft px-3.5 py-3">
              <p className="text-[12px] font-medium text-brand-muted">Reference</p>
              <p className="mt-0.5 font-mono text-[16px] font-semibold text-brand-navy">{successReference}</p>
            </div>
            <Link
              href={TIME_ROUTES.timesheet}
              className="m-press mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white"
            >
              View timesheet
            </Link>
            <Link href={TIME_ROUTES.home} className="m-press mt-3 flex h-11 w-full items-center justify-center text-[15px] font-semibold text-brand-blue">
              Back to Time
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!view) return null;

  return (
    <div className={`${mobilePageBg} relative`}>
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
            <h1 className="text-[17px] font-semibold text-brand-navy">Submit timesheet</h1>
            <p className="text-[13px] text-brand-muted">Review before sending for approval</p>
          </div>
        </div>
      </header>

      <main className="space-y-4 px-4 py-4 pb-[max(10rem,calc(env(safe-area-inset-bottom)+9rem))]">
        <p className="text-[11px] font-medium uppercase tracking-wide text-brand-mist">
          Saved on this device
        </p>

        <section className={`${mobileElevatedCard} p-4`}>
          <p className="text-[11px] font-semibold uppercase text-brand-mist">{view.weekLabel}</p>
          <p className="mt-1 text-[16px] font-bold text-brand-navy">{view.projectName}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[22px] font-bold tabular-nums text-brand-navy">
              {formatDurationMinutes(view.periodTotalMinutes)}
            </p>
            <StatusBadge tone="warning" label={timesheetStatusLabel(view.approvalStatus)} />
          </div>
          <p className="mt-2 text-[13px] text-brand-muted">{view.entries.length} entr{view.entries.length === 1 ? "y" : "ies"} in this review</p>
        </section>

        <section className={`${mobileInsetCard} p-4`}>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">Entries summary</h2>
          <ul className="mt-3 space-y-2">
            {view.entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-2 text-[14px]">
                <span className="min-w-0 truncate text-brand-navy">
                  {entry.dayLabel}
                  {!entry.complete ? " (in progress)" : ""}
                </span>
                <span className="shrink-0 font-mono font-semibold tabular-nums text-brand-navy">{entry.hoursLabel ?? "—"}</span>
              </li>
            ))}
          </ul>
        </section>

        {validation.issues.length > 0 ? (
          <section className="rounded-[14px] border border-[#E8D4A8] bg-[#FFF8EB] px-4 py-3.5" role="alert">
            <p className="text-[14px] font-semibold text-[#8A6232]">Submission blocked</p>
            <ul className="mt-2 space-y-2">
              {validation.issues.map((issue) => (
                <li key={issue.message} className="text-[13px] text-brand-navy">
                  {issue.message}
                  {issue.href ? (
                    <>
                      {" "}
                      <Link href={issue.href} className="font-semibold text-brand-blue">
                        Go there
                      </Link>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {submitError ? (
          <div className="rounded-[12px] border border-status-danger/30 bg-red-50 px-3 py-2.5" role="alert">
            <p className="text-[14px] font-semibold text-status-danger">Submission failed</p>
            <p className="mt-0.5 text-[13px] text-brand-navy">{submitError}</p>
            <button type="button" onClick={() => setConfirmOpen(true)} className="m-press mt-2 text-[13px] font-semibold text-brand-blue">
              Try again
            </button>
          </div>
        ) : null}

        {isOffline ? (
          <p className="text-[13px] font-medium text-[#8A6232]" role="status">
            Offline — submission is disabled until you reconnect.
          </p>
        ) : null}

      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line/60 bg-brand-canvas/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <button
          type="button"
          disabled={!validation.canSubmit || submitting || isOffline}
          onClick={() => setConfirmOpen(true)}
          className="m-press mx-auto flex h-[52px] w-full max-w-lg items-center justify-center rounded-[14px] bg-brand-blue text-[16px] font-semibold text-white shadow-glow disabled:opacity-50"
        >
          Submit timesheet
        </button>
      </div>

      {confirmOpen ? (
        <div className="absolute inset-0 z-50 flex items-end" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-brand-ink/35"
            aria-label="Dismiss"
            onClick={() => !submitting && setConfirmOpen(false)}
          />
          <div
            className="relative z-10 w-full rounded-t-[22px] border border-brand-line/70 bg-white px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 shadow-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-confirm-title"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />
            <h2 id="submit-confirm-title" className="text-[18px] font-bold text-brand-navy">
              Submit for review?
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">
              Send <span className="font-semibold text-brand-navy">{formatDurationMinutes(view.periodTotalMinutes)}</span>{" "}
              for <span className="font-semibold text-brand-navy">{view.projectName}</span> to your reviewer. Submission is
              stored on this device until synced.
            </p>
            <p className="mt-2 text-[13px] text-brand-muted">This is not final approval — your reviewer still needs to approve.</p>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleConfirmSubmit()}
              className="m-press mt-5 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-brand-navy text-[16px] font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Confirm submit"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setConfirmOpen(false)}
              className="m-press mt-2 flex h-11 w-full items-center justify-center text-[15px] font-semibold text-brand-blue disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
