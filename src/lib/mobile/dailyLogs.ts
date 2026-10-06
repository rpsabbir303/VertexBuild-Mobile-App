import { MORE_MENU_ITEMS } from "./roleConfig";
import type { DailyLogStatus, MockDailyLog, MockRole } from "./types";

type DailyLogSeed = {
  projectId: string;
  dayOffset: number;
  summary: string;
  status: DailyLogStatus;
  savedLabel: string;
};

/** Offsets are relative to the device's local today so the list stays date-accurate. */
const SEEDS: DailyLogSeed[] = [
  {
    projectId: "proj-lakeshore",
    dayOffset: 0,
    summary: "Concrete placement · Level 2",
    status: "draft",
    savedLabel: "Last saved 2 min ago",
  },
  {
    projectId: "proj-lakeshore",
    dayOffset: -1,
    summary: "Concrete placement · Level 2",
    status: "submitted",
    savedLabel: "Submitted 4:18 PM",
  },
  {
    projectId: "proj-lakeshore",
    dayOffset: -2,
    summary: "MEP rough-in · East Wing",
    status: "saved_locally",
    savedLabel: "Last saved 10:42 AM",
  },
  {
    projectId: "proj-lakeshore",
    dayOffset: -3,
    summary: "Site logistics · South gate",
    status: "queued",
    savedLabel: "Waiting to sync",
  },
  {
    projectId: "proj-lakeshore",
    dayOffset: -4,
    summary: "Foundation prep · Grid C",
    status: "synced",
    savedLabel: "Synced 2 min ago",
  },
  {
    projectId: "proj-westbridge",
    dayOffset: 0,
    summary: "Loading dock · material receipts",
    status: "submitted",
    savedLabel: "Submitted 7:05 AM",
  },
  {
    projectId: "proj-westbridge",
    dayOffset: -1,
    summary: "Steel erection · north bay",
    status: "synced",
    savedLabel: "Synced yesterday",
  },
];

let sessionLogs: MockDailyLog[] = [];
let logPatches: Record<string, Partial<Pick<MockDailyLog, "status" | "savedLabel" | "summary">>> = {};
const listeners = new Set<() => void>();

function withPatch(log: MockDailyLog): MockDailyLog {
  const patch = logPatches[log.id];
  return patch ? { ...log, ...patch } : log;
}

function emit() {
  sessionLogs = sessionLogs.slice();
  listeners.forEach((listener) => listener());
}

export function subscribeDailyLogs(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSessionLogs(): MockDailyLog[] {
  return sessionLogs;
}

const EMPTY_SESSION: MockDailyLog[] = [];

export function getServerSessionLogs(): MockDailyLog[] {
  return EMPTY_SESSION;
}

/** Field authoring follows the existing Punch List role gate. Safety can review, not create. */
export function canAuthorDailyLog(role: MockRole): boolean {
  return MORE_MENU_ITEMS.punch.roles.includes(role);
}

export function canEditDailyLog(role: MockRole, status: DailyLogStatus): boolean {
  if (!canAuthorDailyLog(role)) return false;
  return status === "draft" || status === "saved_locally" || status === "queued";
}

export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addIsoDays(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return todayIso(date);
}

export function startOfWeekIso(iso: string): string {
  return addIsoDays(iso, -parseIso(iso).getDay());
}

export function dailyLogId(projectId: string, date: string): string {
  return `log-${projectId}-${date}`;
}

function materializeSeed(seed: DailyLogSeed, today: string): MockDailyLog {
  const date = addIsoDays(today, seed.dayOffset);
  return {
    id: dailyLogId(seed.projectId, date),
    projectId: seed.projectId,
    date,
    summary: seed.summary,
    status: seed.status,
    savedLabel: seed.savedLabel,
  };
}

export function projectDailyLogs(
  projectId: string,
  session: MockDailyLog[],
  today: string,
): MockDailyLog[] {
  const seeded = SEEDS.filter((seed) => seed.projectId === projectId).map((seed) =>
    materializeSeed(seed, today),
  );
  const extras = session.filter((log) => log.projectId === projectId);
  const byDate = new Map<string, MockDailyLog>();
  for (const log of seeded) byDate.set(log.date, log);
  for (const log of extras) byDate.set(log.date, log);
  return Array.from(byDate.values())
    .map(withPatch)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function patchDailyLog(
  id: string,
  patch: Partial<Pick<MockDailyLog, "status" | "savedLabel" | "summary">>,
) {
  logPatches = { ...logPatches, [id]: { ...logPatches[id], ...patch } };
  emit();
}

export function markDailyLogSaved(id: string, offline: boolean) {
  const today = todayIso();
  const log = getDailyLogById(id, today);
  if (!log || !canEditDailyLogStatus(log.status)) return;
  patchDailyLog(id, {
    status: "saved_locally",
    savedLabel: offline ? "Saved locally · waiting for connection" : "Saved locally · just now",
  });
}

function canEditDailyLogStatus(status: DailyLogStatus) {
  return status === "draft" || status === "saved_locally" || status === "queued";
}

export function submitDailyLog(id: string, offline: boolean) {
  const log = getDailyLogById(id, todayIso());
  if (!log || log.status === "submitted" || log.status === "synced") return;
  if (offline) {
    patchDailyLog(id, { status: "queued", savedLabel: "Queued for sync · waiting for connection" });
    return;
  }
  patchDailyLog(id, { status: "submitted", savedLabel: "Submitted · synced just now" });
}

export function syncQueuedDailyLog(id: string) {
  const log = getDailyLogById(id, todayIso());
  if (!log || log.status !== "queued") return;
  patchDailyLog(id, { status: "submitted", savedLabel: "Submitted · synced just now" });
}

export function findDailyLog(logs: MockDailyLog[], date: string): MockDailyLog | undefined {
  return logs.find((log) => log.date === date);
}

export function getDailyLogById(id: string, today: string): MockDailyLog | undefined {
  const sessionHit = sessionLogs.find((log) => log.id === id);
  if (sessionHit) return withPatch(sessionHit);
  const seeded = SEEDS.map((seed) => materializeSeed(seed, today)).find((log) => log.id === id);
  return seeded ? withPatch(seeded) : undefined;
}

export function createDailyLog(
  projectId: string,
  date: string,
  today: string,
): { log: MockDailyLog; created: boolean } {
  const existing = findDailyLog(projectDailyLogs(projectId, sessionLogs, today), date);
  if (existing) return { log: existing, created: false };

  const log: MockDailyLog = {
    id: dailyLogId(projectId, date),
    projectId,
    date,
    summary: "Field activity",
    status: "draft",
    savedLabel: "Last saved just now",
  };
  sessionLogs = [...sessionLogs, log];
  emit();
  return { log, created: true };
}

export function logActionLabel(status: DailyLogStatus, canAuthor: boolean): "Continue Log" | "View Log" {
  if (!canAuthor) return "View Log";
  if (status === "submitted" || status === "synced") return "View Log";
  return "Continue Log";
}

export function projectSyncLine(logs: MockDailyLog[], offline: boolean): string | null {
  if (logs.length === 0) return offline ? "On this device · not currently synced" : null;
  if (offline) return "On this device · not currently synced";
  if (logs.some((log) => log.status === "queued")) return "Queued for sync";
  if (logs.some((log) => log.status === "saved_locally" || log.status === "draft")) {
    return "Saved locally";
  }
  return "Synced";
}

const monthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const weekdayLong = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const monthLong = new Intl.DateTimeFormat("en-US", { month: "long" });
const monthShort = new Intl.DateTimeFormat("en-US", { month: "short" });
const weekdayShort = new Intl.DateTimeFormat("en-US", { weekday: "short" });

export function formatLogDate(iso: string): string {
  const date = parseIso(iso);
  return `${monthLong.format(date)} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatMonthYear(iso: string): string {
  return monthYear.format(parseIso(iso));
}

export function formatHeroDate(iso: string): string {
  const date = parseIso(iso);
  return `${weekdayLong.format(date)}, ${monthLong.format(date)} ${date.getDate()}`;
}

export function formatWeekdayShort(iso: string): string {
  return weekdayShort.format(parseIso(iso));
}

export function formatMonthShort(iso: string): string {
  return monthShort.format(parseIso(iso)).toUpperCase();
}

export function dayNumber(iso: string): number {
  return parseIso(iso).getDate();
}
