/** Demo incident capture — not persisted to a real safety backend. */

import type { MockRole } from "./types";
import type { FieldPhoto } from "./photoEvidence";
import { canAccessMoreMenuItem } from "./roleConfig";

export const INCIDENT_SUBMIT_FAIL_EMAIL = "incidentfail@summitconstruction.com";

export const INCIDENT_CATEGORIES = [
  { id: "near_miss", label: "Near miss" },
  { id: "injury", label: "Injury / illness" },
  { id: "property_damage", label: "Property damage" },
  { id: "equipment", label: "Equipment" },
  { id: "environmental", label: "Environmental" },
  { id: "other", label: "Other" },
] as const;

export type IncidentCategoryId = (typeof INCIDENT_CATEGORIES)[number]["id"];

export const INCIDENT_SEVERITIES = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "critical", label: "Critical" },
] as const;

export type IncidentSeverityId = (typeof INCIDENT_SEVERITIES)[number]["id"];

export const INJURY_SEVERITIES = [
  { id: "first_aid", label: "First aid only" },
  { id: "recordable", label: "Recordable" },
  { id: "lost_time", label: "Lost time" },
  { id: "unknown", label: "Unknown / assessing" },
] as const;

export type InjurySeverityId = (typeof INJURY_SEVERITIES)[number]["id"];

export type IncidentFormValues = {
  categoryId: IncidentCategoryId | null;
  occurredDate: string;
  occurredTime: string;
  siteLocation: string;
  title: string;
  description: string;
  peopleInvolved: string;
  severityId: IncidentSeverityId | null;
  injurySeverityId: InjurySeverityId | null;
  immediateActions: string;
  evidence: FieldPhoto[];
};

export type IncidentFieldErrors = Partial<
  Record<
    | "categoryId"
    | "occurredDate"
    | "occurredTime"
    | "title"
    | "description"
    | "severityId"
    | "injurySeverityId"
    | "evidence"
    | "form",
    string
  >
>;

export type IncidentDraftRecord = Omit<IncidentFormValues, "evidence"> & {
  evidence: FieldPhoto[];
  updatedAt: string;
};

const DRAFTS_KEY = "vertex-mobile-incident-drafts-v1";

let demoSequence = 0;
const submitted: { projectId: string; reference: string; submittedAt: string }[] = [];

function draftKey(projectId: string, userId: string) {
  return `${projectId}::${userId}`;
}

function readDraftStore(): Record<string, IncidentDraftRecord> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, IncidentDraftRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDraftStore(store: Record<string, IncidentDraftRecord>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(store));
}

export function loadIncidentDraft(projectId: string, userId: string): IncidentDraftRecord | null {
  const store = readDraftStore();
  return store[draftKey(projectId, userId)] ?? null;
}

export function saveIncidentDraft(projectId: string, userId: string, values: IncidentFormValues): void {
  const store = readDraftStore();
  store[draftKey(projectId, userId)] = {
    ...values,
    evidence: values.evidence.map((photo) => ({ ...photo })),
    updatedAt: new Date().toISOString(),
  };
  writeDraftStore(store);
}

export function clearIncidentDraft(projectId: string, userId: string): void {
  const store = readDraftStore();
  delete store[draftKey(projectId, userId)];
  writeDraftStore(store);
}

export function defaultIncidentForm(now = new Date()): IncidentFormValues {
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    categoryId: null,
    occurredDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    occurredTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    siteLocation: "",
    title: "",
    description: "",
    peopleInvolved: "",
    severityId: null,
    injurySeverityId: null,
    immediateActions: "",
    evidence: [],
  };
}

export function incidentCategoryLabel(id: IncidentCategoryId | null): string {
  if (!id) return "";
  return INCIDENT_CATEGORIES.find((item) => item.id === id)?.label ?? id;
}

export function incidentSeverityLabel(id: IncidentSeverityId | null): string {
  if (!id) return "";
  return INCIDENT_SEVERITIES.find((item) => item.id === id)?.label ?? id;
}

export function injurySeverityLabel(id: InjurySeverityId | null): string {
  if (!id) return "";
  return INJURY_SEVERITIES.find((item) => item.id === id)?.label ?? id;
}

function clean(value: string): string {
  return value.trim();
}

export function validateIncidentForm(values: IncidentFormValues): IncidentFieldErrors {
  const errors: IncidentFieldErrors = {};
  if (!values.categoryId) errors.categoryId = "Select an incident type.";
  if (!clean(values.occurredDate)) errors.occurredDate = "Enter the date of the incident.";
  if (!clean(values.occurredTime)) errors.occurredTime = "Enter the time of the incident.";
  if (!clean(values.title)) errors.title = "Add a short summary.";
  if (!clean(values.description)) errors.description = "Describe what happened.";
  if (!values.severityId) errors.severityId = "Select an overall severity.";
  if (values.categoryId === "injury" && !values.injurySeverityId) {
    errors.injurySeverityId = "Select injury severity for this report.";
  }
  if (values.evidence.some((photo) => photo.uploadStatus === "uploading")) {
    errors.evidence = "Wait for photos to finish uploading, or remove them.";
  }
  if (values.evidence.some((photo) => photo.uploadStatus === "failed")) {
    errors.evidence = "Retry or remove photos that failed to upload.";
  }
  return errors;
}

function nextDemoReference(projectId: string): string {
  demoSequence += 1;
  const count =
    submitted.filter((item) => item.projectId === projectId).length + demoSequence;
  return `INC-${String(count).padStart(4, "0")}`;
}

export type IncidentSubmitInput = IncidentFormValues & {
  projectId: string;
  projectName: string;
  reporterEmail: string;
  reporterName: string;
  offline: boolean;
};

export type IncidentSubmitResult =
  | { ok: true; reference: string; queued: boolean; notice: string }
  | { ok: false; code: "validation" | "network"; message: string };

const SUBMIT_MS = 1400;

export function canReportIncident(
  role: MockRole,
  accessibleProjectIds: string[],
  currentProjectId: string,
): boolean {
  return canAccessMoreMenuItem("safety", role, accessibleProjectIds, currentProjectId);
}

export async function submitIncidentReport(input: IncidentSubmitInput): Promise<IncidentSubmitResult> {
  const errors = validateIncidentForm(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, code: "validation", message: "Fix the highlighted fields and try again." };
  }

  await new Promise((resolve) => setTimeout(resolve, SUBMIT_MS));

  if (input.reporterEmail.toLowerCase() === INCIDENT_SUBMIT_FAIL_EMAIL) {
    return {
      ok: false,
      code: "network",
      message: "Could not submit this report. Check your connection and try again.",
    };
  }

  const reference = nextDemoReference(input.projectId);
  submitted.push({ projectId: input.projectId, reference, submittedAt: new Date().toISOString() });

  const queued = input.offline || input.evidence.some((p) => p.uploadStatus === "queued");
  return {
    ok: true,
    reference,
    queued,
    notice: queued
      ? "Report queued on this device. It will sync when you're back online."
      : "Report recorded on this device — not sent to authorities.",
  };
}
