"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  geofenceIssueGuidance,
  outOfGeofenceHeadline,
  resolveOutOfGeofenceViewMode,
  runGeofenceValidation,
  type GeofenceValidationResult,
  type GeofenceValidationStep,
  type OutOfGeofenceViewMode,
} from "@/lib/mobile/geofenceValidation";
import { getProjectById, projectLocation } from "@/lib/mobile/mockData";
import {
  TIME_ROUTES,
  loadTimeShiftState,
  resolveWorkforceReturnPath,
  syncProjectContext,
  updateShiftGeofence,
  type TimeShiftState,
} from "@/lib/mobile/timeTracking";
import { mobileElevatedCard, mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { IconBack } from "../icons";
import { StatusBadge } from "../ui/StatusBadge";

function stepLabel(step: GeofenceValidationStep | null): string {
  switch (step) {
    case "checking_location":
      return "Getting your location…";
    case "validating_geofence":
      return "Rechecking geofence…";
    default:
      return "Checking location…";
  }
}

function modeBadgeTone(mode: OutOfGeofenceViewMode): "success" | "danger" | "warning" | "neutral" {
  switch (mode) {
    case "outside":
      return "danger";
    case "on_site":
      return "success";
    default:
      return "warning";
  }
}

function StatusMark({ mode }: { mode: OutOfGeofenceViewMode }) {
  const isOutside = mode === "outside";
  const isOnSite = mode === "on_site";
  return (
    <div
      className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
        isOutside
          ? "bg-red-50 text-status-danger ring-2 ring-status-danger/25"
          : isOnSite
            ? "bg-emerald-50 text-status-success ring-2 ring-status-success/25"
            : "bg-[#FFF8EB] text-[#8A6232] ring-2 ring-[#E8D4A8]"
      }`}
      aria-hidden="true"
    >
      {isOutside ? (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : isOnSite ? (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
    </div>
  );
}

export function OutOfGeofenceScreen() {
  const searchParams = useSearchParams();
  const returnPath = resolveWorkforceReturnPath(searchParams.get("returnTo"));

  const { user, currentProject, isOffline } = useMobileApp();
  const { session } = useMobileAuth();

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;
  const reporterEmail = session?.email ?? "demo@summitconstruction.com";

  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState<TimeShiftState | null>(null);
  const [lastResult, setLastResult] = useState<GeofenceValidationResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [activeStep, setActiveStep] = useState<GeofenceValidationStep | null>(null);
  const inFlightRef = useRef(false);

  const reload = useCallback(() => {
    let state = loadTimeShiftState(userKey, currentProject.id, currentProject.name);
    state = syncProjectContext(userKey, state, currentProject.id, currentProject.name);
    setShift(state);
    return state;
  }, [userKey, currentProject.id, currentProject.name]);

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => {
      reload();
      setLoading(false);
    }, 240);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const projectId = shift?.projectId ?? currentProject.id;
  const projectName = shift?.projectName ?? currentProject.name;
  const worksite = getProjectById(projectId) ?? currentProject;
  const crewLabel = shift?.crewLabel;

  const viewMode = useMemo(
    () => resolveOutOfGeofenceViewMode(shift?.geofence ?? "unavailable", lastResult),
    [shift?.geofence, lastResult],
  );

  const headline = outOfGeofenceHeadline(viewMode);

  async function handleRecheck() {
    if (!shift || checking || inFlightRef.current || isOffline) return;
    inFlightRef.current = true;
    setChecking(true);
    setActiveStep("checking_location");

    const result = await runGeofenceValidation({
      projectId,
      projectName,
      reporterEmail,
      onStep: (step) => setActiveStep(step),
    });

    setLastResult(result);
    setActiveStep(null);
    setChecking(false);
    inFlightRef.current = false;

    const next = updateShiftGeofence(userKey, shift, result.geofenceStatus, result.ok ? null : result.message);
    setShift(next);
  }

  if (loading || !shift) {
    return (
      <div className={mobilePageBg}>
        <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="h-6 w-48 animate-pulse rounded bg-brand-soft" />
          <div className="mt-6 h-52 animate-pulse rounded-[18px] bg-brand-soft/80" />
        </div>
      </div>
    );
  }

  const showClockInBlocked = viewMode === "outside";
  const canClockIn = viewMode === "on_site" && shift.status === "off_shift";

  return (
    <div className={mobilePageBg}>
      <header className="border-b border-brand-line/50 bg-brand-canvas/95 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <Link
            href={returnPath}
            className="m-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
            aria-label="Back"
          >
            <IconBack />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-brand-navy">Out of geofence</h1>
            <p className="text-[13px] text-brand-muted">Location status for time tracking</p>
          </div>
        </div>
      </header>

      <main className="space-y-4 px-4 py-4 pb-[max(11rem,calc(env(safe-area-inset-bottom)+10rem))]">
        <section className={`${mobileElevatedCard} p-5 text-center`} aria-labelledby="oof-status-heading">
          <StatusMark mode={viewMode} />
          <h2 id="oof-status-heading" className="mt-4 text-[20px] font-bold tracking-[-0.02em] text-brand-navy">
            {headline}
          </h2>
          <div className="mt-3 flex justify-center">
            <StatusBadge tone={modeBadgeTone(viewMode)} label={headline} />
          </div>

          {viewMode === "outside" ? (
            <p className="mt-4 text-[15px] leading-relaxed text-brand-navy">
              Your current location is outside the permitted geofence for{" "}
              <span className="font-semibold">{projectName}</span>. Clock-in stays unavailable until you are on site and
              validation succeeds.
            </p>
          ) : null}

          {viewMode === "location_problem" ? (
            <p className="mt-4 text-[15px] leading-relaxed text-brand-navy">
              We could not confirm whether you are inside the project geofence. This is not the same as being outside
              the boundary — fix location access or retry the check.
            </p>
          ) : null}

          {viewMode === "on_site" ? (
            <p className="mt-4 text-[15px] leading-relaxed text-brand-navy">
              Your last validation shows you on site for <span className="font-semibold">{projectName}</span>. You can
              continue to clock-in when your other prechecks pass.
            </p>
          ) : null}

          {lastResult && !lastResult.ok ? (
            <p className="mt-3 text-[13px] text-brand-muted">{geofenceIssueGuidance(lastResult.issue)}</p>
          ) : null}

          {shift.lastActionError && !lastResult ? (
            <p className="mt-3 text-[13px] font-medium text-brand-muted">{shift.lastActionError}</p>
          ) : null}
        </section>

        <section className={`${mobileInsetCard} p-4`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-mist">Work context</p>
          <p className="mt-2 text-[16px] font-bold text-brand-navy">{projectName}</p>
          <p className="mt-0.5 text-[13px] text-brand-muted">{projectLocation(worksite)}</p>
          {crewLabel ? (
            <p className="mt-2 text-[13px] text-brand-navy">
              Crew: <span className="font-semibold">{crewLabel}</span>
            </p>
          ) : (
            <Link href={TIME_ROUTES.projectCrew} className="mt-2 inline-block text-[13px] font-semibold text-brand-blue">
              Set project &amp; crew
            </Link>
          )}
        </section>

        {showClockInBlocked ? (
          <section className="rounded-[14px] border border-status-danger/25 bg-red-50/80 px-4 py-3.5" role="status">
            <p className="text-[14px] font-semibold text-status-danger">Clock-in unavailable</p>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-navy">
              Move to the job site, then tap Recheck location. There is no manual override available.
            </p>
          </section>
        ) : null}

        {checking ? (
          <section className={`${mobileInsetCard} p-4`} role="status" aria-live="polite">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" aria-hidden="true" />
              <p className="text-[15px] font-semibold text-brand-navy">{stepLabel(activeStep)}</p>
            </div>
          </section>
        ) : null}

        {isOffline ? (
          <div className="rounded-[12px] border border-[#E8D4A8] bg-[#FFF8EB] px-3 py-2.5" role="alert">
            <p className="text-[13px] font-medium text-[#8A6232]">Offline — location recheck requires a connection.</p>
          </div>
        ) : null}

        <p className="text-[11px] leading-relaxed text-brand-mist">
          Uses the same geofence validation as clock-in. Recheck runs device location plus site validation — no coordinates shown.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 space-y-2 border-t border-brand-line/60 bg-brand-canvas/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <button
          type="button"
          disabled={checking || isOffline}
          onClick={() => void handleRecheck()}
          className="m-press mx-auto flex h-[52px] w-full max-w-lg items-center justify-center rounded-[14px] bg-brand-blue text-[16px] font-semibold text-white shadow-glow disabled:opacity-50"
        >
          {checking ? "Rechecking…" : "Recheck location"}
        </button>

        {canClockIn ? (
          <Link
            href={TIME_ROUTES.clockIn}
            className="m-press mx-auto flex h-[48px] w-full max-w-lg items-center justify-center rounded-[14px] bg-brand-navy text-[15px] font-semibold text-white"
          >
            Continue to clock in
          </Link>
        ) : showClockInBlocked ? (
          <span
            className="mx-auto flex h-[48px] w-full max-w-lg cursor-not-allowed items-center justify-center rounded-[14px] bg-brand-soft text-[15px] font-semibold text-brand-muted"
            aria-disabled="true"
          >
            Clock in (on site required)
          </span>
        ) : (
          <Link
            href={`${TIME_ROUTES.geofence}?returnTo=${encodeURIComponent(TIME_ROUTES.outOfGeofence)}`}
            className="m-press mx-auto flex h-[48px] w-full max-w-lg items-center justify-center rounded-[14px] ring-1 ring-brand-line text-[15px] font-semibold text-brand-navy"
          >
            Open geofence validation
          </Link>
        )}

        <Link
          href={TIME_ROUTES.home}
          className="m-press mx-auto flex h-[44px] w-full max-w-lg items-center justify-center text-[14px] font-semibold text-brand-blue"
        >
          Back to Time
        </Link>
      </div>
    </div>
  );
}
