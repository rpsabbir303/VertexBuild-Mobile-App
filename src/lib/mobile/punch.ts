import { addIsoDays, parseIso, todayIso } from "./dailyLogs";
import { normalizeWorkPhotos, type FieldPhoto } from "./photoEvidence";
import { MORE_MENU_ITEMS, normalizeMockRole } from "./roleConfig";
import type { MockRole } from "./types";

export type PunchStatus = "open" | "in_progress" | "completed" | "verified" | "void";

export type PunchSync = "synced" | "saved_locally" | "queued" | "failed";

export type PunchDrawingPin = {
  sheet: string;
  grid: string;
};

export type ProjectPunch = {
  id: string;
  projectId: string;
  number: string;
  description: string;
  location: string;
  status: PunchStatus;
  assignedTo: string;
  subcontractor: string;
  dueDate: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  costImpact: boolean;
  drawingPin: PunchDrawingPin | null;
  photos: FieldPhoto[];
  completionPhotos: FieldPhoto[];
  completionNote: string;
  completedBy: string | null;
  completedAt: string | null;
  verificationRequired: boolean;
  correctionNeeded: boolean;
  rejectionNote: string;
  rejectedBy: string | null;
  rejectedAt: string | null;
  sync: PunchSync;
  syncLabel: string;
};

export const PUNCH_FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "verified", label: "Verified" },
  { id: "void", label: "Void" },
] as const;

export type PunchFilter = (typeof PUNCH_FILTERS)[number]["id"];

type PunchSeed = Omit<
  ProjectPunch,
  "dueDate" | "photos" | "completionPhotos"
> & {
  dueOffset: number | null;
  photoLabels?: string[];
  completionPhotoLabels?: string[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const VERIFY_ROLES: MockRole[] = ["project_manager", "superintendent"];

const STATUS_LABEL: Record<PunchStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  verified: "Verified",
  void: "Void",
};

function seed(input: {
  id: string;
  projectId: string;
  number: string;
  description: string;
  location: string;
  status: PunchStatus;
  assignedTo: string;
  subcontractor?: string;
  dueOffset?: number | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  costImpact?: boolean;
  drawingPin?: PunchDrawingPin | null;
  photoLabels?: string[];
  completionPhotoLabels?: string[];
  completionNote?: string;
  completedBy?: string | null;
  completedAt?: string | null;
  verificationRequired?: boolean;
  correctionNeeded?: boolean;
  rejectionNote?: string;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
}): PunchSeed {
  return {
    id: input.id,
    projectId: input.projectId,
    number: input.number,
    description: input.description,
    location: input.location,
    status: input.status,
    assignedTo: input.assignedTo,
    subcontractor: input.subcontractor ?? "",
    dueOffset: input.dueOffset ?? null,
    verifiedBy: input.verifiedBy ?? null,
    verifiedAt: input.verifiedAt ?? null,
    costImpact: input.costImpact ?? false,
    drawingPin: input.drawingPin ?? null,
    photoLabels: input.photoLabels ?? [],
    completionPhotoLabels: input.completionPhotoLabels ?? [],
    completionNote: input.completionNote ?? "",
    completedBy: input.completedBy ?? null,
    completedAt: input.completedAt ?? null,
    verificationRequired: input.verificationRequired ?? true,
    correctionNeeded: input.correctionNeeded ?? false,
    rejectionNote: input.rejectionNote ?? "",
    rejectedBy: input.rejectedBy ?? null,
    rejectedAt: input.rejectedAt ?? null,
    sync: "synced",
    syncLabel: "Synced",
  };
}

const SEEDS: PunchSeed[] = [
  seed({
    id: "punch-018",
    projectId: "proj-lakeshore",
    number: "PUNCH #018",
    description: "Loose handrail at Level 2",
    location: "Level 2 · East Wing",
    status: "in_progress",
    assignedTo: "Alex Morgan",
    subcontractor: "Summit Steel",
    dueOffset: -2,
    costImpact: false,
    drawingPin: { sheet: "A-204", grid: "Grid A / Level 2" },
    photoLabels: ["Handrail connection", "East stair opening"],
  }),
  seed({
    id: "punch-021",
    projectId: "proj-lakeshore",
    number: "PUNCH #021",
    description: "Drywall patch unfinished at corridor soffit",
    location: "Level 2 · Central corridor",
    status: "open",
    assignedTo: "Alex Morgan",
    subcontractor: "Interior Finishes Co.",
    dueOffset: 2,
    costImpact: false,
    drawingPin: { sheet: "A-201", grid: "Grid C / Level 2" },
    photoLabels: ["Soffit patch area"],
  }),
  seed({
    id: "punch-014",
    projectId: "proj-lakeshore",
    number: "PUNCH #014",
    description: "Missing fire caulk at sleeve penetration",
    location: "Level 1 · Mechanical room",
    status: "open",
    assignedTo: "Jordan Lee",
    subcontractor: "MEP Partners",
    dueOffset: 0,
    costImpact: true,
    photoLabels: ["Penetration sleeve"],
  }),
  seed({
    id: "punch-009",
    projectId: "proj-lakeshore",
    number: "PUNCH #009",
    description: "Door hardware adjustment — patient room 204",
    location: "Level 2 · Patient wing",
    status: "completed",
    assignedTo: "Alex Morgan",
    subcontractor: "Door & Hardware LLC",
    dueOffset: -5,
    costImpact: false,
    photoLabels: ["Hardware set", "Latch alignment"],
    completedBy: "Alex Morgan",
    completedAt: "2026-10-06T15:42:00.000Z",
    completionNote: "Hardware adjusted and latch tested.",
    completionPhotoLabels: ["Adjusted hardware", "Latch test"],
    verificationRequired: true,
  }),
  seed({
    id: "punch-006",
    projectId: "proj-lakeshore",
    number: "PUNCH #006",
    description: "Paint touch-up at elevator lobby column",
    location: "Level 1 · Main lobby",
    status: "verified",
    assignedTo: "Alex Morgan",
    subcontractor: "Interior Finishes Co.",
    dueOffset: -8,
    verifiedBy: "Chris Rivera",
    verifiedAt: "2026-10-05T16:10:00.000Z",
    costImpact: false,
    photoLabels: ["Column finish"],
    completedBy: "Alex Morgan",
    completedAt: "2026-10-05T15:20:00.000Z",
    completionNote: "Touch-up blended and cleared for traffic.",
    completionPhotoLabels: ["Finished column"],
    verificationRequired: true,
  }),
  seed({
    id: "punch-003",
    projectId: "proj-lakeshore",
    number: "PUNCH #003",
    description: "Removed scope — duplicate entry",
    location: "Level 1",
    status: "void",
    assignedTo: "Alex Morgan",
    subcontractor: "",
    dueOffset: null,
    costImpact: false,
  }),
  seed({
    id: "punch-184",
    projectId: "proj-lakeshore",
    number: "PUNCH #184",
    description: "Sealant gap at curtain wall head",
    location: "East elevation · Level 3",
    status: "in_progress",
    assignedTo: "Alex Morgan",
    subcontractor: "Curtain Wall Systems",
    dueOffset: 1,
    costImpact: true,
    drawingPin: { sheet: "A-301", grid: "Grid E / Level 3" },
    photoLabels: ["Head joint"],
  }),
  seed({
    id: "punch-w-012",
    projectId: "proj-westbridge",
    number: "PUNCH #012",
    description: "Loading dock bollard paint chipped",
    location: "Dock 4",
    status: "open",
    assignedTo: "Jordan Lee",
    subcontractor: "Site Services",
    dueOffset: 4,
    costImpact: false,
  }),
];

let patches: Record<string, Partial<ProjectPunch>> = {};
const completionDrafts: Record<string, { note: string }> = {};
const listeners = new Set<() => void>();
const EMPTY: ProjectPunch[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribePunch(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPunchSession(): ProjectPunch[] {
  return EMPTY;
}

export function getServerPunchSession(): ProjectPunch[] {
  return EMPTY;
}

function fromSeed(record: PunchSeed, today: string): ProjectPunch {
  const { dueOffset, photoLabels, completionPhotoLabels, ...rest } = record;
  return {
    ...rest,
    dueDate: dueOffset === null ? null : addIsoDays(today, dueOffset),
    photos: normalizeWorkPhotos(photoLabels ?? []),
    completionPhotos: normalizeWorkPhotos(completionPhotoLabels ?? []),
  };
}

function applyPatch(punch: ProjectPunch): ProjectPunch {
  const patch = patches[punch.id];
  if (!patch) return punch;
  return {
    ...punch,
    ...patch,
    photos: patch.photos ?? punch.photos,
    completionPhotos: patch.completionPhotos ?? punch.completionPhotos,
    drawingPin: patch.drawingPin === undefined ? punch.drawingPin : patch.drawingPin,
  };
}

function syncPatch(id: string, offline: boolean, failed = false) {
  if (failed) {
    return { sync: "failed" as const, syncLabel: "Sync failed · Retry" };
  }
  if (offline) {
    return { sync: "queued" as const, syncLabel: "Saved locally · Queued for sync" };
  }
  return { sync: "synced" as const, syncLabel: "Synced" };
}

export function punchStatusLabel(status: PunchStatus): string {
  return STATUS_LABEL[status];
}

export function formatShortDate(iso: string): string {
  const date = parseIso(iso);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatPunchDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function isPendingVerification(punch: ProjectPunch): boolean {
  return punch.status === "completed" && punch.verificationRequired && !punch.verifiedBy;
}

export function punchWorkflowLabel(punch: ProjectPunch): string {
  if (punch.status === "verified") return "Verified";
  if (isPendingVerification(punch)) return "Pending verification";
  if (punch.status === "completed") return "Completed";
  if (punch.correctionNeeded && punch.status === "in_progress") return "Correction needed";
  return punchStatusLabel(punch.status);
}

export function isPunchOverdue(punch: ProjectPunch, today: string): boolean {
  if (!punch.dueDate) return false;
  if (punch.status !== "open" && punch.status !== "in_progress") return false;
  return punch.dueDate < today;
}

export function duePresentation(punch: ProjectPunch, today: string): string | null {
  if (!punch.dueDate) return null;
  if (isPunchOverdue(punch, today)) {
    return `Due ${formatShortDate(punch.dueDate)}`;
  }
  if (punch.dueDate === today) return "Due today";
  return `Due ${formatShortDate(punch.dueDate)}`;
}

export function canViewPunch(role: MockRole): boolean {
  const normalized = normalizeMockRole(role);
  return MORE_MENU_ITEMS.punch.roles.some((allowed) => normalizeMockRole(allowed) === normalized);
}

export function canAuthorPunch(role: MockRole): boolean {
  return canViewPunch(role);
}

export function canVerifyPunch(role: MockRole): boolean {
  const normalized = normalizeMockRole(role);
  return VERIFY_ROLES.some((allowed) => normalizeMockRole(allowed) === normalized);
}

export function canStartPunchWork(punch: ProjectPunch, role: MockRole): boolean {
  return canAuthorPunch(role) && punch.status === "open";
}

export function canContinuePunchWork(punch: ProjectPunch, role: MockRole): boolean {
  return canAuthorPunch(role) && punch.status === "in_progress";
}

export function canAddPunchEvidence(punch: ProjectPunch, role: MockRole): boolean {
  if (!canAuthorPunch(role)) return false;
  return punch.status === "open" || punch.status === "in_progress";
}

export function canEditCompletionEvidence(punch: ProjectPunch, role: MockRole): boolean {
  return canContinuePunchWork(punch, role);
}

export function canMarkPunchComplete(punch: ProjectPunch, role: MockRole): boolean {
  return canContinuePunchWork(punch, role);
}

export function canReviewVerification(punch: ProjectPunch, role: MockRole): boolean {
  return canVerifyPunch(role) && isPendingVerification(punch);
}

function comparePunch(a: ProjectPunch, b: ProjectPunch, today: string): number {
  const rank = (item: ProjectPunch) => {
    if (isPendingVerification(item)) return 2;
    if (isPunchOverdue(item, today)) return 0;
    if (item.status === "in_progress") return 1;
    if (item.status === "open") return 2;
    if (item.status === "completed") return 3;
    if (item.status === "verified") return 4;
    return 5;
  };
  const byRank = rank(a) - rank(b);
  if (byRank !== 0) return byRank;
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  return a.number < b.number ? -1 : 1;
}

export function projectPunchItems(projectId: string, today: string): ProjectPunch[] {
  return SEEDS.filter((item) => item.projectId === projectId)
    .map((item) => applyPatch(fromSeed(item, today)))
    .sort((a, b) => comparePunch(a, b, today));
}

export function getPunchById(id: string, today = todayIso()): ProjectPunch | undefined {
  const found = SEEDS.find((item) => item.id === id);
  return found ? applyPatch(fromSeed(found, today)) : undefined;
}

export function punchSummary(records: ProjectPunch[], today: string) {
  const active = records.filter((item) => item.status !== "void" && item.status !== "verified");
  return {
    total: active.length,
    open: records.filter((item) => item.status === "open").length,
    inProgress: records.filter((item) => item.status === "in_progress").length,
    overdue: records.filter((item) => isPunchOverdue(item, today)).length,
    pendingVerification: records.filter((item) => isPendingVerification(item)).length,
  };
}

export function visiblePunchItems(records: ProjectPunch[], filter: PunchFilter, query: string): ProjectPunch[] {
  const needle = query.trim().toLowerCase();
  return records.filter((item) => {
    if (filter !== "all" && item.status !== filter) return false;
    if (!needle) return true;
    const haystack = `${item.number} ${item.description} ${item.location} ${item.assignedTo}`.toLowerCase();
    return haystack.includes(needle);
  });
}

export function needsAttentionPunch(records: ProjectPunch[], today: string): ProjectPunch | null {
  const pending = records.filter((item) => isPendingVerification(item));
  if (pending.length > 0) {
    return pending.slice().sort((a, b) => comparePunch(a, b, today))[0] ?? null;
  }
  const candidates = records.filter(
    (item) => (item.status === "open" || item.status === "in_progress") && isPunchOverdue(item, today),
  );
  if (candidates.length === 0) return null;
  return candidates.slice().sort((a, b) => comparePunch(a, b, today))[0] ?? null;
}

export function drawingPinLine(pin: PunchDrawingPin | null): string | null {
  if (!pin) return null;
  return `${pin.sheet} · ${pin.grid}`;
}

export function costImpactLine(costImpact: boolean): string {
  return costImpact ? "Yes" : "No";
}

function mergePatch(id: string, patch: Partial<ProjectPunch>) {
  patches = { ...patches, [id]: { ...patches[id], ...patch } };
  emit();
}

export function updatePunchPhotos(id: string, photos: FieldPhoto[], offline: boolean) {
  mergePatch(id, {
    photos: photos.map((photo) => ({ ...photo })),
    ...syncPatch(id, offline),
  });
}

export function updatePunchCompletionPhotos(id: string, photos: FieldPhoto[], offline: boolean) {
  mergePatch(id, {
    completionPhotos: photos.map((photo) => ({ ...photo })),
    ...syncPatch(id, offline),
  });
}

export function readCompletionNoteDraft(id: string): string {
  return completionDrafts[id]?.note ?? "";
}

export function writeCompletionNoteDraft(id: string, note: string) {
  completionDrafts[id] = { note };
}

export function startPunchWork(id: string, offline: boolean): boolean {
  const punch = getPunchById(id);
  if (!punch || punch.status !== "open") return false;
  mergePatch(id, {
    status: "in_progress",
    correctionNeeded: false,
    ...syncPatch(id, offline),
  });
  return true;
}

export function markPunchComplete(
  id: string,
  input: { note: string; completionPhotos: FieldPhoto[]; completedBy: string },
  offline: boolean,
): boolean {
  const punch = getPunchById(id);
  if (!punch || punch.status !== "in_progress") return false;
  mergePatch(id, {
    status: "completed",
    completionNote: input.note.trim(),
    completionPhotos: input.completionPhotos.map((photo) => ({ ...photo })),
    completedBy: input.completedBy,
    completedAt: new Date().toISOString(),
    correctionNeeded: false,
    rejectionNote: "",
    rejectedBy: null,
    rejectedAt: null,
    ...syncPatch(id, offline),
  });
  delete completionDrafts[id];
  if (!offline && typeof window !== "undefined") {
    window.setTimeout(() => {
      mergePatch(id, { sync: "synced", syncLabel: "Synced" });
    }, 1200);
  }
  return true;
}

export function verifyPunch(id: string, verifiedBy: string, offline: boolean): boolean {
  const punch = getPunchById(id);
  if (!punch || !isPendingVerification(punch)) return false;
  mergePatch(id, {
    status: "verified",
    verifiedBy,
    verifiedAt: new Date().toISOString(),
    ...syncPatch(id, offline),
  });
  if (!offline && typeof window !== "undefined") {
    window.setTimeout(() => mergePatch(id, { sync: "synced", syncLabel: "Synced" }), 900);
  }
  return true;
}

export function rejectPunchVerification(
  id: string,
  input: { reason: string; rejectedBy: string },
  offline: boolean,
): boolean {
  const punch = getPunchById(id);
  if (!punch || !isPendingVerification(punch)) return false;
  mergePatch(id, {
    status: "in_progress",
    correctionNeeded: true,
    rejectionNote: input.reason.trim(),
    rejectedBy: input.rejectedBy,
    rejectedAt: new Date().toISOString(),
    ...syncPatch(id, offline),
  });
  if (!offline && typeof window !== "undefined") {
    window.setTimeout(() => mergePatch(id, { sync: "synced", syncLabel: "Synced" }), 900);
  }
  return true;
}

export function processPunchSyncQueue(offline: boolean) {
  if (offline) return;
  for (const seed of SEEDS) {
    const punch = getPunchById(seed.id);
    if (punch?.sync === "queued") {
      mergePatch(seed.id, { sync: "synced", syncLabel: "Synced" });
    }
  }
}

export function retryPunchSync(id: string, offline: boolean): boolean {
  const punch = getPunchById(id);
  if (!punch || punch.sync !== "failed") return false;
  mergePatch(id, syncPatch(id, offline));
  if (!offline && typeof window !== "undefined") {
    window.setTimeout(() => mergePatch(id, { sync: "synced", syncLabel: "Synced" }), 1000);
  }
  return true;
}
