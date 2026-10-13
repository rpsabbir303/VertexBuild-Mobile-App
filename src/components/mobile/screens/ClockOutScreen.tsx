"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TIME_ROUTES,
  activeShiftMinutes,
  clockOutPrechecksPass,
  formatDurationMinutes,
  formatTimeLabel,
  geofenceLabel,
  getClockOutPrechecks,
  loadTimeShiftState,
  performClockOut,
  shiftStatusHeadline,
  syncProjectContext,
  type TimeShiftState,
} from "@/lib/mobile/timeTracking";
import { mobileElevatedCard, mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { IconBack } from "../icons";
import { StatusBadge } from "../ui/StatusBadge";

type Phase = "loading" | "no_active_shift" | "ready" | "success";

export function ClockOutScreen() {
  const router = useRouter();
  const { user, currentProject, openProjectSelector, isOffline } = useMobileApp();
  const { session } = useMobileAuth();

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;
  const reporterEmail = session?.email ?? "demo@summitconstruction.com";

  const [phase, setPhase] = useState<Phase>("loading");
  const [shift, setShift] = useState<TimeShiftState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const reload = useCallback(() => {
    let state = loadTimeShiftState(userKey, currentProject.id, currentProject.name);
    state = syncProjectContext(userKey, state, currentProject.id, currentProject.name);
    setShift(state);
    return state;
  }, [userKey, currentProject.id, currentProject.name]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setPhase("loading");
    const timer = window.setTimeout(() => {
      const state = reload();
      if (state.status === "on_shift") {
        setPhase("ready");
        if (state.lastActionError) setError(state.lastActionError);
      } else {
        setPhase("no_active_shift");
      }
    }, 240);
    return () => window.clearTimeout(timer);
  }, [reload]);

  useEffect(() => {
    if (shift?.status !== "clock_out_pending") return;
    setSubmitting(true);
    const poll = window.setInterval(() => {
      const state = reload();
      if (state.status === "off_shift") {
        window.clearInterval(poll);
        setPhase("success");
        window.setTimeout(() => router.replace(TIME_ROUTES.home), 900);
      } else if (state.status === "on_shift") {
        window.clearInterval(poll);
        setSubmitting(false);
        if (state.lastActionError) setError(state.lastActionError);
      }
    }, 350);
    return () => window.clearInterval(poll);
  }, [shift?.status, reload, router]);

  const prechecks = useMemo(
    () => (shift ? getClockOutPrechecks(shift, currentProject.id, currentProject.name) : []),
    [shift, currentProject.id, currentProject.name],
  );

  const elapsedMinutes = useMemo(() => {
    if (!shift || shift.status !== "on_shift") return 0;
    return activeShiftMinutes(shift.clockInAt, now);
  }, [shift, now]);

  const canSubmit =
    shift && clockOutPrechecksPass(shift, currentProject.id) && !submitting && shift.status === "on_shift";

  async function handleClockOut() {
    if (!shift || !canSubmit || inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setError(null);

    const result = await performClockOut(userKey, shift, { reporterEmail, offline: isOffline });
    setShift(result.state);
    setSubmitting(false);
    inFlightRef.current = false;

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setPhase("success");
    window.setTimeout(() => {
      router.replace(TIME_ROUTES.home);
    }, 900);
  }

  if (phase === "loading" || !shift) {
    return (
      <div className={mobilePageBg}>
        <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="h-6 w-40 animate-pulse rounded bg-brand-soft" />
          <div className="mt-6 h-48 animate-pulse rounded-[18px] bg-brand-soft/80" />
        </div>
      </div>
    );
  }

  if (phase === "no_active_shift") {
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
            <h1 className="text-[17px] font-semibold text-brand-navy">Clock out</h1>
          </div>
        </header>
        <main className="px-4 py-8 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))]">
          <div className={`${mobileInsetCard} p-5`}>
            <StatusBadge tone="neutral" label={shiftStatusHeadline(shift.status)} />
            <p className="mt-3 text-[15px] leading-relaxed text-brand-navy">
              There is no active shift to end. Clock in from Time home when you are ready to start work.
            </p>
            <Link
              href={TIME_ROUTES.home}
              className="m-press mt-5 flex h-12 w-full items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white"
            >
              Back to Time
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className={mobilePageBg}>
        <main className="flex min-h-[50vh] flex-col items-center justify-center px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(24px,env(safe-area-inset-top))]">
          <StatusBadge tone="success" label="Clock-out complete" />
          <p className="mt-4 text-[18px] font-bold text-brand-navy">Shift ended</p>
          <p className="mt-2 text-[14px] text-brand-muted">Returning to Time…</p>
        </main>
      </div>
    );
  }

  const geofenceTone =
    shift.geofence === "on_site" ? "success" : shift.geofence === "checking" ? "warning" : shift.geofence === "outside" ? "danger" : "neutral";

  const clockInLabel = shift.clockInAt ? formatTimeLabel(new Date(shift.clockInAt)) : "—";

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
            <h1 className="text-[17px] font-semibold text-brand-navy">Clock out</h1>
            <p className="text-[13px] text-brand-muted">End your active shift</p>
            <p className="mt-0.5 text-[12px] text-brand-muted">
              {user.firstName} {user.lastName}
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-4 px-4 py-4 pb-[max(10rem,calc(env(safe-area-inset-bottom)+9rem))]">
        <section className={`${mobileElevatedCard} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-mist">Shift status</p>
              <p className="mt-1 text-[20px] font-bold tracking-[-0.02em] text-brand-navy">{shiftStatusHeadline(shift.status)}</p>
            </div>
            <StatusBadge tone="success" label="Active" />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-brand-mist">Elapsed</p>
          <p className="mt-1 font-mono text-[26px] font-bold tabular-nums tracking-[-0.02em] text-brand-blue">
            {formatDurationMinutes(elapsedMinutes)}
          </p>
          <p className="mt-2 text-[13px] text-brand-muted">
            Clocked in at <span className="font-semibold text-brand-navy">{clockInLabel}</span>
          </p>
        </section>

        <section className={`${mobileInsetCard} p-4`}>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">Work context</h2>
          <div className="mt-3 space-y-3">
            <button type="button" onClick={openProjectSelector} className="m-press flex w-full items-center justify-between text-left">
              <span>
                <span className="block text-[11px] font-medium uppercase text-brand-mist">Project</span>
                <span className="block text-[15px] font-semibold text-brand-navy">{shift.projectName}</span>
              </span>
              <span className="text-[13px] font-semibold text-brand-blue">Change</span>
            </button>
            <div className="border-t border-brand-line/50 pt-3">
              <span className="block text-[11px] font-medium uppercase text-brand-mist">Crew</span>
              <span className="block text-[15px] font-semibold text-brand-navy">{shift.crewLabel ?? "Not recorded"}</span>
            </div>
          </div>
          <div className="mt-3">
            <StatusBadge tone={geofenceTone} label={`Last geofence: ${geofenceLabel(shift.geofence)}`} />
            <p className="mt-1.5 text-[11px] text-brand-mist">Clock-out does not re-check geofence.</p>
          </div>
        </section>

        <section className={`${mobileInsetCard} p-4`} aria-labelledby="clock-out-prechecks">
          <h2 id="clock-out-prechecks" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
            Before you clock out
          </h2>
          <ul className="mt-3 space-y-2.5">
            {prechecks.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-[12px] bg-brand-soft/40 px-3 py-2.5">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    item.ok ? "bg-status-success text-white" : "border border-brand-line bg-white text-brand-muted"
                  }`}
                  aria-hidden="true"
                >
                  {item.ok ? "✓" : "!"}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-brand-navy">{item.label}</span>
                  <span className="mt-0.5 block text-[12px] text-brand-muted">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          {submitting ? (
            <p className="mt-3 text-[13px] font-medium text-brand-navy" role="status">
              Submitting clock-out…
            </p>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-[12px] border border-status-danger/30 bg-red-50 px-3 py-2.5" role="alert">
            <p className="text-[14px] font-semibold text-status-danger">Clock-out failed</p>
            <p className="mt-0.5 text-[13px] text-brand-navy">{error}</p>
            <button type="button" onClick={() => void handleClockOut()} className="m-press mt-2 text-[13px] font-semibold text-brand-blue">
              Retry
            </button>
          </div>
        ) : null}

        <p className="text-[11px] leading-relaxed text-brand-mist">
          Ends the active shift on this device.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line/60 bg-brand-canvas/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleClockOut()}
          className="m-press mx-auto flex h-[52px] w-full max-w-lg items-center justify-center rounded-[14px] bg-brand-navy text-[16px] font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Clocking out…" : "Clock out"}
        </button>
      </div>
    </div>
  );
}
