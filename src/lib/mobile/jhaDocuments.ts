/** Demo JHA/JSA documents — not official hazard analysis or compliance records. */

import { getSafetyHomeForProject } from "./safety";
import type { MockRole } from "./types";
import { canAccessMoreMenuItem } from "./roleConfig";

export const JHA_ACK_FAIL_EMAIL = "jhafail@summitconstruction.com";

export const JHA_ACKNOWLEDGEMENT_STATEMENT =
  "I have read this job hazard analysis and understand the hazards and required controls for my assigned work.";

export type JhaDocumentStatus = "needs_review" | "acknowledged";

export type JhaWorkStep = {
  id: string;
  activity: string;
  hazards: string[];
  controls: string[];
};

export type JhaDocument = {
  id: string;
  projectId: string;
  pendingItemId: string;
  title: string;
  activitySummary: string;
  locationLabel: string;
  versionLabel: string;
  effectiveLabel: string;
  preparedBy: string;
  steps: JhaWorkStep[];
};

export type JhaReviewProgress = {
  documentId: string;
  projectId: string;
  userKey: string;
  reviewedStepIds: string[];
  updatedAt: string;
};

export type JhaAcknowledgementRecord = {
  documentId: string;
  projectId: string;
  userKey: string;
  participantName: string;
  reviewedStepIds: string[];
  statementAccepted: boolean;
  acknowledgedAt: string;
  demoReference: string;
  queued: boolean;
};

const PROGRESS_KEY = "vertex-mobile-jha-review-v1";
const ACK_KEY = "vertex-mobile-jha-ack-v1";

const DOCUMENTS: Record<string, JhaDocument> = {
  "jha-lake-steel-c": {
    id: "jha-lake-steel-c",
    projectId: "proj-lakeshore",
    pendingItemId: "p-jha-1",
    title: "Steel erection — Grid C",
    activitySummary: "Setting steel columns and beams at Grid C, Level 2 east wing.",
    locationLabel: "Grid C · Level 2 east wing",
    versionLabel: "Rev 3 · Updated controls",
    effectiveLabel: "Effective Sep 28, 2026",
    preparedBy: "Jordan Lee · Site Safety",
    steps: [
      {
        id: "step-1",
        activity: "Mobilize crane and rigging to Grid C",
        hazards: ["Struck-by from suspended loads", "Pinch points during rigging"],
        controls: ["Establish swing radius barricades", "Use tag-line handlers", "Verify rigging inspection tags"],
      },
      {
        id: "step-2",
        activity: "Set and plumb column lines C4–C7",
        hazards: ["Fall from elevation", "Manual handling strain"],
        controls: ["100% tie-off at leading edges", "Use mechanical lifting for columns over 35 lb per person"],
      },
      {
        id: "step-3",
        activity: "Bolt-up and temporary bracing",
        hazards: ["Dropped tools from elevation", "Structural instability during bolt-up"],
        controls: ["Tool tethering above grade", "Install temp bracing per erection plan before releasing load"],
      },
      {
        id: "step-4",
        activity: "Deck installation and opening protection",
        hazards: ["Fall through deck openings", "Trip hazards from materials"],
        controls: ["Cover or guard openings immediately", "Keep walk paths clear and marked"],
      },
      {
        id: "step-5",
        activity: "Turnover to connector crew",
        hazards: ["Miscommunication during shift handoff"],
        controls: ["Document open items on daily log", "Review JHA changes with incoming foreman"],
      },
    ],
  },
};

const PENDING_TO_DOC: Record<string, string> = {
  "p-jha-1": "jha-lake-steel-c",
};

function readProgressStore(): Record<string, JhaReviewProgress> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, JhaReviewProgress>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgressStore(store: Record<string, JhaReviewProgress>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
}

function readAckStore(): Record<string, JhaAcknowledgementRecord> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(ACK_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, JhaAcknowledgementRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAckStore(store: Record<string, JhaAcknowledgementRecord>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ACK_KEY, JSON.stringify(store));
}

function storeKey(documentId: string, userKey: string) {
  return `${documentId}::${userKey}`;
}

export function getJhaDocument(documentId: string): JhaDocument | null {
  return DOCUMENTS[documentId] ?? null;
}

export function listJhaDocumentsForProject(projectId: string): JhaDocument[] {
  return Object.values(DOCUMENTS).filter((doc) => doc.projectId === projectId);
}

export function resolveJhaDocumentsForProject(projectId: string): JhaDocument[] {
  const home = getSafetyHomeForProject(projectId);
  const fromPending = home.pending
    .filter((item) => item.kind === "jha")
    .map((item) => PENDING_TO_DOC[item.id])
    .filter((id): id is string => Boolean(id && DOCUMENTS[id]));

  const unique = Array.from(new Set(fromPending));
  if (unique.length > 0) return unique.map((id) => DOCUMENTS[id]);
  return listJhaDocumentsForProject(projectId);
}

export function loadJhaReviewProgress(documentId: string, userKey: string): JhaReviewProgress {
  const doc = getJhaDocument(documentId);
  const store = readProgressStore();
  const saved = store[storeKey(documentId, userKey)];
  if (saved) return { ...saved, reviewedStepIds: [...saved.reviewedStepIds] };
  return {
    documentId,
    projectId: doc?.projectId ?? "",
    userKey,
    reviewedStepIds: [],
    updatedAt: new Date().toISOString(),
  };
}

export function saveJhaReviewProgress(progress: JhaReviewProgress): void {
  const store = readProgressStore();
  store[storeKey(progress.documentId, progress.userKey)] = {
    ...progress,
    reviewedStepIds: [...progress.reviewedStepIds],
    updatedAt: new Date().toISOString(),
  };
  writeProgressStore(store);
}

export function loadJhaAcknowledgement(documentId: string, userKey: string): JhaAcknowledgementRecord | null {
  const store = readAckStore();
  return store[storeKey(documentId, userKey)] ?? null;
}

export function countStepReview(doc: JhaDocument, progress: JhaReviewProgress): { reviewed: number; total: number } {
  const total = doc.steps.length;
  const reviewed = doc.steps.filter((step) => progress.reviewedStepIds.includes(step.id)).length;
  return { reviewed, total };
}

export function allStepsReviewed(doc: JhaDocument, progress: JhaReviewProgress): boolean {
  return doc.steps.every((step) => progress.reviewedStepIds.includes(step.id));
}

export function documentStatusForUser(
  doc: JhaDocument,
  userKey: string,
): { status: JhaDocumentStatus; ack: JhaAcknowledgementRecord | null } {
  const ack = loadJhaAcknowledgement(doc.id, userKey);
  if (ack) return { status: "acknowledged", ack };
  return { status: "needs_review", ack: null };
}

export function jhaStatusLabel(status: JhaDocumentStatus): string {
  return status === "acknowledged" ? "Acknowledged" : "Needs review";
}

export function canAccessJhaDocuments(
  role: MockRole,
  accessibleProjectIds: string[],
  currentProjectId: string,
): boolean {
  return canAccessMoreMenuItem("safety", role, accessibleProjectIds, currentProjectId);
}

export type SubmitJhaAckInput = {
  documentId: string;
  userKey: string;
  participantName: string;
  statementAccepted: boolean;
  reporterEmail: string;
  offline: boolean;
};

export type SubmitJhaAckResult =
  | { ok: true; record: JhaAcknowledgementRecord; notice: string }
  | { ok: false; code: "validation" | "duplicate" | "not_ready" | "network"; message: string };

const ACK_MS = 1200;
let demoSeq = 0;

export async function submitJhaAcknowledgement(input: SubmitJhaAckInput): Promise<SubmitJhaAckResult> {
  const doc = getJhaDocument(input.documentId);
  if (!doc) return { ok: false, code: "not_ready", message: "This JHA/JSA is not available." };

  const existing = loadJhaAcknowledgement(input.documentId, input.userKey);
  if (existing) return { ok: false, code: "duplicate", message: "You have already acknowledged this JHA/JSA." };

  const progress = loadJhaReviewProgress(input.documentId, input.userKey);
  if (!allStepsReviewed(doc, progress)) {
    return { ok: false, code: "validation", message: "Review every work step before acknowledging." };
  }
  if (!input.statementAccepted) {
    return { ok: false, code: "validation", message: "Confirm the acknowledgement statement to continue." };
  }
  if (!input.participantName.trim()) {
    return { ok: false, code: "validation", message: "Enter your name for the acknowledgement record." };
  }

  await new Promise((resolve) => setTimeout(resolve, ACK_MS));

  if (input.reporterEmail.toLowerCase() === JHA_ACK_FAIL_EMAIL) {
    return {
      ok: false,
      code: "network",
      message: "Could not save your acknowledgement. Check your connection and try again.",
    };
  }

  demoSeq += 1;
  const demoReference = `JHA-${String(demoSeq).padStart(4, "0")}`;
  const record: JhaAcknowledgementRecord = {
    documentId: input.documentId,
    projectId: doc.projectId,
    userKey: input.userKey,
    participantName: input.participantName.trim(),
    reviewedStepIds: [...progress.reviewedStepIds],
    statementAccepted: true,
    acknowledgedAt: new Date().toISOString(),
    demoReference,
    queued: input.offline,
  };

  const store = readAckStore();
  store[storeKey(input.documentId, input.userKey)] = record;
  writeAckStore(store);

  return {
    ok: true,
    record,
    notice: input.offline
      ? "Acknowledgement queued on this device."
      : "Acknowledgement stored on this device — not a legal compliance record.",
  };
}
