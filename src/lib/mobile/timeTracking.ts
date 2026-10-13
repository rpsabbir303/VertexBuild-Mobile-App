/** Demo time & workforce state — not production payroll or geofence enforcement. */

import { runGeofenceValidation } from "./geofenceValidation";
import { getTimesheetMetaForUser } from "./timesheet";
import { MOCK_TIME_ENTRIES } from "./mockData";

export const TIME_ACTION_FAIL_EMAIL = "timefail@summitconstruction.com";

export type ShiftStatus = "off_shift" | "clock_in_pending" | "on_shift" | "clock_out_pending";

export type GeofenceStatus = "on_site" | "checking" | "outside" | "unavailable";

export type TimesheetApprovalStatus = "none" | "draft" | "pending" | "approved";

export type TimeShiftState = {
  status: ShiftStatus;
  projectId: string;
  projectName: string;
  crewId: string | null;
  crewLabel: string | null;
  clockInAt: string | null;
  geofence: GeofenceStatus;
  lastActionError: string | null;
  updatedAt: string;
};

export type TimesheetSummary = {
  todayMinutes: number;
  weekLabel: string;
  approvalStatus: TimesheetApprovalStatus;
  pendingSubmit: boolean;
};

export type TimeEntryRow = (typeof MOCK_TIME_ENTRIES)[number];

export const DEMO_CREWS = [
  { id: "crew-a", label: "Crew A — General" },
  { id: "crew-b", label: "Crew B — Steel" },
  { id: "crew-c", label: "Crew C — MEP" },
] as const;

export const TIME_ROUTES = {
  home: "/mobile-preview/time",
  clockIn: "/mobile-preview/time/clock-in",
  clockOut: "/mobile-preview/time/clock-out",
  projectCrew: "/mobile-preview/time/project-crew",
  geofence: "/mobile-preview/time/geofence",
  outOfGeofence: "/mobile-preview/time/out-of-geofence",
  timesheet: "/mobile-preview/time/timesheet",
  submitTimesheet: "/mobile-preview/time/submit-timesheet",
  timesheetApproved: "/mobile-preview/time/timesheet-approved",
} as const;

export const TIME_WORKFORCE_RETURN_PATHS = [
  TIME_ROUTES.home,
  TIME_ROUTES.clockIn,
  TIME_ROUTES.geofence,
  TIME_ROUTES.outOfGeofence,
] as const;

export type WorkforceCrewOption = { id: string; label: string };

/** Demo crews per project — shared with shift state; not production roster data. */
const WORKFORCE_CREWS_BY_PROJECT: Record<string, WorkforceCrewOption[]> = {
  "proj-lakeshore": [...DEMO_CREWS],
  "proj-westbridge": [
    { id: "wb-general", label: "Crew A — General" },
    { id: "wb-earth", label: "Earthwork crew" },
    { id: "wb-steel", label: "Crew B — Steel & decking" },
  ],
  "proj-north-campus": [
    { id: "nc-core", label: "Core & shell" },
    { id: "nc-lab", label: "Lab fit-out" },
  ],
  "proj-harbor": [{ id: "harbor-precon", label: "Preconstruction support" }],
};

export function getWorkforceCrewsForProject(projectId: string): WorkforceCrewOption[] {
  return WORKFORCE_CREWS_BY_PROJECT[projectId] ?? [];
}

export function isWorkforceCrewValidForProject(crewId: string | null, projectId: string): boolean {
  if (!crewId) return false;
  return getWorkforceCrewsForProject(projectId).some((crew) => crew.id === crewId);
}

export type WorkforceSelectionInput = {
  projectId: string;
  projectName: string;
  crewId: string;
  crewLabel: string;
};

export type WorkforceSelectionResult =
  | { ok: true; state: TimeShiftState }
  | { ok: false; message: string; state: TimeShiftState };

export function validateWorkforceSelection(
  state: TimeShiftState,
  input: WorkforceSelectionInput,
): string | null {
  if (!input.projectId || !input.projectName) return "Select a project to continue.";
  if (!input.crewId || !input.crewLabel) return "Select a crew to continue.";
  if (!isWorkforceCrewValidForProject(input.crewId, input.projectId)) {
    return "This crew is not available for the selected project.";
  }
  if (state.status === "on_shift" && state.projectId !== input.projectId) {
    return `End your active shift on ${state.projectName} before switching projects.`;
  }
  return null;
}

export function persistWorkforceSelection(
  userKey: string,
  state: TimeShiftState,
  input: WorkforceSelectionInput,
): WorkforceSelectionResult {
  const message = validateWorkforceSelection(state, input);
  if (message) return { ok: false, message, state };

  const next: TimeShiftState = {
    ...state,
    projectId: input.projectId,
    projectName: input.projectName,
    crewId: input.crewId,
    crewLabel: input.crewLabel,
    lastActionError: null,
  };
  saveTimeShiftState(userKey, next);
  return { ok: true, state: next };
}

const SELECTION_CONFIRM_MS = 480;

export async function confirmWorkforceSelection(
  userKey: string,
  state: TimeShiftState,
  input: WorkforceSelectionInput,
): Promise<WorkforceSelectionResult> {
  const early = validateWorkforceSelection(state, input);
  if (early) return { ok: false, message: early, state };
  await new Promise((r) => setTimeout(r, SELECTION_CONFIRM_MS));
  return persistWorkforceSelection(userKey, state, input);
}

export function resolveWorkforceReturnPath(returnTo: string | null | undefined): string {
  if (returnTo && (TIME_WORKFORCE_RETURN_PATHS as readonly string[]).includes(returnTo)) {
    return returnTo;
  }
  return TIME_ROUTES.home;
}

export type ClockInPrecheck = {
  id: "shift" | "crew" | "network" | "project";
  label: string;
  ok: boolean;
  detail: string;
};

export const TIME_WORKFLOWS = [
  { id: "clock-in", title: "Clock in", description: "Start your shift on site", href: TIME_ROUTES.clockIn },
  { id: "active-shift", title: "Active shift", description: "View shift in progress", href: null },
  { id: "clock-out", title: "Clock out", description: "End your shift and record hours", href: TIME_ROUTES.clockOut },
  { id: "crew", title: "Project / crew selection", description: "Choose project and crew", href: TIME_ROUTES.projectCrew },
  { id: "geofence", title: "Geofence validation", description: "Confirm you are on the job site", href: TIME_ROUTES.geofence },
  { id: "out-of-geofence", title: "Out of geofence", description: "Guidance when off site", href: TIME_ROUTES.outOfGeofence },
  { id: "timesheet", title: "Timesheet", description: "Review hours for the period", href: TIME_ROUTES.timesheet },
  { id: "submit-timesheet", title: "Submit timesheet", description: "Send hours for approval", href: TIME_ROUTES.submitTimesheet },
  { id: "approved", title: "Timesheet approved", description: "Check reviewer decision", href: TIME_ROUTES.timesheetApproved },
] as const;

const STORAGE_KEY = "vertex-mobile-time-shift-v1";

const ACTION_MS = 1100;

function readStore(): Record<string, TimeShiftState> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TimeShiftState>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, TimeShiftState>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function storeKey(userKey: string) {
  return userKey;
}

export function defaultShiftState(projectId: string, projectName: string): TimeShiftState {
  return {
    status: "off_shift",
    projectId,
    projectName,
    crewId: null,
    crewLabel: null,
    clockInAt: null,
    geofence: "unavailable",
    lastActionError: null,
    updatedAt: new Date().toISOString(),
  };
}

export function loadTimeShiftState(userKey: string, projectId: string, projectName: string): TimeShiftState {
  const store = readStore();
  const saved = store[storeKey(userKey)];
  if (!saved) return defaultShiftState(projectId, projectName);
  return { ...saved };
}

export function saveTimeShiftState(userKey: string, state: TimeShiftState): void {
  const store = readStore();
  store[storeKey(userKey)] = { ...state, updatedAt: new Date().toISOString() };
  writeStore(store);
}

export function shiftStatusHeadline(status: ShiftStatus): string {
  switch (status) {
    case "on_shift":
      return "On shift";
    case "clock_in_pending":
      return "Clocking in…";
    case "clock_out_pending":
      return "Clocking out…";
    default:
      return "Off shift";
  }
}

export function geofenceLabel(status: GeofenceStatus): string {
  switch (status) {
    case "on_site":
      return "On site";
    case "checking":
      return "Checking location…";
    case "outside":
      return "Outside geofence";
    default:
      return "Location unavailable";
  }
}

export function timesheetStatusLabel(status: TimesheetApprovalStatus): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "pending":
      return "Pending review";
    case "draft":
      return "Draft";
    default:
      return "Not submitted";
  }
}

export function formatDurationMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function activeShiftMinutes(clockInAt: string | null, now = Date.now()): number {
  if (!clockInAt) return 0;
  const start = new Date(clockInAt).getTime();
  if (Number.isNaN(start)) return 0;
  return (now - start) / 60000;
}

export function getTimesheetSummary(shift: TimeShiftState, userKey: string, now = Date.now()): TimesheetSummary {
  const active = shift.status === "on_shift" ? activeShiftMinutes(shift.clockInAt, now) : 0;
  const baseToday = shift.status === "off_shift" && !shift.clockInAt ? 0 : active;
  const meta = getTimesheetMetaForUser(userKey, shift.projectId);
  return {
    todayMinutes: Math.round(baseToday),
    weekLabel: meta.weekLabel,
    approvalStatus: meta.approvalStatus,
    pendingSubmit: meta.pendingSubmit,
  };
}

export function getRecentTimeEntries(): TimeEntryRow[] {
  return MOCK_TIME_ENTRIES.slice();
}

export function formatTimeLabel(date = new Date()): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function getClockInPrechecks(state: TimeShiftState, offline: boolean): ClockInPrecheck[] {
  const offShift = state.status === "off_shift";
  return [
    {
      id: "shift",
      label: "Shift status",
      ok: offShift,
      detail: offShift ? "Ready to start a shift" : shiftStatusHeadline(state.status),
    },
    {
      id: "crew",
      label: "Crew selected",
      ok: Boolean(state.crewId && state.crewLabel),
      detail: state.crewLabel ?? "Required — choose a project and crew to continue",
    },
    {
      id: "network",
      label: "Connection",
      ok: !offline,
      detail: offline ? "Online required for clock-in" : "Connected",
    },
    {
      id: "project",
      label: "Project",
      ok: Boolean(state.projectId),
      detail: state.projectName || "Select a project on Time home",
    },
  ];
}

export function clockInPrechecksPass(state: TimeShiftState, offline: boolean): boolean {
  return getClockInPrechecks(state, offline).every((item) => item.ok);
}

export type ClockOutPrecheck = {
  id: "shift" | "clock_in" | "project";
  label: string;
  ok: boolean;
  detail: string;
};

export function getClockOutPrechecks(
  state: TimeShiftState,
  currentProjectId: string,
  currentProjectName: string,
): ClockOutPrecheck[] {
  const onShift = state.status === "on_shift";
  const clockInOk = Boolean(state.clockInAt);
  const projectOk = state.projectId === currentProjectId;

  return [
    {
      id: "shift",
      label: "Active shift",
      ok: onShift,
      detail: onShift ? shiftStatusHeadline(state.status) : "No shift in progress — clock in first",
    },
    {
      id: "clock_in",
      label: "Clock-in recorded",
      ok: clockInOk,
      detail: clockInOk ? formatTimeLabel(new Date(state.clockInAt!)) : "Missing clock-in time on this shift",
    },
    {
      id: "project",
      label: "Project context",
      ok: projectOk,
      detail: projectOk
        ? state.projectName
        : `Shift is for ${state.projectName}. Switch from Time home to ${currentProjectName} or open the shift project.`,
    },
  ];
}

export function clockOutPrechecksPass(state: TimeShiftState, currentProjectId: string): boolean {
  return getClockOutPrechecks(state, currentProjectId, "").every((item) => item.ok);
}

export function updateShiftGeofence(
  userKey: string,
  state: TimeShiftState,
  geofence: GeofenceStatus,
  lastActionError: string | null = null,
): TimeShiftState {
  const next = { ...state, geofence, lastActionError };
  saveTimeShiftState(userKey, next);
  return next;
}

export type ClockActionResult =
  | { ok: true; state: TimeShiftState }
  | { ok: false; message: string; state: TimeShiftState };

export async function performClockIn(
  userKey: string,
  state: TimeShiftState,
  options: { reporterEmail: string; offline: boolean },
): Promise<ClockActionResult> {
  if (state.status === "on_shift" || state.status === "clock_in_pending") {
    return { ok: false, message: "You are already on shift.", state };
  }
  if (!state.crewId || !state.crewLabel) {
    return { ok: false, message: "Select a crew before clocking in.", state };
  }
  if (options.offline) {
    return { ok: false, message: "Clock-in requires a connection.", state };
  }

  let next: TimeShiftState = {
    ...state,
    status: "clock_in_pending",
    geofence: "checking",
    lastActionError: null,
  };
  saveTimeShiftState(userKey, next);

  const geo = await runGeofenceValidation({
    projectId: state.projectId,
    projectName: state.projectName,
    reporterEmail: options.reporterEmail,
  });
  next = { ...next, geofence: geo.geofenceStatus };
  if (!geo.ok) {
    const failMsg =
      geo.issue === "outside_geofence"
        ? "You appear outside the job site geofence. Move on site or open Out of geofence for guidance."
        : geo.message;
    next = {
      ...next,
      status: "off_shift",
      lastActionError: failMsg,
    };
    saveTimeShiftState(userKey, next);
    return { ok: false, message: failMsg, state: next };
  }

  await new Promise((r) => setTimeout(r, ACTION_MS));

  if (options.reporterEmail.toLowerCase() === TIME_ACTION_FAIL_EMAIL) {
    const failMsg = "Clock-in failed. Try again.";
    next = {
      ...next,
      status: "off_shift",
      geofence: "on_site",
      lastActionError: failMsg,
    };
    saveTimeShiftState(userKey, next);
    return { ok: false, message: failMsg, state: next };
  }

  next = {
    ...next,
    status: "on_shift",
    clockInAt: new Date().toISOString(),
    geofence: "on_site",
    lastActionError: null,
  };
  saveTimeShiftState(userKey, next);
  return { ok: true, state: next };
}

export async function performClockOut(
  userKey: string,
  state: TimeShiftState,
  options: { reporterEmail: string; offline: boolean },
): Promise<ClockActionResult> {
  if (state.status !== "on_shift") {
    return { ok: false, message: "No active shift to clock out.", state };
  }

  let next: TimeShiftState = { ...state, status: "clock_out_pending", lastActionError: null };
  saveTimeShiftState(userKey, next);

  await new Promise((r) => setTimeout(r, ACTION_MS));

  if (options.reporterEmail.toLowerCase() === TIME_ACTION_FAIL_EMAIL) {
    const failMsg = "Clock-out failed. Try again.";
    next = {
      ...next,
      status: "on_shift",
      lastActionError: failMsg,
    };
    saveTimeShiftState(userKey, next);
    return { ok: false, message: failMsg, state: next };
  }

  next = {
    ...next,
    status: "off_shift",
    clockInAt: null,
    geofence: "unavailable",
    lastActionError: null,
  };
  saveTimeShiftState(userKey, next);
  return { ok: true, state: next };
}

export function applyCrewSelection(
  userKey: string,
  state: TimeShiftState,
  crewId: string,
  crewLabel: string,
): TimeShiftState {
  const next = { ...state, crewId, crewLabel, lastActionError: null };
  saveTimeShiftState(userKey, next);
  return next;
}

export function syncProjectContext(
  userKey: string,
  state: TimeShiftState,
  projectId: string,
  projectName: string,
): TimeShiftState {
  if (state.status === "on_shift" && state.projectId !== projectId) {
    return state;
  }
  const next = { ...state, projectId, projectName };
  saveTimeShiftState(userKey, next);
  return next;
}
