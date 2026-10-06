import { addIsoDays, canAuthorDailyLog, parseIso, todayIso } from "./dailyLogs";
import type { MockRole } from "./types";

export type RfiStatus = "draft" | "open" | "answered" | "closed" | "void";
export type RfiPriority = "low" | "normal" | "high" | "urgent";
export type RfiSync = "synced" | "saved_locally" | "queued";

export type RfiResponse = {
  id: string;
  author: string;
  body: string;
  timeLabel: string;
  photos: string[];
};

export type ProjectRfi = {
  id: string;
  projectId: string;
  number: string;
  title: string;
  question: string;
  status: RfiStatus;
  priority: RfiPriority;
  dueDate: string | null;
  assignedTo: string;
  author: string;
  specSection: string;
  drawingNumber: string;
  location: string;
  costImpact: boolean;
  scheduleImpact: boolean;
  costNote: string;
  scheduleNote: string;
  responses: RfiResponse[];
  attachments: string[];
  sync: RfiSync;
  syncLabel: string;
  notice: string;
};

export const RFI_FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "answered", label: "Answered" },
  { id: "closed", label: "Closed" },
] as const;

export type RfiFilter = (typeof RFI_FILTERS)[number]["id"];

export type RfiWrite = {
  projectId: string;
  title: string;
  question: string;
  priority: RfiPriority;
  dueDate: string | null;
  assignedTo: string;
  specSection: string;
  drawingNumber: string;
  location: string;
  costImpact: boolean;
  scheduleImpact: boolean;
  costNote: string;
  scheduleNote: string;
  attachments: string[];
  author: string;
  offline: boolean;
  submit: boolean;
};

type RfiSeed = Omit<ProjectRfi, "dueDate"> & { dueOffset: number | null };

type ResponseDraft = { body: string; photos: string[] };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PRIORITY_LABEL: Record<RfiPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

function seed(input: {
  id: string;
  projectId: string;
  number: string;
  title: string;
  question: string;
  status: RfiStatus;
  priority: RfiPriority;
  dueOffset?: number | null;
  assignedTo?: string;
  author?: string;
  specSection?: string;
  drawingNumber?: string;
  location?: string;
  costImpact?: boolean;
  scheduleImpact?: boolean;
  costNote?: string;
  scheduleNote?: string;
  responses?: RfiResponse[];
  attachments?: string[];
}): RfiSeed {
  return {
    id: input.id,
    projectId: input.projectId,
    number: input.number,
    title: input.title,
    question: input.question,
    status: input.status,
    priority: input.priority,
    dueOffset: input.dueOffset ?? null,
    assignedTo: input.assignedTo ?? "",
    author: input.author ?? "Alex Morgan",
    specSection: input.specSection ?? "",
    drawingNumber: input.drawingNumber ?? "",
    location: input.location ?? "",
    costImpact: input.costImpact ?? false,
    scheduleImpact: input.scheduleImpact ?? false,
    costNote: input.costNote ?? "",
    scheduleNote: input.scheduleNote ?? "",
    responses: input.responses ?? [],
    attachments: input.attachments ?? [],
    sync: "synced",
    syncLabel: "Synced",
    notice: "",
  };
}

const SEEDS: RfiSeed[] = [
  seed({
    id: "rfi-022",
    projectId: "proj-lakeshore",
    number: "RFI #022",
    title: "Mechanical room clearance",
    question:
      "Can the mechanical room clearance be reduced to 8 feet without affecting equipment access?",
    status: "answered",
    priority: "high",
    dueOffset: -1,
    assignedTo: "Architect",
    specSection: "23 05 00",
    drawingNumber: "M-204",
    location: "Mechanical Room",
    attachments: ["Connection sketch"],
    responses: [
      {
        id: "resp-022",
        author: "Architect",
        body: "Clearance can be reduced to 8 feet if the coil pull space on the east side stays clear.",
        timeLabel: "Oct 4 · 4:18 PM",
        photos: [],
      },
    ],
  }),
  seed({
    id: "rfi-024",
    projectId: "proj-lakeshore",
    number: "RFI #024",
    title: "Structural steel connection",
    question: "Confirm the east-frame steel connection before placement continues today.",
    status: "open",
    priority: "high",
    dueOffset: 0,
    assignedTo: "Alex Morgan",
    author: "Jordan Lee",
    specSection: "05 12 00",
    drawingNumber: "S-112",
    location: "Level 2, east frame",
  }),
  seed({
    id: "rfi-016",
    projectId: "proj-lakeshore",
    number: "RFI #016",
    title: "Roof drain at penthouse",
    question: "The roof drain conflicts with the steel beam. Can the drain shift south to clear the flange?",
    status: "open",
    priority: "urgent",
    dueOffset: -2,
    assignedTo: "Architect",
    specSection: "22 14 00",
    drawingNumber: "P-301",
    location: "Penthouse roof",
    scheduleImpact: true,
    scheduleNote: "2 days",
  }),
  seed({
    id: "rfi-019",
    projectId: "proj-lakeshore",
    number: "RFI #019",
    title: "Curtain wall anchor at grid A",
    question: "Need confirmation on the curtain wall anchor before the embed is set.",
    status: "draft",
    priority: "normal",
    dueOffset: 4,
    assignedTo: "Architect",
    drawingNumber: "A-501",
    location: "Level 3, grid A",
  }),
  seed({
    id: "rfi-015",
    projectId: "proj-lakeshore",
    number: "RFI #015",
    title: "Slab edge at grid B",
    question: "Is the slab edge at grid B held to the architectural face or the structural face?",
    status: "closed",
    priority: "normal",
    dueOffset: -8,
    assignedTo: "Structural engineer",
    specSection: "03 30 00",
    drawingNumber: "S-201",
    location: "Level 1, grid B",
    responses: [
      {
        id: "resp-015",
        author: "Structural engineer",
        body: "Hold to the structural face. The architectural finish is applied outside that line.",
        timeLabel: "Oct 1 · 9:40 AM",
        photos: [],
      },
    ],
  }),
  seed({
    id: "rfi-011",
    projectId: "proj-lakeshore",
    number: "RFI #011",
    title: "Duplicate slab embed",
    question: "This repeats the slab edge question and should not stay open.",
    status: "void",
    priority: "low",
  }),
  seed({
    id: "rfi-018",
    projectId: "proj-westbridge",
    number: "RFI #018",
    title: "Dock leveler embed",
    question: "Can the dock leveler embed shift 4 inches north without conflicting with the slab edge?",
    status: "open",
    priority: "normal",
    dueOffset: 3,
    assignedTo: "Jordan Lee",
    specSection: "11 13 00",
    drawingNumber: "S-140",
    location: "Dock 4",
  }),
];

let created: ProjectRfi[] = [];
let patches: Record<string, Partial<ProjectRfi>> = {};
let responseDrafts: Record<string, ResponseDraft> = {};
const listeners = new Set<() => void>();
const EMPTY: ProjectRfi[] = [];

function emit() {
  created = created.slice();
  listeners.forEach((listener) => listener());
}

export function subscribeRfis(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRfiSession(): ProjectRfi[] {
  return created;
}

export function getServerRfiSession(): ProjectRfi[] {
  return EMPTY;
}

function fromSeed(seedRecord: RfiSeed, today: string): ProjectRfi {
  const { dueOffset, ...rest } = seedRecord;
  return {
    ...rest,
    dueDate: dueOffset === null ? null : addIsoDays(today, dueOffset),
  };
}

function applyPatch(rfi: ProjectRfi): ProjectRfi {
  const patch = patches[rfi.id];
  if (!patch) return rfi;
  return {
    ...rfi,
    ...patch,
    responses: patch.responses ?? rfi.responses,
    attachments: patch.attachments ?? rfi.attachments,
  };
}

function compareRfis(a: ProjectRfi, b: ProjectRfi, today: string): number {
  const rank = (rfi: ProjectRfi) => {
    if (isOverdue(rfi, today)) return 0;
    if (rfi.status === "open") return 1;
    if (rfi.status === "draft") return 2;
    if (rfi.status === "answered") return 3;
    if (rfi.status === "closed") return 4;
    return 5;
  };
  const byRank = rank(a) - rank(b);
  if (byRank !== 0) return byRank;
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  return a.number < b.number ? -1 : 1;
}

export function projectRfis(projectId: string, session: ProjectRfi[], today: string): ProjectRfi[] {
  const byId = new Map<string, ProjectRfi>();
  for (const item of SEEDS) {
    if (item.projectId === projectId) byId.set(item.id, applyPatch(fromSeed(item, today)));
  }
  for (const item of session) {
    if (item.projectId === projectId) byId.set(item.id, applyPatch(item));
  }
  return Array.from(byId.values()).sort((a, b) => compareRfis(a, b, today));
}

export function getRfiById(id: string, today = todayIso()): ProjectRfi | undefined {
  const sessionHit = created.find((rfi) => rfi.id === id);
  if (sessionHit) return applyPatch(sessionHit);
  const found = SEEDS.find((rfi) => rfi.id === id);
  return found ? applyPatch(fromSeed(found, today)) : undefined;
}

export function canAuthorRfi(role: MockRole): boolean {
  return canAuthorDailyLog(role);
}

export function canRespondToRfi(rfi: ProjectRfi, role: MockRole): boolean {
  return canAuthorRfi(role) && rfi.status === "open";
}

export function canEditRfi(rfi: ProjectRfi, role: MockRole): boolean {
  return canAuthorRfi(role) && rfi.status === "draft";
}

export function rfiStatusLabel(rfi: { status: RfiStatus; responses: readonly { id: string }[] }): string {
  if (rfi.status === "open" && rfi.responses.length === 0) return "Awaiting response";
  if (rfi.status === "draft") return "Draft";
  if (rfi.status === "open") return "Open";
  if (rfi.status === "answered") return "Answered";
  if (rfi.status === "closed") return "Closed";
  return "Void";
}

export function rfiPriorityLabel(priority: RfiPriority): string {
  return PRIORITY_LABEL[priority];
}

export function isOverdue(rfi: ProjectRfi, today: string): boolean {
  if (!rfi.dueDate) return false;
  if (rfi.status !== "open" && rfi.status !== "draft") return false;
  return rfi.dueDate < today;
}

export function formatShortDate(iso: string): string {
  const date = parseIso(iso);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function daysPast(due: string, today: string): number {
  const span = parseIso(today).getTime() - parseIso(due).getTime();
  return Math.max(1, Math.round(span / 86400000));
}

export function duePresentation(rfi: ProjectRfi, today: string): string | null {
  if (!rfi.dueDate) return null;
  if (isOverdue(rfi, today)) {
    const days = daysPast(rfi.dueDate, today);
    return days === 1 ? "Overdue · 1 day" : `Overdue · ${days} days`;
  }
  if (rfi.dueDate === today) return "Due today";
  return `Due ${formatShortDate(rfi.dueDate)}`;
}

export function rfiResponsibility(rfi: ProjectRfi): { label: string; name: string } | null {
  if (rfi.status === "void" || rfi.status === "closed") {
    return rfi.assignedTo ? { label: "Assigned to", name: rfi.assignedTo } : null;
  }
  if (rfi.status === "draft") {
    return rfi.author ? { label: "Draft with", name: rfi.author } : null;
  }
  if (rfi.status === "open") {
    return rfi.assignedTo ? { label: "Ball in court", name: rfi.assignedTo } : null;
  }
  return rfi.assignedTo ? { label: "Assigned to", name: rfi.assignedTo } : null;
}

export function rfiSummary(records: ProjectRfi[], today: string) {
  return {
    open: records.filter((rfi) => rfi.status === "open").length,
    awaiting: records.filter((rfi) => rfi.status === "open" && rfi.responses.length === 0).length,
    overdue: records.filter((rfi) => isOverdue(rfi, today)).length,
  };
}

export function visibleRfis(records: ProjectRfi[], filter: RfiFilter, query: string): ProjectRfi[] {
  const needle = query.trim().toLowerCase();
  return records.filter((rfi) => {
    if (filter !== "all" && rfi.status !== filter) return false;
    if (!needle) return true;
    return `${rfi.number} ${rfi.title} ${rfi.question}`.toLowerCase().includes(needle);
  });
}

export function impactLine(active: boolean, note: string): string {
  if (!active) return "No";
  const detail = note.trim();
  return detail ? `Yes · ${detail}` : "Yes";
}

export function readResponseDraft(id: string): ResponseDraft {
  return responseDrafts[id] ?? { body: "", photos: [] };
}

export function writeResponseDraft(id: string, draft: ResponseDraft) {
  responseDrafts = { ...responseDrafts, [id]: { body: draft.body, photos: draft.photos.slice() } };
}

export function clearResponseDraft(id: string) {
  if (!responseDrafts[id]) return;
  const next = { ...responseDrafts };
  delete next[id];
  responseDrafts = next;
}

function stamp(now = new Date()): string {
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${MONTHS[now.getMonth()]} ${now.getDate()} · ${hour12}:${minutes} ${suffix}`;
}

function syncState(offline: boolean, submitted: boolean): Pick<ProjectRfi, "sync" | "syncLabel" | "notice"> {
  if (offline && submitted) {
    return { sync: "queued", syncLabel: "Queued for sync", notice: submitted ? "RFI submitted" : "Draft saved" };
  }
  if (offline) {
    return { sync: "saved_locally", syncLabel: "Saved locally · Waiting to sync", notice: "Draft saved" };
  }
  if (submitted) {
    return { sync: "synced", syncLabel: "Synced", notice: "RFI submitted" };
  }
  return { sync: "synced", syncLabel: "Synced", notice: "Draft saved" };
}

function nextNumber(projectId: string): string {
  const numbers = [...SEEDS, ...created]
    .filter((rfi) => rfi.projectId === projectId)
    .map((rfi) => {
      const match = /#(\d+)/.exec(rfi.number);
      return match ? Number(match[1]) : 0;
    });
  const max = numbers.reduce((highest, value) => Math.max(highest, value), 0);
  return `RFI #${String(max + 1).padStart(3, "0")}`;
}

function clean(value: string): string {
  return value.trim();
}

export function createRfi(input: RfiWrite, role: MockRole): ProjectRfi | null {
  if (!canAuthorRfi(role)) return null;
  const title = clean(input.title);
  const question = clean(input.question);
  if (!title || !question) return null;
  const state = syncState(input.offline, input.submit);
  const rfi: ProjectRfi = {
    id: `rfi-new-${Date.now().toString(36)}`,
    projectId: input.projectId,
    number: nextNumber(input.projectId),
    title,
    question,
    status: input.submit ? "open" : "draft",
    priority: input.priority,
    dueDate: input.dueDate,
    assignedTo: clean(input.assignedTo),
    author: input.author,
    specSection: clean(input.specSection),
    drawingNumber: clean(input.drawingNumber),
    location: clean(input.location),
    costImpact: input.costImpact,
    scheduleImpact: input.scheduleImpact,
    costNote: input.costImpact ? clean(input.costNote) : "",
    scheduleNote: input.scheduleImpact ? clean(input.scheduleNote) : "",
    responses: [],
    attachments: input.attachments.slice(),
    ...state,
  };
  created = [...created, rfi];
  emit();
  return rfi;
}

export function saveRfiEdits(
  id: string,
  input: Omit<RfiWrite, "projectId" | "submit" | "author">,
  role: MockRole,
): boolean {
  const current = getRfiById(id);
  if (!current || !canEditRfi(current, role)) return false;
  const title = clean(input.title);
  const question = clean(input.question);
  if (!title || !question) return false;
  const state = syncState(input.offline, false);
  patches = {
    ...patches,
    [id]: {
      ...patches[id],
      title,
      question,
      priority: input.priority,
      dueDate: input.dueDate,
      assignedTo: clean(input.assignedTo),
      specSection: clean(input.specSection),
      drawingNumber: clean(input.drawingNumber),
      location: clean(input.location),
      costImpact: input.costImpact,
      scheduleImpact: input.scheduleImpact,
      costNote: input.costImpact ? clean(input.costNote) : "",
      scheduleNote: input.scheduleImpact ? clean(input.scheduleNote) : "",
      attachments: input.attachments.slice(),
      ...state,
    },
  };
  emit();
  return true;
}

export function submitRfi(id: string, offline: boolean, role: MockRole): boolean {
  const current = getRfiById(id);
  if (!current || !canEditRfi(current, role)) return false;
  if (!current.title.trim() || !current.question.trim()) return false;
  const state = syncState(offline, true);
  patches = {
    ...patches,
    [id]: {
      ...patches[id],
      status: "open",
      ...state,
    },
  };
  emit();
  return true;
}

export function addRfiResponse(
  id: string,
  response: { author: string; body: string; photos: string[]; offline: boolean },
  role: MockRole,
): boolean {
  const current = getRfiById(id);
  if (!current || !canRespondToRfi(current, role)) return false;
  const body = clean(response.body);
  if (!body) return false;
  const nextResponse: RfiResponse = {
    id: `resp-${Date.now().toString(36)}`,
    author: response.author,
    body,
    photos: response.photos.slice(),
    timeLabel: stamp(),
  };
  const attachments = current.attachments.slice();
  for (const photo of response.photos) {
    if (!attachments.includes(photo)) attachments.push(photo);
  }
  patches = {
    ...patches,
    [id]: {
      ...patches[id],
      responses: [...current.responses, nextResponse],
      attachments,
      status: "answered",
      sync: response.offline ? "queued" : "synced",
      syncLabel: response.offline ? "Queued for sync" : "Synced",
      notice: "Response saved",
    },
  };
  clearResponseDraft(id);
  emit();
  return true;
}

export function syncQueuedRfi(id: string, offline: boolean): boolean {
  const current = getRfiById(id);
  if (!current || current.sync === "synced") return false;
  if (offline) return false;
  patches = {
    ...patches,
    [id]: {
      ...patches[id],
      sync: "synced",
      syncLabel: "Synced",
      notice: "Synced",
    },
  };
  emit();
  return true;
}
