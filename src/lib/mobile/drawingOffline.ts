export type DrawingOfflineStatus = "none" | "downloading" | "available" | "failed";

import type { DrawingDiscipline } from "./drawings";
import { getDrawingById } from "./drawings";
import { todayIso } from "./dailyLogs";

export type DrawingOfflineCopy = {
  drawingId: string;
  revision: number;
  status: DrawingOfflineStatus;
  /** 0–100 while downloading; null otherwise */
  progress: number | null;
  sheetNumber: string;
  title: string;
  discipline: DrawingDiscipline;
  projectId: string;
  /** Latest project revision last synced while online (for stale detection offline). */
  latestKnownRevision: number;
};

export type OfflineDrawingSnapshot = {
  id: string;
  projectId: string;
  sheetNumber: string;
  title: string;
  discipline: DrawingDiscipline;
  offlineRevision: number;
  latestKnownRevision: number;
};

type DownloadJob = {
  timer: ReturnType<typeof setInterval>;
};

let copies: Record<string, DrawingOfflineCopy> = {};
const jobs = new Map<string, DownloadJob>();
const failNextAttempt = new Set<string>();
const listeners = new Set<() => void>();
let storeVersion = 0;

const TICK_MS = 180;
const STEP = 8;

function emit() {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
}

export function subscribeDrawingOffline(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDrawingOfflineStoreVersion(): number {
  return storeVersion;
}

export function getDrawingOfflineCopy(drawingId: string): DrawingOfflineCopy | null {
  return copies[drawingId] ?? null;
}

export function isDrawingOfflineAvailable(drawingId: string, revision?: number): boolean {
  const copy = copies[drawingId];
  if (!copy || copy.status !== "available") return false;
  if (revision === undefined) return true;
  return copy.revision === revision;
}

export function offlineCopyIsStale(drawingId: string, currentRevision: number): boolean {
  const copy = copies[drawingId];
  if (!copy || copy.status !== "available") return false;
  const latest = Math.max(currentRevision, copy.latestKnownRevision);
  return copy.revision < latest;
}

export function offlineCopyIsStaleKnown(copy: DrawingOfflineCopy): boolean {
  return copy.revision < copy.latestKnownRevision;
}

export function syncOfflineLatestKnownRevision(drawingId: string, today = todayIso()) {
  const record = getDrawingById(drawingId, today);
  const copy = copies[drawingId];
  if (!record || !copy || copy.status !== "available") return;
  if (copy.latestKnownRevision === record.currentRevision) return;
  copies = {
    ...copies,
    [drawingId]: { ...copy, latestKnownRevision: record.currentRevision },
  };
  emit();
}

export function getOfflineDrawingSnapshot(drawingId: string): OfflineDrawingSnapshot | null {
  const copy = copies[drawingId];
  if (!copy || copy.status !== "available") return null;
  return {
    id: copy.drawingId,
    projectId: copy.projectId,
    sheetNumber: copy.sheetNumber,
    title: copy.title,
    discipline: copy.discipline,
    offlineRevision: copy.revision,
    latestKnownRevision: copy.latestKnownRevision,
  };
}

function snapshotFromRecord(
  drawingId: string,
  revision: number,
  today: string,
): Omit<DrawingOfflineCopy, "status" | "progress"> | null {
  const record = getDrawingById(drawingId, today);
  if (!record) return null;
  return {
    drawingId,
    revision,
    sheetNumber: record.sheetNumber,
    title: record.title,
    discipline: record.discipline,
    projectId: record.projectId,
    latestKnownRevision: record.currentRevision,
  };
}

export function markDrawingFailOnceForDemo(drawingId: string) {
  failNextAttempt.add(drawingId);
}

function clearJob(drawingId: string) {
  const job = jobs.get(drawingId);
  if (job) clearInterval(job.timer);
  jobs.delete(drawingId);
}

export function cancelDrawingDownload(drawingId: string) {
  clearJob(drawingId);
  const copy = copies[drawingId];
  if (copy?.status === "downloading") {
    const next = { ...copies };
    delete next[drawingId];
    copies = next;
    emit();
  }
}

export function startDrawingDownload(input: {
  drawingId: string;
  revision: number;
  online: boolean;
}): "started" | "offline" | "busy" {
  if (!input.online) return "offline";
  const existing = copies[input.drawingId];
  if (existing?.status === "downloading") return "busy";
  if (existing?.status === "available" && existing.revision === input.revision) return "busy";

  clearJob(input.drawingId);
  const base = snapshotFromRecord(input.drawingId, input.revision, todayIso());
  if (!base) return "busy";
  copies = {
    ...copies,
    [input.drawingId]: {
      ...base,
      status: "downloading",
      progress: 0,
    },
  };
  emit();

  const shouldFail = failNextAttempt.has(input.drawingId);
  if (shouldFail) failNextAttempt.delete(input.drawingId);

  const timer = setInterval(() => {
    const copy = copies[input.drawingId];
    if (!copy || copy.status !== "downloading") return;

    if (shouldFail && (copy.progress ?? 0) >= 44) {
      clearJob(input.drawingId);
      copies = {
        ...copies,
        [input.drawingId]: { ...copy, status: "failed", progress: null },
      };
      emit();
      return;
    }

    const next = Math.min(100, (copy.progress ?? 0) + STEP);
    if (next >= 100) {
      clearJob(input.drawingId);
      const today = todayIso();
      const fresh = snapshotFromRecord(input.drawingId, copy.revision, today);
      copies = {
        ...copies,
        [input.drawingId]: {
          ...(fresh ?? copy),
          status: "available",
          progress: null,
        },
      };
      emit();
      return;
    }

    copies = { ...copies, [input.drawingId]: { ...copy, progress: next } };
    emit();
  }, TICK_MS);

  jobs.set(input.drawingId, { timer });
  return "started";
}

export function retryDrawingDownload(input: {
  drawingId: string;
  revision: number;
  online: boolean;
}): "started" | "offline" | "busy" {
  if (!input.online) return "offline";
  const copy = copies[input.drawingId];
  if (copy?.status === "failed") {
    const next = { ...copies };
    delete next[input.drawingId];
    copies = next;
    emit();
  }
  return startDrawingDownload(input);
}

/** Demo: first download attempt for A-102 fails once. */
markDrawingFailOnceForDemo("draw-a102");
