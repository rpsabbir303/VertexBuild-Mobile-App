import { addIsoDays, parseIso, todayIso } from "./dailyLogs";
import { projectPunchItems } from "./punch";
import { projectRfis } from "./rfis";
import { projectSubmittals } from "./submittals";

export type DrawingDiscipline = "architectural" | "structural" | "mechanical" | "electrical";

export type DrawingRevision = {
  revision: number;
  updatedIso: string | null;
  superseded: boolean;
};

export type ProjectDrawing = {
  id: string;
  projectId: string;
  sheetNumber: string;
  title: string;
  discipline: DrawingDiscipline;
  currentRevision: number;
  revisions: DrawingRevision[];
};

export type DrawingDisciplineFilter = "all" | DrawingDiscipline;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DISCIPLINE_LABEL: Record<DrawingDiscipline, string> = {
  architectural: "Architectural",
  structural: "Structural",
  mechanical: "Mechanical",
  electrical: "Electrical",
};

const DISCIPLINE_ORDER: DrawingDiscipline[] = [
  "architectural",
  "structural",
  "mechanical",
  "electrical",
];

type DrawingSeed = Omit<ProjectDrawing, "revisions"> & {
  revisionHistory: Array<{ revision: number; updatedOffset: number | null }>;
};

function seed(input: {
  id: string;
  projectId: string;
  sheetNumber: string;
  title: string;
  discipline: DrawingDiscipline;
  currentRevision: number;
  revisionHistory: Array<{ revision: number; updatedOffset: number | null }>;
}): DrawingSeed {
  return {
    id: input.id,
    projectId: input.projectId,
    sheetNumber: input.sheetNumber,
    title: input.title,
    discipline: input.discipline,
    currentRevision: input.currentRevision,
    revisionHistory: input.revisionHistory,
  };
}

const SEEDS: DrawingSeed[] = [
  seed({
    id: "draw-a101",
    projectId: "proj-lakeshore",
    sheetNumber: "A-101",
    title: "Floor Plan — Level 1",
    discipline: "architectural",
    currentRevision: 4,
    revisionHistory: [
      { revision: 4, updatedOffset: -9 },
      { revision: 3, updatedOffset: -22 },
      { revision: 2, updatedOffset: -40 },
    ],
  }),
  seed({
    id: "draw-a102",
    projectId: "proj-lakeshore",
    sheetNumber: "A-102",
    title: "Floor Plan — Level 2",
    discipline: "architectural",
    currentRevision: 3,
    revisionHistory: [
      { revision: 3, updatedOffset: -5 },
      { revision: 2, updatedOffset: -18 },
    ],
  }),
  seed({
    id: "draw-a501",
    projectId: "proj-lakeshore",
    sheetNumber: "A-501",
    title: "Curtain Wall Elevations — Grid A",
    discipline: "architectural",
    currentRevision: 2,
    revisionHistory: [
      { revision: 2, updatedOffset: -3 },
      { revision: 1, updatedOffset: -25 },
    ],
  }),
  seed({
    id: "draw-s201",
    projectId: "proj-lakeshore",
    sheetNumber: "S-201",
    title: "Foundation Plan",
    discipline: "structural",
    currentRevision: 2,
    revisionHistory: [
      { revision: 2, updatedOffset: -12 },
      { revision: 1, updatedOffset: -30 },
    ],
  }),
  seed({
    id: "draw-s204",
    projectId: "proj-lakeshore",
    sheetNumber: "S-204",
    title: "Steel Connection Details — East Frame",
    discipline: "structural",
    currentRevision: 3,
    revisionHistory: [
      { revision: 3, updatedOffset: -2 },
      { revision: 2, updatedOffset: -14 },
      { revision: 1, updatedOffset: -28 },
    ],
  }),
  seed({
    id: "draw-m204",
    projectId: "proj-lakeshore",
    sheetNumber: "M-204",
    title: "Mechanical Room Plan — Level 1",
    discipline: "mechanical",
    currentRevision: 2,
    revisionHistory: [
      { revision: 2, updatedOffset: -7 },
      { revision: 1, updatedOffset: -21 },
    ],
  }),
  seed({
    id: "draw-m302",
    projectId: "proj-lakeshore",
    sheetNumber: "M-302",
    title: "Duct Riser Diagram",
    discipline: "mechanical",
    currentRevision: 1,
    revisionHistory: [{ revision: 1, updatedOffset: -4 }],
  }),
  seed({
    id: "draw-e101",
    projectId: "proj-lakeshore",
    sheetNumber: "E-101",
    title: "Power Plan — Level 1",
    discipline: "electrical",
    currentRevision: 2,
    revisionHistory: [
      { revision: 2, updatedOffset: -6 },
      { revision: 1, updatedOffset: -19 },
    ],
  }),
  seed({
    id: "draw-s140",
    projectId: "proj-westbridge",
    sheetNumber: "S-140",
    title: "Dock Leveler Embed Plan",
    discipline: "structural",
    currentRevision: 2,
    revisionHistory: [
      { revision: 2, updatedOffset: -4 },
      { revision: 1, updatedOffset: -16 },
    ],
  }),
];

function fromSeed(seedRecord: DrawingSeed, today: string): ProjectDrawing {
  const { revisionHistory, currentRevision, ...rest } = seedRecord;
  const revisions: DrawingRevision[] = revisionHistory.map((entry) => ({
    revision: entry.revision,
    updatedIso: entry.updatedOffset === null ? null : addIsoDays(today, entry.updatedOffset),
    superseded: entry.revision < currentRevision,
  }));
  return { ...rest, currentRevision, revisions };
}

function compareDrawings(a: ProjectDrawing, b: ProjectDrawing): number {
  if (a.discipline !== b.discipline) {
    return DISCIPLINE_ORDER.indexOf(a.discipline) - DISCIPLINE_ORDER.indexOf(b.discipline);
  }
  return a.sheetNumber.localeCompare(b.sheetNumber, undefined, { numeric: true });
}

export function disciplineLabel(discipline: DrawingDiscipline): string {
  return DISCIPLINE_LABEL[discipline];
}

export function disciplineSectionLabel(discipline: DrawingDiscipline): string {
  return DISCIPLINE_LABEL[discipline].toUpperCase();
}

export function projectDrawings(projectId: string, today: string): ProjectDrawing[] {
  return SEEDS.filter((item) => item.projectId === projectId)
    .map((item) => fromSeed(item, today))
    .sort(compareDrawings);
}

export function getDrawingById(id: string, today = todayIso()): ProjectDrawing | undefined {
  const found = SEEDS.find((item) => item.id === id);
  return found ? fromSeed(found, today) : undefined;
}

export function projectDisciplines(projectId: string, today: string): DrawingDiscipline[] {
  const set = new Set(projectDrawings(projectId, today).map((item) => item.discipline));
  return DISCIPLINE_ORDER.filter((d) => set.has(d));
}

export function disciplineFiltersForProject(projectId: string, today: string): Array<{ id: DrawingDisciplineFilter; label: string }> {
  const filters: Array<{ id: DrawingDisciplineFilter; label: string }> = [{ id: "all", label: "All" }];
  for (const discipline of projectDisciplines(projectId, today)) {
    filters.push({ id: discipline, label: disciplineLabel(discipline) });
  }
  return filters;
}

export function visibleDrawings(
  records: ProjectDrawing[],
  discipline: DrawingDisciplineFilter,
  query: string,
): ProjectDrawing[] {
  const needle = query.trim().toLowerCase();
  return records.filter((item) => {
    if (discipline !== "all" && item.discipline !== discipline) return false;
    if (!needle) return true;
    const haystack = `${item.sheetNumber} ${item.title} ${disciplineLabel(item.discipline)}`.toLowerCase();
    return haystack.includes(needle);
  });
}

export function groupDrawingsByDiscipline(records: ProjectDrawing[]): Array<{ discipline: DrawingDiscipline; items: ProjectDrawing[] }> {
  const groups = new Map<DrawingDiscipline, ProjectDrawing[]>();
  for (const record of records) {
    const list = groups.get(record.discipline) ?? [];
    list.push(record);
    groups.set(record.discipline, list);
  }
  return DISCIPLINE_ORDER.filter((d) => groups.has(d)).map((discipline) => ({
    discipline,
    items: groups.get(discipline)!.slice().sort((a, b) => a.sheetNumber.localeCompare(b.sheetNumber, undefined, { numeric: true })),
  }));
}

export function formatDrawingUpdated(iso: string | null): string | null {
  if (!iso) return null;
  const date = parseIso(iso);
  return `Updated ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function currentRevisionLine(revision: number): string {
  return `Rev ${revision}`;
}

export function revisionStatusLabel(revision: DrawingRevision, current: number): string {
  return revision.revision === current ? "Current" : "Superseded";
}

export function priorRevisions(drawing: ProjectDrawing): DrawingRevision[] {
  return drawing.revisions.filter((r) => r.superseded).sort((a, b) => b.revision - a.revision);
}

export function currentRevisionRecord(drawing: ProjectDrawing): DrawingRevision | undefined {
  return drawing.revisions.find((r) => r.revision === drawing.currentRevision);
}

export function revisionByNumber(drawing: ProjectDrawing, revision: number): DrawingRevision | undefined {
  return drawing.revisions.find((r) => r.revision === revision);
}

export function findDrawingBySheet(projectId: string, sheetNumber: string, today: string): ProjectDrawing | undefined {
  const normalized = sheetNumber.trim().toUpperCase();
  return projectDrawings(projectId, today).find((item) => item.sheetNumber.toUpperCase() === normalized);
}

export type DrawingRelatedRecord = {
  kind: "rfi" | "submittal" | "punch";
  id: string;
  label: string;
  href: string;
};

/** Links only where the existing modules reference this sheet number. */
export function relatedRecordsForDrawing(drawing: ProjectDrawing, today: string): DrawingRelatedRecord[] {
  const sheet = drawing.sheetNumber.toUpperCase();
  const out: DrawingRelatedRecord[] = [];

  for (const rfi of projectRfis(drawing.projectId, [], today)) {
    if (rfi.drawingNumber.trim().toUpperCase() === sheet) {
      out.push({
        kind: "rfi",
        id: rfi.id,
        label: rfi.number,
        href: `/mobile-preview/tools/rfis/${rfi.id}`,
      });
    }
  }
  for (const submittal of projectSubmittals(drawing.projectId, today)) {
    if (submittal.drawingNumber.trim().toUpperCase() === sheet) {
      out.push({
        kind: "submittal",
        id: submittal.id,
        label: submittal.number,
        href: `/mobile-preview/tools/submittals/${submittal.id}`,
      });
    }
  }
  for (const punch of projectPunchItems(drawing.projectId, today)) {
    const pinSheet = punch.drawingPin?.sheet?.trim().toUpperCase();
    if (pinSheet === sheet) {
      out.push({
        kind: "punch",
        id: punch.id,
        label: punch.number,
        href: `/mobile-preview/tools/punch/${punch.id}`,
      });
    }
  }
  return out;
}
