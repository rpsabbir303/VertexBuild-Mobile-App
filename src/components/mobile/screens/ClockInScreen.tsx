"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TIME_ROUTES,
  clockInPrechecksPass,
  formatTimeLabel,
  geofenceLabel,
  getClockInPrechecks,
  loadTimeShiftState,
  performClockIn,
  syncProjectContext,
  type TimeShiftState,
} from "@/lib/mobile/timeTracking";
import { mobileElevatedCard, mobileInsetCard, mobileIconTile, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { IconBack, IconChevronRight, IconTime } from "../icons";
import { StatusBadge } from "../ui/StatusBadge";

type Phase = "loading" | "already_on_shift" | "ready" | "success";

/** Primary tab bar (58px) + nav safe padding — matches `.pb-nav-safe` in globals.css */
const BOTTOM_NAV_OFFSET = "calc(64px + env(safe-area-inset-bottom, 0px))";
/** Sticky CTA height + bottom nav clearance for scroll padding */
const MAIN_SCROLL_PADDING = "calc(152px + env(safe-area-inset-bottom, 0px))";

function PrecheckStatusIcon({ ok }: { ok: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold leading-none ${
        ok
          ? "bg-status-success text-white shadow-[0_1px_2px_rgba(27,107,69,0.25)]"
          : "border-2 border-[#D4A574] bg-white text-[#8A6232]"
      }`}
      aria-hidden="true"
    >
      {ok ? "✓" : "!"}
    </span>
  );
}

export function ClockInScreen() {
  const router = useRouter();
  const { user, currentProject, openProjectSelector, isOffline } = useMobileApp();
  const { session } = useMobileAuth();

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;
  const reporterEmail = session?.email ?? "demo@summitconstruction.com";

  const [phase, setPhase] = useState<Phase>("loading");
  const [shift, setShift] = useState<TimeShiftState | null>(null);
  const [nowLabel, setNowLabel] = useState(() => formatTimeLabel());
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
    const timer = window.setInterval(() => setNowLabel(formatTimeLabel()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setPhase("loading");
    const timer = window.setTimeout(() => {
      const state = reload();
      if (state.status === "on_shift") {
        setPhase("already_on_shift");
      } else {
        setPhase("ready");
        if (state.lastActionError) setError(state.lastActionError);
      }
    }, 240);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const prechecks = useMemo(
    () => (shift ? getClockInPrechecks(shift, isOffline) : []),
    [shift, isOffline],
  );

  const canSubmit = shift ? clockInPrechecksPass(shift, isOffline) && !submitting : false;

  async function handleClockIn() {
    if (!shift || !canSubmit || inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setError(null);

    const result = await performClockIn(userKey, shift, { reporterEmail, offline: isOffline });
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
          <div className="mt-6 h-36 animate-pulse rounded-[18px] bg-brand-soft/80" />
          <div className="mt-4 h-44 animate-pulse rounded-[16px] bg-brand-soft/60" />
        </div>
      </div>
    );
  }

  if (phase === "already_on_shift") {
    return (
      <div className={mobilePageBg}>
        <header className="border-b border-brand-line/50 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <Link href={TIME_ROUTES.home} className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft" aria-label="Back to Time">
              <IconBack />
            </Link>
            <h1 className="text-[17px] font-semibold text-brand-navy">Clock in</h1>
          </div>
        </header>
        <main className="px-4 py-8 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))]">
          <div className={`${mobileInsetCard} p-5`}>
            <StatusBadge tone="success" label="Already on shift" />
            <p className="mt-3 text-[15px] leading-relaxed text-brand-navy">
              You are already clocked in for <span className="font-semibold">{shift.projectName}</span>.
            </p>
            <Link href={TIME_ROUTES.home} className="m-press mt-5 flex h-12 w-full items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white">
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
          <StatusBadge tone="success" label="Clock-in complete" />
          <p className="mt-4 text-[18px] font-bold text-brand-navy">Shift started</p>
          <p className="mt-2 text-[14px] text-brand-muted">Returning to Time…</p>
        </main>
      </div>
    );
  }

  const geofenceTone =
    shift.geofence === "on_site" ? "success" : shift.geofence === "checking" ? "warning" : shift.geofence === "outside" ? "danger" : "neutral";
  const siteStatusLabel = geofenceLabel(shift.geofence);

  return (
    <div className={mobilePageBg}>
      <header className="border-b border-brand-line/50 bg-brand-canvas/95 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <Link href={TIME_ROUTES.home} className="m-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft" aria-label="Back to Time">
            <IconBack />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-brand-navy">Clock in</h1>
            <p className="text-[13px] text-brand-muted">Start your shift for today</p>
            <p className="mt-0.5 truncate text-[12px] text-brand-muted">
              {user.firstName} {user.lastName}
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-3.5 px-4 py-4" style={{ paddingBottom: MAIN_SCROLL_PADDING }}>
        {/* Clock-in time — primary focus */}
        <section
          className={`${mobileElevatedCard} relative overflow-hidden border-brand-line/50 shadow-[0_4px_20px_rgba(8,35,63,0.07)]`}
          aria-labelledby="clock-in-time-heading"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-softblue/35 via-white to-white" aria-hidden="true" />
          <div className="relative px-4 py-5 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <p
                id="clock-in-time-heading"
                className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-mist"
              >
                Clock-in time
              </p>
              <span className={`${mobileIconTile} h-9 w-9 rounded-[11px] shadow-none`} aria-hidden="true">
                <IconTime className="h-[18px] w-[18px]" strokeWidth={1.85} />
              </span>
            </div>
            <p
              className="mt-3 break-words font-mono text-[32px] font-bold leading-[1.05] tracking-[-0.03em] text-brand-navy tabular-nums sm:text-[36px]"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {nowLabel}
            </p>
            <p className="mt-3 max-w-md text-[13px] leading-snug text-brand-muted">
              Recorded at submit using device time.
            </p>
          </div>
        </section>

        {/* Work context */}
        <section className={`${mobileInsetCard} overflow-hidden p-0`} aria-labelledby="work-context-heading">
          <div className="border-b border-brand-line/45 px-4 py-3.5">
            <h2 id="work-context-heading" className="text-[12px] font-semibold uppercase tracking-[0.06em] text-brand-muted">
              Work context
            </h2>
          </div>

          <button
            type="button"
            onClick={openProjectSelector}
            className="m-press flex w-full items-center gap-3 border-b border-brand-line/45 px-4 py-3.5 text-left active:bg-brand-soft/50"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-medium uppercase tracking-wide text-brand-mist">Project</span>
              <span className="mt-0.5 block text-[15px] font-semibold leading-snug text-brand-navy">{currentProject.name}</span>
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-brand-blue">Change</span>
          </button>

          <div className="border-b border-brand-line/45 px-4 py-3.5">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-brand-mist">Crew</span>
            <span className={`mt-0.5 block text-[15px] font-semibold leading-snug ${shift.crewLabel ? "text-brand-navy" : "text-brand-muted"}`}>
              {shift.crewLabel ?? "Not selected"}
            </span>
            {!shift.crewLabel ? (
              <Link
                href={`${TIME_ROUTES.projectCrew}?returnTo=${encodeURIComponent(TIME_ROUTES.clockIn)}`}
                className="m-press mt-2 inline-flex items-center gap-0.5 text-[13px] font-semibold text-brand-blue"
              >
                Choose project &amp; crew
                <IconChevronRight className="h-4 w-4 text-brand-mist" strokeWidth={2} aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 bg-brand-soft/25 px-4 py-3.5">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-brand-mist">Site location</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusBadge tone={geofenceTone} label={siteStatusLabel} />
              </div>
            </div>
            <Link
              href={`${TIME_ROUTES.geofence}?returnTo=${encodeURIComponent(TIME_ROUTES.clockIn)}`}
              className="m-press shrink-0 rounded-full border border-brand-line/70 bg-white px-3 py-1.5 text-[13px] font-semibold text-brand-blue shadow-[0_1px_2px_rgba(8,35,63,0.04)] active:bg-brand-soft/80"
            >
              Check location
            </Link>
          </div>
        </section>

        {/* Pre-clock-in checklist */}
        <section className={`${mobileInsetCard} p-4`} aria-labelledby="prechecks-heading">
          <h2 id="prechecks-heading" className="text-[12px] font-semibold uppercase tracking-[0.06em] text-brand-muted">
            Before you clock in
          </h2>
          <ul className="mt-3 space-y-2">
            {prechecks.map((item) => (
              <li
                key={item.id}
                className={`flex items-center gap-3 rounded-[14px] border px-3 py-3 ${
                  item.ok
                    ? "border-emerald-100/90 bg-emerald-50/35"
                    : "border-[#E8D4A8]/90 bg-[#FFFBF5]"
                }`}
              >
                <PrecheckStatusIcon ok={item.ok} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold leading-snug text-brand-navy">{item.label}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-brand-muted">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          {shift.geofence === "checking" || submitting ? (
            <p className="mt-3 text-[13px] font-medium text-brand-navy" role="status" aria-live="polite">
              {shift.geofence === "checking" ? "Validating geofence…" : "Submitting clock-in…"}
            </p>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-[14px] border border-status-danger/30 bg-red-50 px-3.5 py-3" role="alert">
            <p className="text-[14px] font-semibold text-status-danger">Clock-in failed</p>
            <p className="mt-0.5 text-[13px] leading-snug text-brand-navy">{error}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <button type="button" onClick={() => void handleClockIn()} className="m-press text-[13px] font-semibold text-brand-blue">
                Retry
              </button>
              {shift.geofence === "outside" ? (
                <Link
                  href={`${TIME_ROUTES.outOfGeofence}?returnTo=${encodeURIComponent(TIME_ROUTES.clockIn)}`}
                  className="text-[13px] font-semibold text-brand-blue"
                >
                  Out-of-geofence help
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <p className="px-0.5 text-[11px] leading-relaxed text-brand-mist">
          Clock-in re-runs geofence validation when you submit.
        </p>
      </main>

      <div
        className="fixed inset-x-0 z-50 border-t border-brand-line/60 bg-brand-canvas/95 px-4 pt-3 backdrop-blur-md"
        style={{
          bottom: BOTTOM_NAV_OFFSET,
          paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleClockIn()}
          className="m-press mx-auto flex h-[52px] w-full max-w-lg items-center justify-center rounded-[14px] bg-brand-blue text-[16px] font-semibold text-white shadow-glow disabled:opacity-50"
        >
          {submitting ? "Clocking in…" : "Clock in"}
        </button>
      </div>
    </div>
  );
}
