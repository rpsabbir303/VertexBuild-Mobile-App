/** Demo toolbox talks — not official training or compliance records. */

import { getSafetyHomeForProject } from "./safety";
import type { MockRole } from "./types";
import { canAccessMoreMenuItem } from "./roleConfig";

export const TOOLBOX_ACK_FAIL_EMAIL = "toolboxfail@summitconstruction.com";
export const TOOLBOX_SIGN_FAIL_EMAIL = "toolboxsignfail@summitconstruction.com";

/** Same confirmation text as the toolbox participation checkbox. */
export const TOOLBOX_ACKNOWLEDGEMENT_STATEMENT =
  "I participated in this toolbox talk and understand the key safety points covered.";

export type ToolboxSessionStatus = "scheduled" | "in_progress" | "completed";

export type ParticipantStatus = "invited" | "joined" | "acknowledged";

export type ToolboxParticipant = {
  id: string;
  name: string;
  crew: string;
  status: ParticipantStatus;
};

export type ToolboxTalkSession = {
  id: string;
  projectId: string;
  pendingItemId: string;
  title: string;
  topic: string;
  description: string;
  keyPoints: string[];
  presenterName: string;
  scheduledLabel: string;
  locationLabel: string;
  crewLabel: string;
  initialStatus: ToolboxSessionStatus;
  roster: ToolboxParticipant[];
};

export type ToolboxParticipationRecord = {
  sessionId: string;
  projectId: string;
  userKey: string;
  participantName: string;
  crew: string;
  joinedAt?: string;
  acknowledgedAt?: string;
  understandingConfirmed: boolean;
  notes: string;
};

export type ToolboxSessionState = {
  sessionId: string;
  status: ToolboxSessionStatus;
  roster: ToolboxParticipant[];
  participations: Record<string, ToolboxParticipationRecord>;
  updatedAt: string;
  demoReference?: string;
};

const STATE_KEY = "vertex-mobile-toolbox-talks-v1";
const SIGNATURE_KEY = "vertex-mobile-toolbox-signatures-v1";

export type ToolboxSignatureRecord = {
  sessionId: string;
  projectId: string;
  userKey: string;
  participantName: string;
  statementAccepted: boolean;
  signatureDataUrl: string;
  signedAt: string;
  demoReference: string;
  queued: boolean;
};

function signatureStoreKey(sessionId: string, userKey: string) {
  return `${sessionId}::${userKey}`;
}

function readSignatureStore(): Record<string, ToolboxSignatureRecord> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(SIGNATURE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ToolboxSignatureRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSignatureStore(store: Record<string, ToolboxSignatureRecord>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SIGNATURE_KEY, JSON.stringify(store));
}

export function loadToolboxSignature(sessionId: string, userKey: string): ToolboxSignatureRecord | null {
  const store = readSignatureStore();
  return store[signatureStoreKey(sessionId, userKey)] ?? null;
}

export function canSignToolboxSession(sessionId: string, userKey: string): { ok: true } | { ok: false; message: string } {
  const session = getToolboxSession(sessionId);
  const state = loadToolboxSessionState(sessionId);
  if (!session || !state) return { ok: false, message: "This toolbox talk is not available." };
  if (state.status === "scheduled") {
    return { ok: false, message: "Complete the toolbox talk before signing. The session has not started." };
  }
  const participation = state.participations[userKey];
  if (!participation?.acknowledgedAt) {
    return {
      ok: false,
      message: "Acknowledge participation on the toolbox talk screen before adding your signature.",
    };
  }
  return { ok: true };
}

const SESSIONS: Record<string, ToolboxTalkSession> = {
  "tb-lake-fall-protect": {
    id: "tb-lake-fall-protect",
    projectId: "proj-lakeshore",
    pendingItemId: "p-tb-1",
    title: "Fall protection — Crew B",
    topic: "Fall protection and leading-edge work",
    description:
      "Review harness inspection, anchor points, and 100% tie-off expectations before Crew B mobilizes to Level 2 east wing.",
    keyPoints: [
      "Inspect harness, lanyard and SRL tags before each use.",
      "Maintain 100% tie-off when working within 6 ft of an unprotected edge.",
      "Confirm anchor points meet manufacturer load ratings.",
      "Report damaged guardrails or missing covers immediately.",
      "Stop work and re-brief if weather or scope changes affect fall exposure.",
    ],
    presenterName: "Jordan Lee · Site Safety",
    scheduledLabel: "Today · 6:30 AM · Before mobilization",
    locationLabel: "Level 2 staging · East wing",
    crewLabel: "Crew B — Steel & decking",
    initialStatus: "in_progress",
    roster: [
      { id: "pt-1", name: "Alex Morgan", crew: "Crew B", status: "acknowledged" },
      { id: "pt-2", name: "Sam Rivera", crew: "Crew B", status: "joined" },
      { id: "pt-3", name: "Chris Ortiz", crew: "Crew B", status: "invited" },
      { id: "pt-4", name: "Taylor Kim", crew: "Crew B", status: "invited" },
    ],
  },
  "tb-west-excavation": {
    id: "tb-west-excavation",
    projectId: "proj-westbridge",
    pendingItemId: "p-tb-2",
    title: "Excavation hazards",
    topic: "Excavation access and spoil pile safety",
    description:
      "Pre-shift toolbox covering soil conditions, access ramps, and spotter requirements for equipment working near open excavation.",
    keyPoints: [
      "Verify competent person sign-off before entry.",
      "Keep spoil piles at least 2 ft from excavation edge.",
      "Use designated ramps; no jumping across trenches.",
      "Maintain barricades and warning lines at all open cuts.",
      "Call for re-inspection after rain or vibration events.",
    ],
    presenterName: "Maria Santos · Superintendent",
    scheduledLabel: "Fri · 7:00 AM",
    locationLabel: "South laydown · Gate 3",
    crewLabel: "Earthwork crew",
    initialStatus: "scheduled",
    roster: [
      { id: "pt-5", name: "Devon Walsh", crew: "Earthwork", status: "invited" },
      { id: "pt-6", name: "Jamie Fox", crew: "Earthwork", status: "invited" },
    ],
  },
};

const PENDING_TO_SESSION: Record<string, string> = {
  "p-tb-1": "tb-lake-fall-protect",
  "p-tb-2": "tb-west-excavation",
};

function readStore(): Record<string, ToolboxSessionState> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ToolboxSessionState>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, ToolboxSessionState>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STATE_KEY, JSON.stringify(store));
}

export function getToolboxSession(sessionId: string): ToolboxTalkSession | null {
  return SESSIONS[sessionId] ?? null;
}

export function listToolboxSessionsForProject(projectId: string): ToolboxTalkSession[] {
  return Object.values(SESSIONS).filter((session) => session.projectId === projectId);
}

export function resolveToolboxSessionsForProject(projectId: string): ToolboxTalkSession[] {
  const home = getSafetyHomeForProject(projectId);
  const fromPending = home.pending
    .filter((item) => item.kind === "toolbox")
    .map((item) => PENDING_TO_SESSION[item.id])
    .filter((id): id is string => Boolean(id && SESSIONS[id]));

  const unique = Array.from(new Set(fromPending));
  if (unique.length > 0) {
    return unique.map((id) => SESSIONS[id]);
  }
  return listToolboxSessionsForProject(projectId);
}

function seedState(session: ToolboxTalkSession): ToolboxSessionState {
  return {
    sessionId: session.id,
    status: session.initialStatus,
    roster: session.roster.map((p) => ({ ...p })),
    participations: {},
    updatedAt: new Date().toISOString(),
  };
}

export function loadToolboxSessionState(sessionId: string): ToolboxSessionState | null {
  const session = getToolboxSession(sessionId);
  if (!session) return null;
  const store = readStore();
  const saved = store[sessionId];
  if (saved) {
    return {
      ...saved,
      roster: saved.roster.map((p) => ({ ...p })),
      participations: { ...saved.participations },
    };
  }
  return seedState(session);
}

export function saveToolboxSessionState(state: ToolboxSessionState): void {
  const store = readStore();
  store[state.sessionId] = { ...state, updatedAt: new Date().toISOString() };
  writeStore(store);
}

export function sessionStatusLabel(status: ToolboxSessionStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In progress";
    default:
      return "Scheduled";
  }
}

export function participantStatusLabel(status: ParticipantStatus): string {
  switch (status) {
    case "acknowledged":
      return "Acknowledged";
    case "joined":
      return "Joined";
    default:
      return "Invited";
  }
}

export function canAccessToolboxTalks(
  role: MockRole,
  accessibleProjectIds: string[],
  currentProjectId: string,
): boolean {
  return canAccessMoreMenuItem("safety", role, accessibleProjectIds, currentProjectId);
}

function rosterParticipantForUser(state: ToolboxSessionState, displayName: string): ToolboxParticipant | undefined {
  const normalized = displayName.toLowerCase();
  return state.roster.find((p) => p.name.toLowerCase() === normalized);
}

export function getUserParticipation(
  state: ToolboxSessionState,
  userKey: string,
): ToolboxParticipationRecord | null {
  return state.participations[userKey] ?? null;
}

export function startToolboxSession(sessionId: string): ToolboxSessionState | null {
  const state = loadToolboxSessionState(sessionId);
  if (!state || state.status !== "scheduled") return state;
  state.status = "in_progress";
  saveToolboxSessionState(state);
  return state;
}

export function joinToolboxSession(
  sessionId: string,
  userKey: string,
  participantName: string,
  crew: string,
): { ok: true; state: ToolboxSessionState } | { ok: false; code: "not_found" | "completed" | "already_acknowledged" } {
  const session = getToolboxSession(sessionId);
  const state = loadToolboxSessionState(sessionId);
  if (!session || !state) return { ok: false, code: "not_found" };
  if (state.status === "completed") return { ok: false, code: "completed" };

  const existing = state.participations[userKey];
  if (existing?.acknowledgedAt) return { ok: false, code: "already_acknowledged" };

  const joinedAt = existing?.joinedAt ?? new Date().toISOString();
  state.participations[userKey] = {
    sessionId,
    projectId: session.projectId,
    userKey,
    participantName: participantName.trim(),
    crew: crew.trim(),
    joinedAt,
    understandingConfirmed: existing?.understandingConfirmed ?? false,
    notes: existing?.notes ?? "",
  };

  let rosterMember = rosterParticipantForUser(state, participantName);
  if (rosterMember) {
    if (rosterMember.status === "invited") rosterMember.status = "joined";
  } else {
    rosterMember = {
      id: `pt-user-${userKey.slice(0, 8)}`,
      name: participantName.trim(),
      crew: crew.trim(),
      status: "joined",
    };
    state.roster.push(rosterMember);
  }

  if (state.status === "scheduled") state.status = "in_progress";
  saveToolboxSessionState(state);
  return { ok: true, state };
}

export type AcknowledgeInput = {
  sessionId: string;
  userKey: string;
  participantName: string;
  crew: string;
  understandingConfirmed: boolean;
  notes: string;
  reporterEmail: string;
  offline: boolean;
};

export type AcknowledgeResult =
  | { ok: true; reference: string; queued: boolean; notice: string; state: ToolboxSessionState }
  | { ok: false; code: "validation" | "duplicate" | "not_ready" | "network"; message: string };

const ACK_MS = 1200;

export async function acknowledgeToolboxParticipation(input: AcknowledgeInput): Promise<AcknowledgeResult> {
  if (!input.participantName.trim()) {
    return { ok: false, code: "validation", message: "Enter your name as it should appear on the attendance record." };
  }
  if (!input.understandingConfirmed) {
    return { ok: false, code: "validation", message: "Confirm that you participated and understood the key points." };
  }

  const session = getToolboxSession(input.sessionId);
  let state = loadToolboxSessionState(input.sessionId);
  if (!session || !state) {
    return { ok: false, code: "not_ready", message: "This toolbox talk is not available." };
  }
  if (state.status === "scheduled") {
    return { ok: false, code: "not_ready", message: "The session has not started yet. Join after the talk begins." };
  }
  if (state.status === "completed") {
    return { ok: false, code: "duplicate", message: "This toolbox talk is already closed." };
  }

  const prior = state.participations[input.userKey];
  if (prior?.acknowledgedAt) {
    return { ok: false, code: "duplicate", message: "You have already acknowledged this toolbox talk." };
  }

  await new Promise((resolve) => setTimeout(resolve, ACK_MS));

  if (input.reporterEmail.toLowerCase() === TOOLBOX_ACK_FAIL_EMAIL) {
    return {
      ok: false,
      code: "network",
      message: "Could not save your acknowledgement. Check your connection and try again.",
    };
  }

  const joinResult = joinToolboxSession(input.sessionId, input.userKey, input.participantName, input.crew);
  if (!joinResult.ok && joinResult.code !== "already_acknowledged") {
    return { ok: false, code: "not_ready", message: "Unable to record participation for this session." };
  }
  state = joinResult.ok ? joinResult.state : loadToolboxSessionState(input.sessionId)!;

  const acknowledgedAt = new Date().toISOString();
  state.participations[input.userKey] = {
    sessionId: input.sessionId,
    projectId: session.projectId,
    userKey: input.userKey,
    participantName: input.participantName.trim(),
    crew: input.crew.trim(),
    joinedAt: state.participations[input.userKey]?.joinedAt ?? acknowledgedAt,
    acknowledgedAt,
    understandingConfirmed: true,
    notes: input.notes.trim(),
  };

  const member = rosterParticipantForUser(state, input.participantName);
  if (member) member.status = "acknowledged";
  else {
    state.roster.push({
      id: `pt-user-${input.userKey.slice(0, 8)}`,
      name: input.participantName.trim(),
      crew: input.crew.trim(),
      status: "acknowledged",
    });
  }

  const allAcknowledged = state.roster.every((p) => p.status === "acknowledged");
  if (allAcknowledged) state.status = "completed";

  const reference = `TB-${String(Object.keys(state.participations).length).padStart(4, "0")}`;
  state.demoReference = reference;
  saveToolboxSessionState(state);

  const queued = input.offline;
  return {
    ok: true,
    reference,
    queued,
    notice: queued
      ? "Acknowledgement queued on this device."
      : "Participation recorded on this device — not a legal signature.",
    state,
  };
}

export type SubmitSignatureInput = {
  sessionId: string;
  userKey: string;
  participantName: string;
  statementAccepted: boolean;
  signatureDataUrl: string;
  reporterEmail: string;
  offline: boolean;
};

export type SubmitSignatureResult =
  | { ok: true; record: ToolboxSignatureRecord; notice: string }
  | { ok: false; code: "validation" | "duplicate" | "not_ready" | "network"; message: string };

const SIGN_MS = 1300;
let signDemoSeq = 0;

function signatureHasInk(dataUrl: string): boolean {
  return dataUrl.startsWith("data:image") && dataUrl.length > 500;
}

export async function submitToolboxSignature(input: SubmitSignatureInput): Promise<SubmitSignatureResult> {
  const eligible = canSignToolboxSession(input.sessionId, input.userKey);
  if (!eligible.ok) return { ok: false, code: "not_ready", message: eligible.message };

  const existing = loadToolboxSignature(input.sessionId, input.userKey);
  if (existing) return { ok: false, code: "duplicate", message: "You have already signed this toolbox talk." };

  if (!input.statementAccepted) {
    return { ok: false, code: "validation", message: "Confirm the acknowledgement statement before signing." };
  }
  if (!input.signatureDataUrl || !signatureHasInk(input.signatureDataUrl)) {
    return { ok: false, code: "validation", message: "Draw your signature in the box before submitting." };
  }

  const session = getToolboxSession(input.sessionId);
  if (!session) return { ok: false, code: "not_ready", message: "This toolbox talk is not available." };

  await new Promise((resolve) => setTimeout(resolve, SIGN_MS));

  if (input.reporterEmail.toLowerCase() === TOOLBOX_SIGN_FAIL_EMAIL) {
    return {
      ok: false,
      code: "network",
      message: "Could not save your signature. Check your connection and try again.",
    };
  }

  signDemoSeq += 1;
  const demoReference = `TBS-${String(signDemoSeq).padStart(4, "0")}`;
  const record: ToolboxSignatureRecord = {
    sessionId: input.sessionId,
    projectId: session.projectId,
    userKey: input.userKey,
    participantName: input.participantName.trim(),
    statementAccepted: true,
    signatureDataUrl: input.signatureDataUrl,
    signedAt: new Date().toISOString(),
    demoReference,
    queued: input.offline,
  };

  const store = readSignatureStore();
  store[signatureStoreKey(input.sessionId, input.userKey)] = record;
  writeSignatureStore(store);

  return {
    ok: true,
    record,
    notice: input.offline
      ? "Signature queued on this device."
      : "Signature stored on this device — not a legally binding record.",
  };
}
