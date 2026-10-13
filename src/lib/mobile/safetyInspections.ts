/** Demo safety inspections — not official OSHA or compliance checklists. */

import { getSafetyHomeForProject } from "./safety";
import type { FieldPhoto } from "./photoEvidence";
import type { MockRole } from "./types";
import { canAccessMoreMenuItem } from "./roleConfig";
import { INCIDENT_SEVERITIES, type IncidentSeverityId } from "./incidents";

export const INSPECTION_SUBMIT_FAIL_EMAIL = "inspectionfail@summitconstruction.com";

export const INSPECTION_RESULT_OPTIONS = [
  { id: "pass", label: "Pass" },
  { id: "attention", label: "Needs attention" },
  { id: "fail", label: "Fail" },
  { id: "na", label: "N/A" },
] as const;

export type InspectionResultId = (typeof INSPECTION_RESULT_OPTIONS)[number]["id"];

export type InspectionStatus = "not_started" | "in_progress" | "completed";

export type InspectionFinding = {
  description: string;
  severityId: IncidentSeverityId | null;
  correctiveAction: string;
  assignee: string;
  evidence: FieldPhoto[];
};

export type InspectionItemResponse = {
  result: InspectionResultId | null;
  note: string;
  finding: InspectionFinding;
};

export type InspectionChecklistItem = {
  id: string;
  section: string;
  prompt: string;
  required: boolean;
};

export type SafetyInspectionTemplate = {
  id: string;
  projectId: string;
  title: string;
  areaLabel: string;
  items: InspectionChecklistItem[];
};

export type InspectionProgress = {
  inspectionId: string;
  projectId: string;
  status: InspectionStatus;
  responses: Record<string, InspectionItemResponse>;
  updatedAt: string;
  completedAt?: string;
  demoReference?: string;
};

const PROGRESS_KEY = "vertex-mobile-safety-inspections-v1";

const TEMPLATES: Record<string, SafetyInspectionTemplate> = {
  "insp-lake-weekly": {
    id: "insp-lake-weekly",
    projectId: "proj-lakeshore",
    title: "Weekly site walk — Level 2",
    areaLabel: "Level 2 · East wing",
    items: [
      { id: "lw-1", section: "Site access", prompt: "Walkways and exits are clear and marked", required: true },
      { id: "lw-2", section: "Site access", prompt: "Barricades and signage protect active work zones", required: true },
      { id: "lw-3", section: "Fall protection", prompt: "Guardrails and covers are installed at open edges", required: true },
      { id: "lw-4", section: "Fall protection", prompt: "Personal fall arrest gear inspected and tagged", required: true },
      { id: "lw-5", section: "Housekeeping", prompt: "Debris and trip hazards removed from work areas", required: true },
      { id: "lw-6", section: "Housekeeping", prompt: "Material staging does not block fire lanes", required: true },
      { id: "lw-7", section: "Equipment", prompt: "Mobile equipment horns, lights and alarms functional", required: true },
      { id: "lw-8", section: "Equipment", prompt: "Ladders and scaffold tags are current", required: true },
      { id: "lw-9", section: "Emergency", prompt: "First aid kits stocked and accessible", required: true },
      { id: "lw-10", section: "Emergency", prompt: "Fire extinguishers visible and charged", required: true },
      { id: "lw-11", section: "Emergency", prompt: "Mustermaps posted at level entrances", required: false },
      { id: "lw-12", section: "Documentation", prompt: "Toolbox talk sign-in available for review", required: false },
    ],
  },
  "insp-north-scaffold": {
    id: "insp-north-scaffold",
    projectId: "proj-north-campus",
    title: "Scaffolding daily inspection",
    areaLabel: "Grid B · South elevation",
    items: [
      { id: "sc-1", section: "Base", prompt: "Mudsills and base plates properly seated", required: true },
      { id: "sc-2", section: "Base", prompt: "Scaffold level and plumb within tolerance", required: true },
      { id: "sc-3", section: "Structure", prompt: "Cross-bracing installed per erection plan", required: true },
      { id: "sc-4", section: "Structure", prompt: "Guardrails, mid-rails and toe boards in place", required: true },
      { id: "sc-5", section: "Access", prompt: "Ladder access secured and extends 3 ft above platform", required: true },
      { id: "sc-6", section: "Access", prompt: "Access gates self-close and latch", required: true },
      { id: "sc-7", section: "Load", prompt: "Load rating tag visible and respected", required: true },
      { id: "sc-8", section: "Tag", prompt: "Green tag signed for today’s shift", required: true },
    ],
  },
};

const PENDING_TO_INSPECTION: Record<string, string> = {
  "p-insp-1": "insp-lake-weekly",
  "p-insp-2": "insp-north-scaffold",
};

function emptyFinding(): InspectionFinding {
  return {
    description: "",
    severityId: null,
    correctiveAction: "",
    assignee: "",
    evidence: [],
  };
}

export function emptyItemResponse(): InspectionItemResponse {
  return { result: null, note: "", finding: emptyFinding() };
}

function readStore(): Record<string, InspectionProgress> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, InspectionProgress>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, InspectionProgress>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
}

function progressKey(inspectionId: string, userKey: string) {
  return `${inspectionId}::${userKey}`;
}

export function getInspectionTemplate(inspectionId: string): SafetyInspectionTemplate | null {
  return TEMPLATES[inspectionId] ?? null;
}

export function resolveInspectionIdForProject(projectId: string): string | null {
  const home = getSafetyHomeForProject(projectId);
  if (home.activeInspectionId && TEMPLATES[home.activeInspectionId]) {
    return home.activeInspectionId;
  }
  const pending = home.pending.find((item) => item.kind === "inspection");
  if (pending && PENDING_TO_INSPECTION[pending.id]) {
    return PENDING_TO_INSPECTION[pending.id];
  }
  return null;
}

function seedProgress(template: SafetyInspectionTemplate): InspectionProgress {
  const responses: Record<string, InspectionItemResponse> = {};
  for (const item of template.items) {
    responses[item.id] = emptyItemResponse();
  }
  if (template.id === "insp-lake-weekly") {
    for (const id of ["lw-1", "lw-2", "lw-3", "lw-4"]) {
      responses[id] = { ...emptyItemResponse(), result: "pass" };
    }
  }
  return {
    inspectionId: template.id,
    projectId: template.projectId,
    status: template.id === "insp-lake-weekly" ? "in_progress" : "not_started",
    responses,
    updatedAt: new Date().toISOString(),
  };
}

export function loadInspectionProgress(
  inspectionId: string,
  userKey: string,
): InspectionProgress | null {
  const template = getInspectionTemplate(inspectionId);
  if (!template) return null;
  const store = readStore();
  const saved = store[progressKey(inspectionId, userKey)];
  if (saved) {
    const merged = { ...saved, responses: { ...saved.responses } };
    for (const item of template.items) {
      if (!merged.responses[item.id]) merged.responses[item.id] = emptyItemResponse();
    }
    return merged;
  }
  return seedProgress(template);
}

export function saveInspectionProgress(progress: InspectionProgress, userKey: string): void {
  const store = readStore();
  store[progressKey(progress.inspectionId, userKey)] = {
    ...progress,
    responses: Object.fromEntries(
      Object.entries(progress.responses).map(([id, response]) => [
        id,
        {
          ...response,
          finding: {
            ...response.finding,
            evidence: response.finding.evidence.map((photo) => ({ ...photo })),
          },
        },
      ]),
    ),
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
}

export function inspectionStatusLabel(status: InspectionStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In progress";
    default:
      return "Not started";
  }
}

export function resultRequiresFinding(result: InspectionResultId | null): boolean {
  return result === "fail" || result === "attention";
}

export function countReviewed(
  template: SafetyInspectionTemplate,
  progress: InspectionProgress,
): { reviewed: number; total: number; requiredRemaining: number } {
  const total = template.items.length;
  let reviewed = 0;
  let requiredRemaining = 0;
  for (const item of template.items) {
    const result = progress.responses[item.id]?.result ?? null;
    if (result) reviewed += 1;
    else if (item.required) requiredRemaining += 1;
  }
  return { reviewed, total, requiredRemaining };
}

export type InspectionValidation = {
  itemErrors: Record<string, string>;
  formError?: string;
};

export function validateInspectionForCompletion(
  template: SafetyInspectionTemplate,
  progress: InspectionProgress,
): InspectionValidation {
  const itemErrors: Record<string, string> = {};
  for (const item of template.items) {
    const response = progress.responses[item.id] ?? emptyItemResponse();
    if (item.required && !response.result) {
      itemErrors[item.id] = "Record a result for this checkpoint.";
      continue;
    }
    if (response.result && resultRequiresFinding(response.result)) {
      if (!response.finding.description.trim()) {
        itemErrors[item.id] = "Add a finding description for fail or needs-attention items.";
      } else if (!response.finding.severityId) {
        itemErrors[item.id] = "Select finding severity.";
      }
    }
    if (response.finding.evidence.some((p) => p.uploadStatus === "uploading")) {
      itemErrors[item.id] = "Wait for photo uploads to finish.";
    }
    if (response.finding.evidence.some((p) => p.uploadStatus === "failed")) {
      itemErrors[item.id] = "Retry or remove failed photo uploads.";
    }
  }
  return { itemErrors };
}

export function canRunSafetyInspection(
  role: MockRole,
  accessibleProjectIds: string[],
  currentProjectId: string,
): boolean {
  return canAccessMoreMenuItem("safety", role, accessibleProjectIds, currentProjectId);
}

export function resultLabel(result: InspectionResultId | null): string {
  if (!result) return "Not reviewed";
  return INSPECTION_RESULT_OPTIONS.find((o) => o.id === result)?.label ?? result;
}

export function resultTone(result: InspectionResultId | null): "success" | "warning" | "danger" | "neutral" {
  if (result === "pass") return "success";
  if (result === "attention") return "warning";
  if (result === "fail") return "danger";
  if (result === "na") return "neutral";
  return "neutral";
}

const SUBMIT_MS = 1500;
let demoSeq = 0;

export type InspectionSubmitResult =
  | { ok: true; reference: string; queued: boolean; notice: string }
  | { ok: false; message: string };

export async function submitInspection(
  template: SafetyInspectionTemplate,
  progress: InspectionProgress,
  options: { reporterEmail: string; offline: boolean },
): Promise<InspectionSubmitResult> {
  const validation = validateInspectionForCompletion(template, progress);
  if (Object.keys(validation.itemErrors).length > 0) {
    return { ok: false, message: "Complete required checkpoints and findings before submitting." };
  }

  await new Promise((resolve) => setTimeout(resolve, SUBMIT_MS));

  if (options.reporterEmail.toLowerCase() === INSPECTION_SUBMIT_FAIL_EMAIL) {
    return {
      ok: false,
      message: "Could not submit this inspection. Check your connection and try again.",
    };
  }

  demoSeq += 1;
  const reference = `INSP-${String(demoSeq).padStart(4, "0")}`;
  const queued =
    options.offline ||
    Object.values(progress.responses).some((r) =>
      r.finding.evidence.some((p) => p.uploadStatus === "queued"),
    );

  return {
    ok: true,
    reference,
    queued,
    notice: queued
      ? "Inspection queued on this device. Sync when back online."
      : "Inspection recorded on this device.",
  };
}

export function markInspectionStarted(progress: InspectionProgress): InspectionProgress {
  if (progress.status === "completed") return progress;
  if (progress.status === "not_started") {
    return { ...progress, status: "in_progress" };
  }
  return progress;
}

export { INCIDENT_SEVERITIES as FINDING_SEVERITY_OPTIONS };
