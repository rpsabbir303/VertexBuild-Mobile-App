/** Demo safety hub data — not official compliance or incident statistics. */

export type SafetyOverviewLevel = "normal" | "attention" | "critical";

export type SafetyPendingKind = "inspection" | "toolbox" | "jha" | "incident";

export type SafetyPendingItem = {
  id: string;
  kind: SafetyPendingKind;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: "neutral" | "attention" | "critical";
  href: string;
};

export type SafetyHomeData = {
  overviewLevel: SafetyOverviewLevel;
  overviewHeadline: string;
  overviewDetail: string;
  /** Field-oriented counts from demo data only. */
  openItemsCount: number;
  pending: SafetyPendingItem[];
  activeInspectionId: string | null;
};

export const SAFETY_ROUTES = {
  home: "/mobile-preview/tools/safety",
  incident: "/mobile-preview/tools/safety/incident",
  inspection: "/mobile-preview/tools/safety/inspection",
  toolbox: "/mobile-preview/tools/safety/toolbox",
  toolboxSign: "/mobile-preview/tools/safety/toolbox/sign",
  jha: "/mobile-preview/tools/safety/jha",
} as const;

export function toolboxSignHref(sessionId: string): string {
  return `${SAFETY_ROUTES.toolboxSign}?session=${encodeURIComponent(sessionId)}`;
}

const MOCK_BY_PROJECT: Record<string, SafetyHomeData> = {
  "proj-lakeshore": {
    overviewLevel: "attention",
    overviewHeadline: "Items need your attention",
    overviewDetail: "Complete pending field safety tasks before end of shift.",
    openItemsCount: 3,
    activeInspectionId: "insp-lake-weekly",
    pending: [
      {
        id: "p-insp-1",
        kind: "inspection",
        title: "Weekly site walk — Level 2",
        subtitle: "Started today · 4 of 12 checkpoints",
        statusLabel: "In progress",
        statusTone: "attention",
        href: SAFETY_ROUTES.inspection,
      },
      {
        id: "p-tb-1",
        kind: "toolbox",
        title: "Fall protection — Crew B",
        subtitle: "Acknowledgement due before mobilization",
        statusLabel: "Ack pending",
        statusTone: "attention",
        href: SAFETY_ROUTES.toolbox,
      },
      {
        id: "p-jha-1",
        kind: "jha",
        title: "Steel erection — Grid C",
        subtitle: "Updated controls require review",
        statusLabel: "Review",
        statusTone: "neutral",
        href: SAFETY_ROUTES.jha,
      },
    ],
  },
  "proj-westbridge": {
    overviewLevel: "normal",
    overviewHeadline: "Field safety on track",
    overviewDetail: "No critical items for this job site right now.",
    openItemsCount: 1,
    activeInspectionId: null,
    pending: [
      {
        id: "p-tb-2",
        kind: "toolbox",
        title: "Excavation hazards",
        subtitle: "Scheduled toolbox · Fri 7:00 AM",
        statusLabel: "Scheduled",
        statusTone: "neutral",
        href: SAFETY_ROUTES.toolbox,
      },
    ],
  },
  "proj-north-campus": {
    overviewLevel: "critical",
    overviewHeadline: "Critical follow-up required",
    overviewDetail: "Open incident and overdue inspection need immediate action.",
    openItemsCount: 2,
    activeInspectionId: null,
    pending: [
      {
        id: "p-inc-1",
        kind: "incident",
        title: "Near-miss — material swing radius",
        subtitle: "Superintendent review · open follow-up",
        statusLabel: "Open",
        statusTone: "critical",
        href: SAFETY_ROUTES.incident,
      },
      {
        id: "p-insp-2",
        kind: "inspection",
        title: "Scaffolding daily inspection",
        subtitle: "Overdue since yesterday",
        statusLabel: "Overdue",
        statusTone: "critical",
        href: SAFETY_ROUTES.inspection,
      },
    ],
  },
  "proj-harbor": {
    overviewLevel: "normal",
    overviewHeadline: "All clear for now",
    overviewDetail: "No pending safety tasks on this project.",
    openItemsCount: 0,
    activeInspectionId: null,
    pending: [],
  },
};

const DEFAULT: SafetyHomeData = {
  overviewLevel: "normal",
  overviewHeadline: "Safety hub",
  overviewDetail: "Report incidents, run inspections, and review field safety documents.",
  openItemsCount: 0,
  activeInspectionId: null,
  pending: [],
};

export function getSafetyHomeForProject(projectId: string): SafetyHomeData {
  return MOCK_BY_PROJECT[projectId] ?? DEFAULT;
}

export function projectHasSafetyMock(projectId: string): boolean {
  return Object.prototype.hasOwnProperty.call(MOCK_BY_PROJECT, projectId);
}

export function overviewLevelLabel(level: SafetyOverviewLevel): string {
  switch (level) {
    case "critical":
      return "Critical";
    case "attention":
      return "Attention";
    default:
      return "Normal";
  }
}
