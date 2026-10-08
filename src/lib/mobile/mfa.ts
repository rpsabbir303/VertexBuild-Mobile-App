import type { MockRole } from "./types";
import { NETWORK_FAIL_EMAIL } from "./auth";

/** Server-side MFA policy — client must not override. */
export type MfaRequirement = "none" | "required";

export type MfaPolicyEvaluation = {
  requirement: MfaRequirement;
  enrolled: boolean;
};

export type MfaEnrollmentPayload = {
  enrollmentId: string;
  provisioningUri: string;
  manualEntryKey: string;
  issuer: string;
  accountLabel: string;
  codeLength: number;
  recoveryAvailable: boolean;
};

export type MfaPendingPhase = "enroll" | "challenge";

export type MfaServerState = {
  email: string;
  phase: MfaPendingPhase;
  enrollmentId: string | null;
  provisioningUri: string | null;
  manualEntryKey: string | null;
  issuer: string | null;
  accountLabel: string | null;
  codeLength: number;
  recoveryAvailable: boolean;
  failedAttempts: number;
  primaryIssuedAt: number;
};

export type MfaVerifyPurpose = "enroll" | "challenge";

export type MfaVerifyErrorCode =
  | "incomplete"
  | "incorrect"
  | "expired"
  | "rate_limited"
  | "primary_expired"
  | "network"
  | "server";

export const MFA_STATE_STORAGE_KEY = "vertex-cms-mobile-mfa-server-state";
export const MFA_ENROLLED_STORAGE_KEY = "vertex-cms-mobile-mfa-enrolled-emails";

/** Primary sign-in validity window while MFA is pending (server policy mock). */
export const PRIMARY_MFA_WINDOW_MS = 12 * 60 * 1000;
/** Server attempt limit before rate limiting (mock contract). */
export const MFA_ATTEMPT_LIMIT = 5;

const AUTH_DELAY_MS = 650;
/** Demo valid TOTP accepted by mock server validation only. */
export const DEMO_VALID_TOTP = "654321";

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readEnrolledEmails(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(MFA_ENROLLED_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeEnrolledEmail(email: string) {
  if (typeof window === "undefined") return;
  const set = readEnrolledEmails();
  set.add(normalizeEmail(email));
  window.sessionStorage.setItem(MFA_ENROLLED_STORAGE_KEY, JSON.stringify(Array.from(set)));
}

export function readMfaServerState(): MfaServerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(MFA_STATE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MfaServerState;
  } catch {
    return null;
  }
}

export function writeMfaServerState(state: MfaServerState | null) {
  if (typeof window === "undefined") return;
  if (!state) {
    window.sessionStorage.removeItem(MFA_STATE_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(MFA_STATE_STORAGE_KEY, JSON.stringify(state));
}

export function clearMfaServerState() {
  writeMfaServerState(null);
}

/** Server policy table (prototype). */
const POLICY_BY_EMAIL: Record<string, MfaPolicyEvaluation> = {
  "alex.morgan@summitconstruction.com": { requirement: "required", enrolled: true },
  "jordan.lee@summitconstruction.com": { requirement: "required", enrolled: false },
};

export async function mockEvaluateMfaPolicy(email: string): Promise<MfaPolicyEvaluation> {
  await delay(AUTH_DELAY_MS);
  const normalized = normalizeEmail(email);
  const enrolledSet = readEnrolledEmails();
  const base = POLICY_BY_EMAIL[normalized] ?? { requirement: "none" as const, enrolled: false };
  if (base.requirement === "required") {
    return { requirement: "required", enrolled: base.enrolled || enrolledSet.has(normalized) };
  }
  return { requirement: "none", enrolled: false };
}

function buildEnrollmentPayload(email: string): MfaEnrollmentPayload {
  const enrollmentId = `enr-${Date.now()}`;
  const manualEntryKey = "K7R2M4VN8X3P9QHT";
  const issuer = "VertexBuild";
  const accountLabel = email;
  const provisioningUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
    accountLabel,
  )}?secret=${manualEntryKey}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

  return {
    enrollmentId,
    provisioningUri,
    manualEntryKey,
    issuer,
    accountLabel,
    codeLength: 6,
    recoveryAvailable: false,
  };
}

export async function mockBeginMfaFlow(input: {
  email: string;
  phase: MfaPendingPhase;
  primaryIssuedAt: number;
}): Promise<{ ok: true; state: MfaServerState } | { ok: false; code: "server" }> {
  await delay(AUTH_DELAY_MS);
  const normalized = normalizeEmail(input.email);
  if (normalized === NETWORK_FAIL_EMAIL) return { ok: false, code: "server" };

  let enrollment: MfaEnrollmentPayload | null = null;
  if (input.phase === "enroll") {
    enrollment = buildEnrollmentPayload(normalized);
  }

  const state: MfaServerState = {
    email: normalized,
    phase: input.phase,
    enrollmentId: enrollment?.enrollmentId ?? null,
    provisioningUri: enrollment?.provisioningUri ?? null,
    manualEntryKey: enrollment?.manualEntryKey ?? null,
    issuer: enrollment?.issuer ?? null,
    accountLabel: enrollment?.accountLabel ?? null,
    codeLength: enrollment?.codeLength ?? 6,
    recoveryAvailable: enrollment?.recoveryAvailable ?? false,
    failedAttempts: 0,
    primaryIssuedAt: input.primaryIssuedAt,
  };
  writeMfaServerState(state);
  return { ok: true, state };
}

export function getMfaVerifyErrorMessage(code: MfaVerifyErrorCode): string {
  switch (code) {
    case "incomplete":
      return "Enter the code from your authenticator app.";
    case "incorrect":
      return "That code is incorrect. Try the current code from your authenticator app.";
    case "expired":
      return "That code is no longer valid. Enter the current code from your authenticator app.";
    case "rate_limited":
      return "Too many attempts. Please try again later.";
    case "primary_expired":
      return "Your sign-in session expired. Sign in again to continue.";
    case "network":
      return "We couldn't verify your code. Check your connection and try again.";
    case "server":
      return "Unable to verify your code. Please try again.";
    default:
      return "Unable to verify your code. Please try again.";
  }
}

function primaryStillValid(state: MfaServerState): boolean {
  return Date.now() - state.primaryIssuedAt <= PRIMARY_MFA_WINDOW_MS;
}

export async function mockVerifyMfaTotp(input: {
  code: string;
  purpose: MfaVerifyPurpose;
}): Promise<{ ok: true } | { ok: false; code: MfaVerifyErrorCode }> {
  await delay(AUTH_DELAY_MS);
  const state = readMfaServerState();
  if (!state) return { ok: false, code: "server" };
  if (!primaryStillValid(state)) return { ok: false, code: "primary_expired" };
  if (state.email === NETWORK_FAIL_EMAIL) return { ok: false, code: "network" };

  const digits = input.code.replace(/\D/g, "");
  if (digits.length < state.codeLength) return { ok: false, code: "incomplete" };
  if (state.failedAttempts >= MFA_ATTEMPT_LIMIT) return { ok: false, code: "rate_limited" };

  if (digits === "000000") {
    return { ok: false, code: "expired" };
  }

  if (digits !== DEMO_VALID_TOTP) {
    writeMfaServerState({ ...state, failedAttempts: state.failedAttempts + 1 });
    if (state.failedAttempts + 1 >= MFA_ATTEMPT_LIMIT) {
      return { ok: false, code: "rate_limited" };
    }
    return { ok: false, code: "incorrect" };
  }

  if (input.purpose === "enroll" && state.phase !== "enroll") {
    return { ok: false, code: "server" };
  }
  if (input.purpose === "challenge" && state.phase !== "challenge") {
    return { ok: false, code: "server" };
  }

  writeEnrolledEmail(state.email);
  clearMfaServerState();
  return { ok: true };
}

export function mfaQrImageUrl(provisioningUri: string): string {
  return `https://quickchart.io/qr?size=200&margin=1&text=${encodeURIComponent(provisioningUri)}`;
}
