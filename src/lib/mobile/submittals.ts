import { addIsoDays, parseIso, todayIso } from "./dailyLogs";
import { normalizeMockRole } from "./roleConfig";
import type { MockRole } from "./types";

export type SubmittalStatus = "draft" | "pending" | "approved" | "rejected" | "returned" | "closed";

export type SubmittalSync = "synced" | "saved_locally" | "queued" | "failed";

export type SubmittalRevision = {
  revision: number;
  fileName: string;
  updatedIso: string | null;
  superseded: boolean;
};

export type SubmittalComment = {
  id: string;
  author: string;
  body: string;
  timeLabel: string;
};

export type ProjectSubmittal = {
  id: string;
  projectId: string;
  number: string;
  title: string;
  status: SubmittalStatus;
  dueDate: string | null;
  responsibleParty: string;
  specSection: string;
  drawingNumber: string;
  packageTitle: string;
  currentRevision: number;
  revisions: SubmittalRevision[];
  comments: SubmittalComment[];
  sync: SubmittalSync;
  syncLabel: string;
  notice: string;
};

/** Lightweight mobile filters — access and status visibility, not a full filter system. */
export const SUBMITTAL_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Review" },
  { id: "approved", label: "Approved" },
  { id: "closed", label: "Closed" },
] as const;

export type SubmittalFilter = (typeof SUBMITTAL_FILTERS)[number]["id"];

type SubmittalSeed = Omit<ProjectSubmittal, "dueDate" | "revisions"> & {
  dueOffset: number | null;
  revisionFiles: Array<{ revision: number; fileName: string; updatedOffset: number | null }>;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const WRITE_ROLES: MockRole[] = ["project_manager", "superintendent", "foreman"];

const STATUS_LABEL: Record<SubmittalStatus, string> = {
  draft: "Draft",
  pending: "Awaiting Review",
  approved: "Approved",
  rejected: "Rejected",
  returned: "Returned",
  closed: "Closed",
};

function seed(input: {
  id: string;
  projectId: string;
  number: string;
  title: string;
  status: SubmittalStatus;
  dueOffset?: number | null;
  responsibleParty?: string;
  specSection?: string;
  drawingNumber?: string;
  packageTitle?: string;
  currentRevision: number;
  revisionFiles: Array<{ revision: number; fileName: string; updatedOffset: number | null }>;
  comments?: SubmittalComment[];
  sync?: SubmittalSync;
  syncLabel?: string;
}): SubmittalSeed {
  return {
    id: input.id,
    projectId: input.projectId,
    number: input.number,
    title: input.title,
    status: input.status,
    dueOffset: input.dueOffset ?? null,
    responsibleParty: input.responsibleParty ?? "Alex Morgan",
    specSection: input.specSection ?? "",
    drawingNumber: input.drawingNumber ?? "",
    packageTitle: input.packageTitle ?? input.title,
    currentRevision: input.currentRevision,
    revisionFiles: input.revisionFiles,
    comments: input.comments ?? [],
    sync: input.sync ?? "synced",
    syncLabel: input.syncLabel ?? "Synced",
    notice: "",
  };
}

const SEEDS: SubmittalSeed[] = [
  seed({
    id: "submittal-024",
    projectId: "proj-lakeshore",
    number: "Submittal #024",
    title: "Structural Steel Connection",
    status: "pending",
    dueOffset: 3,
    responsibleParty: "Alex Morgan",
    specSection: "05 12 00",
    drawingNumber: "S-204",
    packageTitle: "Structural Steel Connection",
    currentRevision: 3,
    revisionFiles: [
      { revision: 3, fileName: "Structural Connection Package.pdf", updatedOffset: -2 },
      { revision: 2, fileName: "Structural Connection Package.pdf", updatedOffset: -9 },
      { revision: 1, fileName: "Structural Connection Package.pdf", updatedOffset: -23 },
    ],
    comments: [
      {
        id: "cmt-024-1",
        author: "Structural engineer",
        body: "Review connection detail at grid E before fabrication continues.",
        timeLabel: "Oct 4 · 2:10 PM",
      },
    ],
  }),
  seed({
    id: "submittal-022",
    projectId: "proj-lakeshore",
    number: "Submittal #022",
    title: "Curtain wall anchor detail",
    status: "pending",
    dueOffset: 0,
    responsibleParty: "Alex Morgan",
    specSection: "08 44 00",
    drawingNumber: "A-501",
    currentRevision: 2,
    revisionFiles: [
      { revision: 2, fileName: "CW Anchor Detail Rev 2.pdf", updatedOffset: -1 },
      { revision: 1, fileName: "CW Anchor Detail Rev 1.pdf", updatedOffset: -12 },
    ],
  }),
  seed({
    id: "submittal-015",
    projectId: "proj-lakeshore",
    number: "Submittal #015",
    title: "Fire-rated door hardware",
    status: "pending",
    dueOffset: -2,
    responsibleParty: "Jordan Lee",
    specSection: "08 71 00",
    drawingNumber: "A-118",
    currentRevision: 1,
    revisionFiles: [{ revision: 1, fileName: "Door Hardware Submittal.pdf", updatedOffset: -5 }],
  }),
  seed({
    id: "submittal-011",
    projectId: "proj-lakeshore",
    number: "Submittal #011",
    title: "Mechanical duct insulation",
    status: "returned",
    dueOffset: 5,
    responsibleParty: "Alex Morgan",
    specSection: "23 07 00",
    drawingNumber: "M-302",
    currentRevision: 2,
    revisionFiles: [
      { revision: 2, fileName: "Duct Insulation Package.pdf", updatedOffset: -4 },
      { revision: 1, fileName: "Duct Insulation Package.pdf", updatedOffset: -18 },
    ],
    comments: [
      {
        id: "cmt-011-1",
        author: "Architect",
        body: "Resubmit with updated R-value documentation for the patient wing runs.",
        timeLabel: "Oct 3 · 11:05 AM",
      },
    ],
  }),
  seed({
    id: "submittal-009",
    projectId: "proj-lakeshore",
    number: "Submittal #009",
    title: "Epoxy flooring system",
    status: "draft",
    dueOffset: 7,
    responsibleParty: "Alex Morgan",
    specSection: "09 67 00",
    currentRevision: 1,
    revisionFiles: [{ revision: 1, fileName: "Epoxy Flooring Draft.pdf", updatedOffset: -1 }],
    sync: "queued",
    syncLabel: "Queued for sync",
  }),
  seed({
    id: "submittal-006",
    projectId: "proj-lakeshore",
    number: "Submittal #006",
    title: "Overhead door operator",
    status: "closed",
    dueOffset: -14,
    responsibleParty: "Alex Morgan",
    specSection: "08 33 00",
    currentRevision: 2,
    revisionFiles: [
      { revision: 2, fileName: "Overhead Door Operator.pdf", updatedOffset: -20 },
      { revision: 1, fileName: "Overhead Door Operator.pdf", updatedOffset: -35 },
    ],
  }),
  seed({
    id: "submittal-007",
    projectId: "proj-lakeshore",
    number: "Submittal #007",
    title: "Storefront glazing sample",
    status: "rejected",
    dueOffset: -6,
    responsibleParty: "Jordan Lee",
    specSection: "08 80 00",
    drawingNumber: "A-402",
    currentRevision: 1,
    revisionFiles: [{ revision: 1, fileName: "Glazing Sample.pdf", updatedOffset: -8 }],
    comments: [
      {
        id: "cmt-007-1",
        author: "Architect",
        body: "Sample does not match specified tint. Do not proceed with procurement.",
        timeLabel: "Sep 29 · 3:40 PM",
      },
    ],
  }),
  seed({
    id: "submittal-018",
    projectId: "proj-westbridge",
    number: "Submittal #018",
    title: "Dock leveler embed",
    status: "approved",
    dueOffset: -3,
    responsibleParty: "Jordan Lee",
    specSection: "11 13 00",
    drawingNumber: "S-140",
    currentRevision: 2,
    revisionFiles: [
      { revision: 2, fileName: "Dock Leveler Embed.pdf", updatedOffset: -4 },
      { revision: 1, fileName: "Dock Leveler Embed.pdf", updatedOffset: -16 },
    ],
    comments: [
      {
        id: "cmt-018-1",
        author: "Structural engineer",
        body: "Approved as noted. Maintain the north edge clearance shown on S-140.",
        timeLabel: "Oct 1 · 3:45 PM",
      },
    ],
  }),
  seed({
    id: "submittal-012",
    projectId: "proj-westbridge",
    number: "Submittal #012",
    title: "Loading dock seal",
    status: "pending",
    dueOffset: 2,
    responsibleParty: "Jordan Lee",
    specSection: "11 13 00",
    currentRevision: 1,
    revisionFiles: [{ revision: 1, fileName: "Dock Seal Submittal.pdf", updatedOffset: -2 }],
    sync: "failed",
    syncLabel: "Sync failed",
  }),
];

let patches: Record<string, Partial<ProjectSubmittal>> = {};
let commentDrafts: Record<string, string> = {};
const listeners = new Set<() => void>();
const EMPTY: ProjectSubmittal[] = [];
let storeVersion = 0;

function emit() {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
}

export function getSubmittalStoreVersion(): number {
  return storeVersion;
}

export function subscribeSubmittals(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSubmittalSession(): ProjectSubmittal[] {
  return EMPTY;
}

export function getServerSubmittalSession(): ProjectSubmittal[] {
  return EMPTY;
}

function formatShortDate(iso: string): string {
  const date = parseIso(iso);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function fromSeed(seedRecord: SubmittalSeed, today: string): ProjectSubmittal {
  const { dueOffset, revisionFiles, currentRevision, ...rest } = seedRecord;
  const revisions: SubmittalRevision[] = revisionFiles.map((file) => ({
    revision: file.revision,
    fileName: file.fileName,
    updatedIso: file.updatedOffset === null ? null : addIsoDays(today, file.updatedOffset),
    superseded: file.revision < currentRevision,
  }));
  return {
    ...rest,
    currentRevision,
    dueDate: dueOffset === null ? null : addIsoDays(today, dueOffset),
    revisions,
  };
}

function applyPatch(record: ProjectSubmittal): ProjectSubmittal {
  const patch = patches[record.id];
  if (!patch) return record;
  return {
    ...record,
    ...patch,
    revisions: patch.revisions ?? record.revisions,
    comments: patch.comments ?? record.comments,
  };
}

export function isSubmittalActive(status: SubmittalStatus): boolean {
  return status === "draft" || status === "pending" || status === "returned";
}

export function isSubmittalOverdue(record: ProjectSubmittal, today: string): boolean {
  if (!record.dueDate || !isSubmittalActive(record.status)) return false;
  return record.dueDate < today;
}

export function isSubmittalDueSoon(record: ProjectSubmittal, today: string): boolean {
  if (!record.dueDate || !isSubmittalActive(record.status)) return false;
  if (isSubmittalOverdue(record, today)) return false;
  const due = parseIso(record.dueDate).getTime();
  const now = parseIso(today).getTime();
  const span = due - now;
  return span >= 0 && span <= 2 * 86400000;
}

function daysPast(due: string, today: string): number {
  const span = parseIso(today).getTime() - parseIso(due).getTime();
  return Math.max(1, Math.round(span / 86400000));
}

export function duePresentation(record: ProjectSubmittal, today: string): string | null {
  if (!record.dueDate) return null;
  if (isSubmittalOverdue(record, today)) {
    const days = daysPast(record.dueDate, today);
    return days === 1 ? "Overdue · 1 day" : `Overdue · ${days} days`;
  }
  if (record.dueDate === today) return "Due today";
  return `Due ${formatShortDate(record.dueDate)}`;
}

export function submittalStatusLabel(status: SubmittalStatus): string {
  return STATUS_LABEL[status];
}

export function currentRevisionLabel(record: ProjectSubmittal): string {
  return `Rev ${record.currentRevision}`;
}

export function revisionUpdatedLabel(revision: SubmittalRevision, today: string): string | null {
  if (!revision.updatedIso) return null;
  return `Updated ${formatShortDate(revision.updatedIso)}`;
}

export function revisionStateLabel(revision: SubmittalRevision, current: number): string {
  if (revision.revision === current) return "Current";
  return "Superseded";
}

function compareSubmittals(a: ProjectSubmittal, b: ProjectSubmittal, today: string): number {
  const rank = (item: ProjectSubmittal) => {
    if (isSubmittalOverdue(item, today)) return 0;
    if (item.status === "pending") return 1;
    if (item.status === "returned") return 2;
    if (item.status === "draft") return 3;
    if (item.status === "approved") return 4;
    if (item.status === "rejected") return 5;
    return 6;
  };
  const byRank = rank(a) - rank(b);
  if (byRank !== 0) return byRank;
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  return a.number < b.number ? -1 : 1;
}

export function projectSubmittals(projectId: string, today: string): ProjectSubmittal[] {
  return SEEDS.filter((item) => item.projectId === projectId)
    .map((item) => applyPatch(fromSeed(item, today)))
    .sort((a, b) => compareSubmittals(a, b, today));
}

export function getSubmittalById(id: string, today = todayIso()): ProjectSubmittal | undefined {
  const found = SEEDS.find((item) => item.id === id);
  return found ? applyPatch(fromSeed(found, today)) : undefined;
}

export function submittalSummary(records: ProjectSubmittal[], today: string) {
  const active = records.filter((item) => isSubmittalActive(item.status));
  return {
    open: active.length,
    dueSoon: records.filter((item) => isSubmittalDueSoon(item, today)).length,
    overdue: records.filter((item) => isSubmittalOverdue(item, today)).length,
  };
}

export function visibleSubmittals(
  records: ProjectSubmittal[],
  filter: SubmittalFilter,
  query: string,
): ProjectSubmittal[] {
  const needle = query.trim().toLowerCase();
  return records.filter((item) => {
    if (filter === "pending" && item.status !== "pending" && item.status !== "returned") return false;
    if (filter === "approved" && item.status !== "approved") return false;
    if (filter === "closed" && item.status !== "closed" && item.status !== "rejected") return false;
    if (!needle) return true;
    const haystack = `${item.number} ${item.title} ${item.responsibleParty} ${item.specSection} ${item.drawingNumber}`.toLowerCase();
    return haystack.includes(needle);
  });
}

export function canWriteSubmittal(role: MockRole): boolean {
  return WRITE_ROLES.includes(normalizeMockRole(role));
}

/** Field review note — not a messaging workflow. */
export function canAddReviewNote(record: ProjectSubmittal, role: MockRole): boolean {
  if (!canWriteSubmittal(role)) return false;
  return record.status === "pending" || record.status === "returned";
}

export function readCommentDraft(id: string): string {
  return commentDrafts[id] ?? "";
}

export function writeCommentDraft(id: string, body: string) {
  commentDrafts = { ...commentDrafts, [id]: body };
}

function stamp(now = new Date()): string {
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${MONTHS[now.getMonth()]} ${now.getDate()} · ${hour12}:${minutes} ${suffix}`;
}

function syncPatch(offline: boolean, failed = false): Pick<ProjectSubmittal, "sync" | "syncLabel"> {
  if (failed) return { sync: "failed", syncLabel: "Sync failed" };
  if (offline) return { sync: "queued", syncLabel: "Queued for sync" };
  return { sync: "synced", syncLabel: "Synced" };
}

function mergePatch(id: string, patch: Partial<ProjectSubmittal>) {
  patches = { ...patches, [id]: { ...patches[id], ...patch } };
  emit();
}

export function addSubmittalReviewNote(
  id: string,
  input: { author: string; body: string; offline: boolean },
  role: MockRole,
): boolean {
  const current = getSubmittalById(id);
  if (!current || !canAddReviewNote(current, role)) return false;
  const body = input.body.trim();
  if (!body) return false;
  const comment: SubmittalComment = {
    id: `cmt-${Date.now().toString(36)}`,
    author: input.author,
    body,
    timeLabel: stamp(),
  };
  mergePatch(id, {
    comments: [...current.comments, comment],
    notice: "Review note saved",
    ...syncPatch(input.offline),
  });
  delete commentDrafts[id];
  return true;
}
