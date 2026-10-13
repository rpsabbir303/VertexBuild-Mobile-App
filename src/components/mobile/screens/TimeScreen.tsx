"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TIME_ROUTES,
  TIME_WORKFLOWS,
  activeShiftMinutes,
  formatDurationMinutes,
  geofenceLabel,
  getRecentTimeEntries,
  getTimesheetSummary,
  loadTimeShiftState,
  shiftStatusHeadline,
  syncProjectContext,
  timesheetStatusLabel,
  type TimeShiftState,
} from "@/lib/mobile/timeTracking";
import { mobileElevatedCard, mobileInsetCard, mobileListRow, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { IconChevronDown, IconChevronRight } from "../icons";
import { StatusBadge } from "../ui/StatusBadge";

type Phase = "loading" | "ready";

export function TimeScreen() {
  const router = useRouter();
  const { user, currentProject, openProjectSelector, isOffline } = useMobileApp();
  const { session } = useMobileAuth();

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;

  const [phase, setPhase] = useState<Phase>("loading");
  const [shift, setShift] = useState<TimeShiftState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const reload = useCallback(() => {
    let state = loadTimeShiftState(userKey, currentProject.id, currentProject.name);
    state = syncProjectContext(userKey, state, currentProject.id, currentProject.name);
    setShift(state);
  }, [userKey, currentProject.id, currentProject.name]);

  useEffect(() => {
    setPhase("loading");
    const timer = window.setTimeout(() => {
      reload();
      setPhase("ready");
    }, 280);
    return () => window.clearTimeout(timer);
  }, [reload]);

  useEffect(() => {
    if (shift?.status !== "on_shift") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [shift?.status]);

  const summary = useMemo(() => (shift ? getTimesheetSummary(shift, userKey, now) : null), [shift, userKey, now]);

  const shiftMinutes = useMemo(() => {
    if (!shift || shift.status !== "on_shift") return 0;
    return activeShiftMinutes(shift.clockInAt, now);
  }, [shift, now]);

  const projectMismatch =
    shift?.status === "on_shift" && shift.projectId !== currentProject.id;

  const primaryAction = useMemo(() => {
    if (!shift) return null;
    if (shift.status === "clock_in_pending") return { label: "Clocking in…", disabled: true, kind: "in" as const };
    if (shift.status === "clock_out_pending") return { label: "Clocking out…", disabled: true, kind: "out" as const };
    if (shift.status === "on_shift") return { label: "Clock out", disabled: false, kind: "out" as const };
    return { label: "Clock in", disabled: false, kind: "in" as const };
  }, [shift]);

  function handlePrimaryAction() {
    if (!shift || !primaryAction || primaryAction.disabled) return;
    if (primaryAction.kind === "in") {
      router.push(TIME_ROUTES.clockIn);
      return;
    }
    router.push(TIME_ROUTES.clockOut);
  }

  function openProjectCrewSelection() {
    router.push(TIME_ROUTES.projectCrew);
  }

  if (phase === "loading" || !shift || !summary || !primaryAction) {
    return (
      <div className={mobilePageBg}>
        <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="h-8 w-32 animate-pulse rounded bg-brand-soft" />
          <div className="mt-6 h-40 animate-pulse rounded-[18px] bg-brand-soft/80" />
        </div>
      </div>
    );
  }

  const geofenceTone =
    shift.geofence === "on_site" ? "success" : shift.geofence === "outside" ? "danger" : "neutral";
  const timesheetTone = summary.approvalStatus === "approved" ? "success" : summary.approvalStatus === "pending" ? "warning" : "neutral";

  return (
    <div className={`${mobilePageBg} relative`}>
      <div className="mx-auto max-w-lg px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(12px,env(safe-area-inset-top))]">
        <header className="border-b border-brand-line/45 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-mist">Workforce</p>
          <h1 className="mt-1 text-[26px] font-bold leading-none tracking-[-0.04em] text-brand-navy">Time</h1>
          <p className="mt-2 text-[13px] text-brand-muted">
            {user.firstName} {user.lastName} · {user.roleLabel}
          </p>
        </header>

        <section className={`mt-5 ${mobileElevatedCard} p-4`} aria-labelledby="shift-status-heading">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p id="shift-status-heading" className="text-[12px] font-semibold uppercase tracking-wide text-brand-muted">
                Shift status
              </p>
              <p className="mt-1 text-[22px] font-bold tracking-[-0.03em] text-brand-navy">{shiftStatusHeadline(shift.status)}</p>
              {shift.status === "on_shift" ? (
                <p className="mt-1 font-mono text-[15px] font-semibold tabular-nums text-brand-blue">
                  {formatDurationMinutes(shiftMinutes)} elapsed
                </p>
              ) : (
                <p className="mt-1 text-[13px] text-brand-muted">Ready when you are on site</p>
              )}
            </div>
            <StatusBadge
              tone={shift.status === "on_shift" ? "success" : shift.status.includes("pending") ? "warning" : "neutral"}
              label={shift.status === "on_shift" ? "Active" : shift.status.includes("pending") ? "Working" : "Idle"}
            />
          </div>

          <div className="mt-4 space-y-2 rounded-[14px] bg-brand-soft/50 px-3 py-3">
            <button
              type="button"
              onClick={shift.status === "on_shift" ? openProjectSelector : openProjectCrewSelection}
              className="m-press flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="min-w-0">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-brand-mist">Project</span>
                <span className="block truncate text-[15px] font-semibold text-brand-navy">{currentProject.name}</span>
              </span>
              <IconChevronDown className="h-4 w-4 shrink-0 text-brand-mist" />
            </button>
            <button
              type="button"
              onClick={openProjectCrewSelection}
              disabled={shift.status === "on_shift"}
              className="m-press flex w-full items-center justify-between gap-2 border-t border-brand-line/50 pt-2 text-left disabled:opacity-60"
            >
              <span className="min-w-0">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-brand-mist">Crew</span>
                <span className="block truncate text-[15px] font-semibold text-brand-navy">
                  {shift.crewLabel ?? "Select crew (required to clock in)"}
                </span>
              </span>
              <IconChevronDown className="h-4 w-4 shrink-0 text-brand-mist" />
            </button>
          </div>

          {projectMismatch ? (
            <p className="mt-3 text-[13px] font-medium text-[#8A6232]" role="status">
              Active shift is tied to {shift.projectName}. Switch back to manage this shift.
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge tone={geofenceTone} label={`Geofence: ${geofenceLabel(shift.geofence)}`} />
            <StatusBadge tone={timesheetTone} label={`Timesheet: ${timesheetStatusLabel(summary.approvalStatus)}`} />
          </div>

          {shift.lastActionError ? (
            <div className="mt-3 rounded-[12px] border border-status-danger/30 bg-red-50 px-3 py-2.5" role="alert">
              <p className="text-[13px] font-medium text-status-danger">{shift.lastActionError}</p>
              <button type="button" onClick={() => void handlePrimaryAction()} className="m-press mt-1 text-[13px] font-semibold text-brand-blue">
                Retry
              </button>
            </div>
          ) : null}

          <button
            type="button"
            disabled={primaryAction.disabled || projectMismatch || (primaryAction.kind === "in" && isOffline)}
            onClick={() => void handlePrimaryAction()}
            className={`m-press mt-4 flex h-[52px] w-full items-center justify-center rounded-[14px] text-[16px] font-semibold text-white disabled:opacity-50 ${
              primaryAction.kind === "out" ? "bg-brand-navy" : "bg-brand-blue shadow-glow"
            }`}
          >
            {primaryAction.label}
          </button>
          {isOffline && shift.status === "off_shift" ? (
            <p className="mt-2 text-center text-[12px] text-brand-muted">Offline — clock-in unavailable.</p>
          ) : null}
        </section>

        <Link href={TIME_ROUTES.timesheet} className={`m-press mt-4 block ${mobileInsetCard} p-4 active:bg-brand-soft/50`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-mist">Today&apos;s time</p>
          <p className="mt-2 font-mono text-[28px] font-bold tracking-[-0.03em] text-brand-navy tabular-nums">
            {formatDurationMinutes(summary.todayMinutes)}
          </p>
          <p className="mt-1 text-[12px] text-brand-muted">{summary.weekLabel}</p>
          {summary.pendingSubmit ? (
            <p className="mt-2 text-[13px] font-medium text-[#8A6232]">Timesheet submission pending</p>
          ) : null}
          <p className="mt-2 text-[13px] font-semibold text-brand-blue">View full timesheet</p>
        </Link>

        <section className="mt-5" aria-labelledby="time-workflows">
          <h2 id="time-workflows" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
            Workforce workflows
          </h2>
          <p className="mt-1 text-[12px] text-brand-muted">
            Clock-in, geofence, timesheets, and approval status are available in this preview.
          </p>
          <ul className={`mt-3 ${mobileElevatedCard} divide-y divide-brand-line/60`}>
            {TIME_WORKFLOWS.map((flow) => (
              <li key={flow.id}>
                {flow.href ? (
                  <Link href={flow.href} className={`${mobileListRow} active:bg-brand-soft/60`}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-brand-navy">{flow.title}</span>
                      <span className="mt-0.5 block text-[12px] text-brand-muted">{flow.description}</span>
                    </span>
                    <IconChevronRight className="h-[18px] w-[18px] shrink-0 text-brand-mist" />
                  </Link>
                ) : (
                  <div className={`${mobileListRow} cursor-default opacity-90`}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-brand-navy">{flow.title}</span>
                      <span className="mt-0.5 block text-[12px] text-brand-muted">{flow.description}</span>
                    </span>
                    <IconChevronRight className="h-[18px] w-[18px] shrink-0 text-brand-mist" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5">
          <h2 className="text-[16px] font-bold tracking-[-0.02em] text-brand-navy">Recent time entries</h2>
          <p className="mt-0.5 text-[12px] text-brand-muted">Recent entries</p>
          <ul className="mt-2.5 space-y-2">
            {getRecentTimeEntries().map((entry) => (
              <li key={entry.id} className={`flex items-center justify-between gap-3 ${mobileInsetCard} px-3.5 py-3.5`}>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-brand-navy">{entry.dayLabel}</p>
                  <p className="mt-0.5 text-[12px] text-brand-muted">{entry.rangeLabel}</p>
                </div>
                <p className="shrink-0 text-[13px] font-semibold tabular-nums text-brand-navy">{entry.hoursLabel}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-6 text-[11px] leading-relaxed text-brand-mist">
          Shift state is stored on this device.
        </p>
      </div>

    </div>
  );
}
