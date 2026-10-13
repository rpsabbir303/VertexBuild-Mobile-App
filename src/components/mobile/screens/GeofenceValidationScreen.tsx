"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  geofenceIssueGuidance,
  queryGeolocationPermission,
  runGeofenceValidation,
  type GeofenceValidationResult,
  type GeofenceValidationStep,
  type GeolocationPermissionState,
} from "@/lib/mobile/geofenceValidation";
import { getProjectById, projectLocation } from "@/lib/mobile/mockData";
import {
  TIME_ROUTES,
  geofenceLabel,
  loadTimeShiftState,
  resolveWorkforceReturnPath,
  syncProjectContext,
  updateShiftGeofence,
  type GeofenceStatus,
  type TimeShiftState,
} from "@/lib/mobile/timeTracking";
import { mobileElevatedCard, mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { IconBack } from "../icons";
import { StatusBadge } from "../ui/StatusBadge";

type UiPhase = "loading" | "ready" | "success";

function stepLabel(step: GeofenceValidationStep | null): string {
  switch (step) {
    case "checking_location":
      return "Getting your location…";
    case "validating_geofence":
      return "Validating against project geofence…";
    default:
      return "";
  }
}

function permissionHint(state: GeolocationPermissionState): string {
  switch (state) {
    case "granted":
      return "Location access is allowed. Tap Check location when you are on site.";
    case "denied":
      return "Location access is blocked. Update browser or device settings before checking again.";
    case "prompt":
      return "The next check will ask for location permission if needed.";
    case "unsupported":
      return "Geolocation is not supported in this browser.";
    default:
      return "Tap Check location to request permission and validate your position.";
  }
}

function resultTone(result: GeofenceValidationResult | null): "success" | "danger" | "warning" | "neutral" {
  if (!result) return "neutral";
  if (result.ok) return "success";
  if (result.geofenceStatus === "outside") return "danger";
  return "warning";
}

export function GeofenceValidationScreen() {
  const searchParams = useSearchParams();
  const returnPath = resolveWorkforceReturnPath(searchParams.get("returnTo"));

  const { user, currentProject, isOffline } = useMobileApp();
  const { session } = useMobileAuth();

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;
  const reporterEmail = session?.email ?? "demo@summitconstruction.com";

  const [uiPhase, setUiPhase] = useState<UiPhase>("loading");
  const [shift, setShift] = useState<TimeShiftState | null>(null);
  const [permissionState, setPermissionState] = useState<GeolocationPermissionState>("unknown");
  const [activeStep, setActiveStep] = useState<GeofenceValidationStep | null>(null);
  const [checking, setChecking] = useState(false);
  const [lastResult, setLastResult] = useState<GeofenceValidationResult | null>(null);
  const inFlightRef = useRef(false);

  const reload = useCallback(() => {
    let state = loadTimeShiftState(userKey, currentProject.id, currentProject.name);
    state = syncProjectContext(userKey, state, currentProject.id, currentProject.name);
    setShift(state);
    return state;
  }, [userKey, currentProject.id, currentProject.name]);

  useEffect(() => {
    setUiPhase("loading");
    const timer = window.setTimeout(() => {
      reload();
      setUiPhase("ready");
    }, 240);
    return () => window.clearTimeout(timer);
  }, [reload]);

  useEffect(() => {
    void queryGeolocationPermission().then(setPermissionState);
  }, [lastResult]);

  const projectName = shift?.projectName ?? currentProject.name;
  const projectId = shift?.projectId ?? currentProject.id;
  const worksite = getProjectById(projectId) ?? currentProject;
  const storedGeofence: GeofenceStatus = shift?.geofence ?? "unavailable";

  async function handleCheckLocation() {
    if (!shift || checking || inFlightRef.current) return;
    if (isOffline) return;

    inFlightRef.current = true;
    setChecking(true);
    setLastResult(null);
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

    if (result.ok) {
      setUiPhase("success");
      window.setTimeout(() => setUiPhase("ready"), 1200);
    }
  }

  if (uiPhase === "loading" || !shift) {
    return (
      <div className={mobilePageBg}>
        <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="h-6 w-44 animate-pulse rounded bg-brand-soft" />
          <div className="mt-6 h-48 animate-pulse rounded-[18px] bg-brand-soft/80" />
        </div>
      </div>
    );
  }

  const displayResult = lastResult;
  const tone = resultTone(displayResult);

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
            <h1 className="text-[17px] font-semibold text-brand-navy">Geofence validation</h1>
            <p className="text-[13px] text-brand-muted">Confirm you are within the job site boundary before clock-in.</p>
          </div>
        </div>
      </header>

      <main className="space-y-4 px-4 py-4 pb-[max(10rem,calc(env(safe-area-inset-bottom)+9rem))]">
        <section className={`${mobileElevatedCard} p-4`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-mist">Worksite</p>
          <p className="mt-1 text-[18px] font-bold text-brand-navy">{projectName}</p>
          <p className="mt-1 text-[13px] text-brand-muted">{projectLocation(worksite)}</p>
          <div className="mt-3">
            <StatusBadge
              tone={storedGeofence === "on_site" ? "success" : storedGeofence === "outside" ? "danger" : "neutral"}
              label={`Last result: ${geofenceLabel(storedGeofence)}`}
            />
          </div>
        </section>

        <section className={`${mobileInsetCard} p-4`} aria-live="polite">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">Location access</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-brand-navy">{permissionHint(permissionState)}</p>
          {permissionState === "denied" ? (
            <p className="mt-2 text-[13px] text-brand-muted">
              Open your device settings or browser site permissions for this app, allow location, then return here.
            </p>
          ) : null}
        </section>

        {checking ? (
          <section className={`${mobileInsetCard} p-4`} role="status">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" aria-hidden="true" />
              <div>
                <p className="text-[15px] font-semibold text-brand-navy">{stepLabel(activeStep) || "Checking…"}</p>
                <p className="mt-0.5 text-[13px] text-brand-muted">Do not close this screen.</p>
              </div>
            </div>
          </section>
        ) : null}

        {displayResult && !checking ? (
          <section className={`${mobileInsetCard} p-4`} role="status">
            <StatusBadge
              tone={tone}
              label={displayResult.ok ? "On site" : displayResult.geofenceStatus === "outside" ? "Outside geofence" : "Validation incomplete"}
            />
            <p className="mt-3 text-[15px] font-semibold text-brand-navy">{displayResult.message}</p>
            {!displayResult.ok ? (
              <p className="mt-2 text-[13px] leading-relaxed text-brand-muted">
                {geofenceIssueGuidance(displayResult.issue)}
              </p>
            ) : null}
            {!displayResult.ok && displayResult.issue === "outside_geofence" ? (
              <Link
                href={`${TIME_ROUTES.outOfGeofence}?returnTo=${encodeURIComponent(TIME_ROUTES.geofence)}`}
                className="m-press mt-3 inline-flex text-[13px] font-semibold text-brand-blue"
              >
                View out-of-geofence guidance
              </Link>
            ) : null}
          </section>
        ) : null}

        {uiPhase === "success" && displayResult?.ok ? (
          <p className="text-[13px] font-medium text-status-success" role="status">
            Validation saved to your shift context. You can continue to clock-in when ready.
          </p>
        ) : null}

        {isOffline ? (
          <div className="rounded-[12px] border border-[#E8D4A8] bg-[#FFF8EB] px-3 py-2.5" role="alert">
            <p className="text-[13px] font-medium text-[#8A6232]">Offline — geofence validation requires a connection.</p>
          </div>
        ) : null}

        <p className="text-[11px] leading-relaxed text-brand-mist">
          GPS confirms the device can read location; site validation runs without showing coordinates or map radius here.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 space-y-2 border-t border-brand-line/60 bg-brand-canvas/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <button
          type="button"
          disabled={checking || isOffline || permissionState === "unsupported"}
          onClick={() => void handleCheckLocation()}
          className="m-press mx-auto flex h-[52px] w-full max-w-lg items-center justify-center rounded-[14px] bg-brand-blue text-[16px] font-semibold text-white shadow-glow disabled:opacity-50"
        >
          {checking ? "Checking…" : lastResult ? "Check again" : "Check location"}
        </button>
        {displayResult?.ok ? (
          <Link
            href={`${TIME_ROUTES.clockIn}?from=geofence`}
            className="m-press mx-auto flex h-[48px] w-full max-w-lg items-center justify-center rounded-[14px] bg-brand-navy text-[15px] font-semibold text-white"
          >
            Continue to clock in
          </Link>
        ) : displayResult && !displayResult.ok && displayResult.issue === "outside_geofence" ? (
          <Link
            href={`${TIME_ROUTES.outOfGeofence}?returnTo=${encodeURIComponent(returnPath)}`}
            className="m-press mx-auto flex h-[48px] w-full max-w-lg items-center justify-center rounded-[14px] bg-brand-navy text-[15px] font-semibold text-white"
          >
            Out-of-geofence next steps
          </Link>
        ) : (
          <Link
            href={returnPath}
            className="m-press mx-auto flex h-[48px] w-full max-w-lg items-center justify-center rounded-[14px] ring-1 ring-brand-line text-[15px] font-semibold text-brand-navy"
          >
            Back to Time
          </Link>
        )}
      </div>
    </div>
  );
}
