/** Mobile timesheet load/view — demo preview layered on shift state + mock entry rows. */

import { MOCK_TIME_ENTRIES } from "./mockData";
import {
  activeShiftMinutes,
  formatDurationMinutes,
  formatTimeLabel,
  type TimeShiftState,
  type TimesheetApprovalStatus,
} from "./timeTracking";

const ROUTES = {
  home: "/mobile-preview/time",
  timesheet: "/mobile-preview/time/timesheet",
  clockOut: "/mobile-preview/time/clock-out",
} as const;

export const TIMESHEET_LOAD_FAIL_EMAIL = "timesheet-fail@summitconstruction.com";
export const TIMESHEET_SUBMIT_FAIL_EMAIL = "timesheet-submit-fail@summitconstruction.com";
export const TIMESHEET_APPROVAL_LOAD_FAIL_EMAIL = "timesheet-approval-fail@summitconstruction.com";
/** Demo only — mock payroll API returns approved for a submitted timesheet when this account refreshes status. */
export const TIMESHEET_APPROVED_DEMO_EMAIL = "timesheet-approved@summitconstruction.com";

const TIMESHEET_META_STORAGE_KEY = "vertex-mobile-timesheet-meta-v1";
const SUBMIT_MS = 880;
const APPROVAL_REFRESH_MS = 460;

export type TimesheetMetaRecord = {
  weekLabel: string;
  approvalStatus: TimesheetApprovalStatus;
  pendingSubmit: boolean;
  submittedAt: string | null;
  approvedAt: string | null;
  approverName: string | null;
};

export type TimesheetSubmitIssue = {
  message: string;
  href?: string;
};

export type SubmitTimesheetResult =
  | { ok: true; submittedAt: string; reference: string }
  | { ok: false; message: string; code: "validation" | "server" | "offline" };

const DEFAULT_META: TimesheetMetaRecord = {
  weekLabel: "Current pay week",
  approvalStatus: "pending",
  pendingSubmit: true,
  submittedAt: null,
  approvedAt: null,
  approverName: null,
};

function metaStoreKey(userKey: string, projectId: string) {
  return `${userKey}::${projectId}`;
}

function readMetaStore(): Record<string, TimesheetMetaRecord> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(TIMESHEET_META_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TimesheetMetaRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMetaStore(store: Record<string, TimesheetMetaRecord>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(TIMESHEET_META_STORAGE_KEY, JSON.stringify(store));
}

export function getTimesheetMetaForUser(userKey: string, projectId: string): TimesheetMetaRecord {
  const store = readMetaStore();
  const saved = store[metaStoreKey(userKey, projectId)];
  if (!saved) return { ...DEFAULT_META };
  return {
    ...DEFAULT_META,
    ...saved,
    approvedAt: saved.approvedAt ?? null,
    approverName: saved.approverName ?? null,
  };
}

function persistTimesheetMeta(userKey: string, projectId: string, meta: TimesheetMetaRecord) {
  const store = readMetaStore();
  store[metaStoreKey(userKey, projectId)] = meta;
  writeMetaStore(store);
}

export type TimesheetDisplayEntry = {
  id: string;
  projectId: string;
  projectName: string;
  dayLabel: string;
  workDateLabel: string;
  rangeLabel: string | null;
  hoursLabel: string | null;
  durationMinutes: number | null;
  complete: boolean;
  crewLabel: string | null;
};

export type MobileTimesheetView = {
  /** Demo preview — not production payroll feed */
  source: "demo";
  weekLabel: string;
  approvalStatus: TimesheetApprovalStatus;
  pendingSubmit: boolean;
  statusExplanation: string;
  entries: TimesheetDisplayEntry[];
  periodTotalMinutes: number;
  todayMinutes: number;
  projectId: string;
  projectName: string;
  hasIncompleteEntry: boolean;
};

export type LoadMobileTimesheetInput = {
  userKey: string;
  reporterEmail: string;
  shift: TimeShiftState;
  projectId: string;
  projectName: string;
  now?: number;
};

export type LoadMobileTimesheetResult =
  | { ok: true; empty: boolean; view: MobileTimesheetView }
  | { ok: false; message: string };

const LOAD_MS = 420;

export function timesheetStatusExplanation(
  status: TimesheetApprovalStatus,
  pendingSubmit: boolean,
): string {
  switch (status) {
    case "approved":
      return "This pay period timesheet is approved. Changes require CMS payroll rules (not in this preview).";
    case "pending":
      return pendingSubmit
        ? "Time is recorded but not yet submitted for approval."
        : "Submitted and awaiting reviewer action.";
    case "draft":
      return "Draft — review entries before submitting.";
    default:
      return "Not submitted — review your entries when the pay period closes.";
  }
}

export function timesheetStatusTone(
  status: TimesheetApprovalStatus,
): "success" | "warning" | "neutral" | "info" {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "draft":
      return "info";
    default:
      return "neutral";
  }
}

export function validateTimesheetSubmission(view: MobileTimesheetView): {
  canSubmit: boolean;
  issues: TimesheetSubmitIssue[];
} {
  const issues: TimesheetSubmitIssue[] = [];

  if (view.approvalStatus === "approved") {
    issues.push({ message: "This timesheet is already approved and cannot be resubmitted." });
    return { canSubmit: false, issues };
  }

  if (!view.pendingSubmit && view.approvalStatus === "pending") {
    issues.push({
      message: "This timesheet was already submitted and is awaiting review (not approved yet).",
      href: ROUTES.timesheet,
    });
    return { canSubmit: false, issues };
  }

  if (view.entries.length === 0) {
    issues.push({
      message: "There are no time entries to submit for this project.",
      href: ROUTES.home,
    });
    return { canSubmit: false, issues };
  }

  if (view.hasIncompleteEntry) {
    issues.push({
      message: "Clock out to finalize your open shift before submitting.",
      href: ROUTES.clockOut,
    });
    return { canSubmit: false, issues };
  }

  return { canSubmit: true, issues };
}

function mapMockRow(row: (typeof MOCK_TIME_ENTRIES)[number]): TimesheetDisplayEntry {
  return {
    id: row.id,
    projectId: row.projectId,
    projectName: row.projectName,
    dayLabel: row.dayLabel,
    workDateLabel: row.workDateLabel,
    rangeLabel: row.rangeLabel,
    hoursLabel: row.hoursLabel,
    durationMinutes: row.durationMinutes,
    complete: row.complete,
    crewLabel: row.crewLabel ?? null,
  };
}

function buildInProgressEntry(shift: TimeShiftState, now: number): TimesheetDisplayEntry | null {
  if (shift.status !== "on_shift" || !shift.clockInAt) return null;
  const minutes = Math.round(activeShiftMinutes(shift.clockInAt, now));
  const clockInLabel = formatTimeLabel(new Date(shift.clockInAt));
  return {
    id: "shift-active",
    projectId: shift.projectId,
    projectName: shift.projectName,
    dayLabel: "Today",
    workDateLabel: formatTimeLabel(new Date(now)),
    rangeLabel: `${clockInLabel} – In progress`,
    hoursLabel: formatDurationMinutes(minutes),
    durationMinutes: minutes,
    complete: false,
    crewLabel: shift.crewLabel,
  };
}

function sumCompleteMinutes(entries: TimesheetDisplayEntry[]): number {
  return entries.reduce((sum, entry) => {
    if (!entry.complete || entry.durationMinutes == null) return sum;
    return sum + entry.durationMinutes;
  }, 0);
}

export async function loadMobileTimesheet(input: LoadMobileTimesheetInput): Promise<LoadMobileTimesheetResult> {
  await new Promise((r) => setTimeout(r, LOAD_MS));

  if (input.reporterEmail.toLowerCase() === TIMESHEET_LOAD_FAIL_EMAIL) {
    return { ok: false, message: "Could not load timesheet data. Check your connection and try again." };
  }

  const now = input.now ?? Date.now();
  const meta = getTimesheetMetaForUser(input.userKey, input.projectId);

  const mockForProject = MOCK_TIME_ENTRIES.filter((row) => row.projectId === input.projectId).map(mapMockRow);

  const active =
    input.shift.projectId === input.projectId ? buildInProgressEntry(input.shift, now) : null;

  const entries: TimesheetDisplayEntry[] = active ? [active, ...mockForProject] : [...mockForProject];

  const periodTotalMinutes =
    sumCompleteMinutes(entries) + (active && !active.complete ? (active.durationMinutes ?? 0) : 0);

  const todayMinutes =
    input.shift.status === "on_shift" && input.shift.projectId === input.projectId
      ? Math.round(activeShiftMinutes(input.shift.clockInAt, now))
      : 0;

  const view: MobileTimesheetView = {
    source: "demo",
    weekLabel: meta.weekLabel,
    approvalStatus: meta.approvalStatus,
    pendingSubmit: meta.pendingSubmit,
    statusExplanation: timesheetStatusExplanation(meta.approvalStatus, meta.pendingSubmit),
    entries,
    periodTotalMinutes,
    todayMinutes,
    projectId: input.projectId,
    projectName: input.projectName,
    hasIncompleteEntry: entries.some((e) => !e.complete),
  };

  return { ok: true, empty: entries.length === 0, view };
}

export type SubmitTimesheetInput = {
  userKey: string;
  reporterEmail: string;
  projectId: string;
  projectName: string;
  view: MobileTimesheetView;
  offline: boolean;
};

export async function submitTimesheet(input: SubmitTimesheetInput): Promise<SubmitTimesheetResult> {
  const validation = validateTimesheetSubmission(input.view);
  if (!validation.canSubmit) {
    return {
      ok: false,
      code: "validation",
      message: validation.issues[0]?.message ?? "This timesheet cannot be submitted yet.",
    };
  }

  if (input.offline) {
    return { ok: false, code: "offline", message: "Submission requires a connection." };
  }

  await new Promise((r) => setTimeout(r, SUBMIT_MS));

  if (input.reporterEmail.toLowerCase() === TIMESHEET_SUBMIT_FAIL_EMAIL) {
    return {
      ok: false,
      code: "server",
      message: "Timesheet submission failed. Try again.",
    };
  }

  const submittedAt = new Date().toISOString();
  const reference = `TS-${input.projectId.replace("proj-", "").slice(0, 4).toUpperCase()}-${submittedAt.slice(0, 10).replace(/-/g, "")}`;

  persistTimesheetMeta(input.userKey, input.projectId, {
    weekLabel: input.view.weekLabel,
    approvalStatus: "pending",
    pendingSubmit: false,
    submittedAt,
    approvedAt: null,
    approverName: null,
  });

  return { ok: true, submittedAt, reference };
}

export type TimesheetApprovalPhase = "approved" | "pending_review" | "not_submitted";

export type TimesheetApprovalSnapshot = {
  phase: TimesheetApprovalPhase;
  weekLabel: string;
  projectId: string;
  projectName: string;
  periodTotalMinutes: number;
  entryCount: number;
  submittedAt: string | null;
  approvedAt: string | null;
  approverName: string | null;
  approvalStatus: TimesheetApprovalStatus;
};

type MockApprovalRefresh = { kind: "unchanged" } | { kind: "approved"; approvedAt: string; approverName: string };

async function mockRefreshApprovalStatus(
  meta: TimesheetMetaRecord,
  reporterEmail: string,
): Promise<{ meta: TimesheetMetaRecord; refresh: MockApprovalRefresh }> {
  await new Promise((r) => setTimeout(r, APPROVAL_REFRESH_MS));

  if (!meta.submittedAt || meta.approvalStatus === "approved") {
    return { meta, refresh: { kind: "unchanged" } };
  }

  if (reporterEmail.toLowerCase() === TIMESHEET_APPROVED_DEMO_EMAIL) {
    const approvedAt = new Date().toISOString();
    const approverName = "Jordan Rivera";
    const next: TimesheetMetaRecord = {
      ...meta,
      approvalStatus: "approved",
      pendingSubmit: false,
      approvedAt,
      approverName,
    };
    return { meta: next, refresh: { kind: "approved", approvedAt, approverName } };
  }

  return { meta, refresh: { kind: "unchanged" } };
}

function resolveApprovalPhase(meta: TimesheetMetaRecord): TimesheetApprovalPhase {
  if (meta.approvalStatus === "approved") return "approved";
  if (meta.submittedAt && !meta.pendingSubmit) return "pending_review";
  return "not_submitted";
}

export async function loadTimesheetApprovalSnapshot(
  input: LoadMobileTimesheetInput,
): Promise<{ ok: true; snapshot: TimesheetApprovalSnapshot } | { ok: false; message: string }> {
  if (input.reporterEmail.toLowerCase() === TIMESHEET_APPROVAL_LOAD_FAIL_EMAIL) {
    return { ok: false, message: "Could not load approval status. Check your connection and try again." };
  }

  const timesheet = await loadMobileTimesheet(input);
  if (!timesheet.ok) {
    return { ok: false, message: timesheet.message };
  }

  let meta = getTimesheetMetaForUser(input.userKey, input.projectId);
  const refreshed = await mockRefreshApprovalStatus(meta, input.reporterEmail);
  meta = refreshed.meta;
  if (refreshed.refresh.kind === "approved") {
    persistTimesheetMeta(input.userKey, input.projectId, meta);
  }

  const phase = resolveApprovalPhase(meta);

  return {
    ok: true,
    snapshot: {
      phase,
      weekLabel: meta.weekLabel,
      projectId: input.projectId,
      projectName: input.projectName,
      periodTotalMinutes: timesheet.view.periodTotalMinutes,
      entryCount: timesheet.view.entries.length,
      submittedAt: meta.submittedAt,
      approvedAt: meta.approvedAt,
      approverName: meta.approverName,
      approvalStatus: meta.approvalStatus,
    },
  };
}
