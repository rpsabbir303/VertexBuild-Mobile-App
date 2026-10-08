import type { MockRole } from "./types";
import {
  DEMO_VERIFICATION_CODE,
  OTP_RESEND_COOLDOWN_SEC,
  OTP_TTL_MS,
  getResetPasswordValidationError,
  isResetPasswordValid,
  type AuthAccount,
} from "./auth";

export type InvitationErrorCode =
  | "expired"
  | "revoked"
  | "used"
  | "invalid"
  | "network"
  | "server";

export type InvitationAccountKind = "new" | "existing";

export type InvitationActivationSession = {
  invitationId: string;
  email: string;
  accountKind: InvitationAccountKind;
  tenantName?: string;
  roleLabel?: string;
  projectLabels?: string[];
  inviterName?: string;
  verificationRequired: boolean;
  credentialsSet: boolean;
  verified: boolean;
  otpExpiresAt: number | null;
  otpCode: string | null;
  lastOtpSentAt: number | null;
  authorizedProjectIds: string[] | null;
  activatedRole: MockRole | null;
  firstName?: string;
  lastName?: string;
  initials?: string;
  company?: string;
};

export const INVITATION_ACTIVATION_STORAGE_KEY = "vertex-cms-mobile-invitation-activation";

const AUTH_DELAY_MS = 850;

/** Demo invitation tokens (prototype — validated server-side in this module only). */
export const INVITE_TOKEN_DEMO_NEW = "demo-new-field";
export const INVITE_TOKEN_DEMO_EXISTING = "demo-existing-pm";
export const INVITE_TOKEN_DEMO_NO_ACCESS = "demo-no-access";
export const INVITE_TOKEN_DEMO_EXPIRED = "demo-expired";
export const INVITE_TOKEN_DEMO_REVOKED = "demo-revoked";
export const INVITE_TOKEN_DEMO_USED = "demo-used";
export const INVITE_TOKEN_DEMO_INVALID = "demo-invalid-token";
export const INVITE_TOKEN_DEMO_NETWORK = "demo-network-fail";

type InvitationSeed =
  | {
      kind: "valid";
      invitationId: string;
      email: string;
      accountKind: InvitationAccountKind;
      tenantName: string;
      roleLabel: string;
      projectLabels: string[];
      authorizedProjectIds: string[];
      inviterName: string;
      verificationRequired: boolean;
      activatedRole: MockRole;
      firstName?: string;
      lastName?: string;
      initials?: string;
      company?: string;
    }
  | { kind: InvitationErrorCode };

const INVITATION_BY_TOKEN: Record<string, InvitationSeed> = {
  [INVITE_TOKEN_DEMO_NEW]: {
    kind: "valid",
    invitationId: "inv-2024-001",
    email: "casey.field@summitconstruction.com",
    accountKind: "new",
    tenantName: "Summit Construction Group",
    roleLabel: "Field Worker",
    projectLabels: ["Lakeshore Outpatient Pavilion"],
    authorizedProjectIds: ["proj-lakeshore"],
    inviterName: "Alex Morgan",
    verificationRequired: true,
    activatedRole: "field_worker",
    firstName: "Casey",
    lastName: "Field",
    initials: "CF",
    company: "Summit Construction Group",
  },
  [INVITE_TOKEN_DEMO_EXISTING]: {
    kind: "valid",
    invitationId: "inv-2024-002",
    email: "alex.morgan@summitconstruction.com",
    accountKind: "existing",
    tenantName: "Summit Construction Group",
    roleLabel: "Project Manager",
    projectLabels: ["Lakeshore Outpatient Pavilion", "Westbridge Distribution Hall"],
    authorizedProjectIds: ["proj-lakeshore", "proj-westbridge"],
    inviterName: "Jordan Lee",
    verificationRequired: false,
    activatedRole: "project_manager",
  },
  [INVITE_TOKEN_DEMO_NO_ACCESS]: {
    kind: "valid",
    invitationId: "inv-2024-003",
    email: "noaccess@summitconstruction.com",
    accountKind: "new",
    tenantName: "Summit Construction Group",
    roleLabel: "Consultant",
    projectLabels: [],
    authorizedProjectIds: [],
    inviterName: "Alex Morgan",
    verificationRequired: false,
    activatedRole: "field_worker",
    firstName: "No",
    lastName: "Access",
    initials: "NA",
    company: "Summit Construction Group",
  },
  [INVITE_TOKEN_DEMO_EXPIRED]: { kind: "expired" },
  [INVITE_TOKEN_DEMO_REVOKED]: { kind: "revoked" },
  [INVITE_TOKEN_DEMO_USED]: { kind: "used" },
  [INVITE_TOKEN_DEMO_NETWORK]: { kind: "network" },
};

const activatedPasswords = new Map<string, string>();

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function readInvitationActivation(): InvitationActivationSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(INVITATION_ACTIVATION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InvitationActivationSession;
  } catch {
    return null;
  }
}

export function writeInvitationActivation(state: InvitationActivationSession | null) {
  if (typeof window === "undefined") return;
  if (!state) {
    window.sessionStorage.removeItem(INVITATION_ACTIVATION_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(INVITATION_ACTIVATION_STORAGE_KEY, JSON.stringify(state));
}

export function clearInvitationActivation() {
  writeInvitationActivation(null);
}

function sessionFromValidSeed(seed: Extract<InvitationSeed, { kind: "valid" }>): InvitationActivationSession {
  const now = Date.now();
  const sendOtp = seed.verificationRequired && seed.accountKind === "new";
  return {
    invitationId: seed.invitationId,
    email: seed.email,
    accountKind: seed.accountKind,
    tenantName: seed.tenantName,
    roleLabel: seed.roleLabel,
    projectLabels: seed.projectLabels.length > 0 ? seed.projectLabels : undefined,
    inviterName: seed.inviterName,
    verificationRequired: seed.verificationRequired,
    credentialsSet: false,
    verified: !seed.verificationRequired,
    otpExpiresAt: sendOtp ? now + OTP_TTL_MS : null,
    otpCode: sendOtp ? DEMO_VERIFICATION_CODE : null,
    lastOtpSentAt: sendOtp ? now : null,
    authorizedProjectIds: null,
    activatedRole: seed.activatedRole,
    firstName: seed.firstName,
    lastName: seed.lastName,
    initials: seed.initials,
    company: seed.company,
  };
}

function getValidSeed(session: InvitationActivationSession): Extract<InvitationSeed, { kind: "valid" }> | null {
  const entry = Object.entries(INVITATION_BY_TOKEN).find(
    ([, seed]) => seed.kind === "valid" && seed.invitationId === session.invitationId,
  );
  return entry ? (entry[1] as Extract<InvitationSeed, { kind: "valid" }>) : null;
}

export function getInvitationErrorMessage(code: InvitationErrorCode): string {
  switch (code) {
    case "expired":
      return "This invitation has expired and can no longer be used.";
    case "revoked":
      return "This invitation was revoked and can no longer be used.";
    case "used":
      return "This invitation has already been used.";
    case "invalid":
      return "This invitation link is not valid.";
    case "network":
      return "We couldn't reach the server. Check your connection and try again.";
    case "server":
      return "Something went wrong. Please try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export type VerifyInvitationOtpErrorCode = "incomplete" | "incorrect" | "expired" | "network" | "server";

export function getVerifyInvitationOtpErrorMessage(code: VerifyInvitationOtpErrorCode): string {
  switch (code) {
    case "incomplete":
      return "Enter the 6-digit verification code.";
    case "incorrect":
      return "That code is incorrect. Please try again.";
    case "expired":
      return "Your verification code has expired.";
    case "network":
      return "Unable to verify the code. Please try again.";
    case "server":
      return "Unable to verify the code. Please try again.";
    default:
      return "Unable to verify the code. Please try again.";
  }
}

export function getInvitationOtpExpiryRemainingSec(session: InvitationActivationSession | null): number {
  if (!session?.otpExpiresAt) return 0;
  const ms = session.otpExpiresAt - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / 1000);
}

export function getInvitationResendCooldownSec(session: InvitationActivationSession | null): number {
  if (!session?.lastOtpSentAt) return 0;
  const elapsed = Math.floor((Date.now() - session.lastOtpSentAt) / 1000);
  return Math.max(0, OTP_RESEND_COOLDOWN_SEC - elapsed);
}

export async function mockValidateInvitationToken(token: string): Promise<
  | { ok: true; session: InvitationActivationSession }
  | { ok: false; code: InvitationErrorCode }
> {
  await delay(AUTH_DELAY_MS);
  const trimmed = token.trim();
  if (!trimmed || trimmed === INVITE_TOKEN_DEMO_INVALID) {
    return { ok: false, code: "invalid" };
  }

  const seed = INVITATION_BY_TOKEN[trimmed];
  if (!seed) return { ok: false, code: "invalid" };
  if (seed.kind === "network") return { ok: false, code: "network" };
  if (seed.kind !== "valid") return { ok: false, code: seed.kind };

  const session = sessionFromValidSeed(seed);
  writeInvitationActivation(session);
  return { ok: true, session };
}

export async function mockSetInvitationCredentials(input: {
  password: string;
  confirm: string;
}): Promise<
  | { ok: true; session: InvitationActivationSession }
  | { ok: false; code: ReturnType<typeof getResetPasswordValidationError> | "confirm_required" | "password_mismatch" | "server" | "session_missing" }
> {
  await delay(AUTH_DELAY_MS);
  const session = readInvitationActivation();
  if (!session || session.accountKind !== "new") {
    return { ok: false, code: "session_missing" };
  }

  const pwdError = getResetPasswordValidationError(input.password);
  if (pwdError) return { ok: false, code: pwdError };
  if (!input.confirm) return { ok: false, code: "confirm_required" };
  if (input.password !== input.confirm) return { ok: false, code: "password_mismatch" };

  activatedPasswords.set(normalizeEmail(session.email), input.password);
  const next: InvitationActivationSession = { ...session, credentialsSet: true };
  writeInvitationActivation(next);
  return { ok: true, session: next };
}

export async function mockVerifyInvitationOtp(code: string): Promise<
  | { ok: true; session: InvitationActivationSession }
  | { ok: false; code: VerifyInvitationOtpErrorCode }
> {
  await delay(AUTH_DELAY_MS);
  const digits = code.replace(/\D/g, "");
  if (digits.length < 6) return { ok: false, code: "incomplete" };

  const session = readInvitationActivation();
  if (!session?.verificationRequired) return { ok: false, code: "server" };
  if (!session.otpExpiresAt || session.otpExpiresAt <= Date.now()) {
    return { ok: false, code: "expired" };
  }
  if (digits !== session.otpCode) return { ok: false, code: "incorrect" };

  const next: InvitationActivationSession = { ...session, verified: true };
  writeInvitationActivation(next);
  return { ok: true, session: next };
}

export async function mockResendInvitationOtp(): Promise<
  | { ok: true; session: InvitationActivationSession }
  | { ok: false; code: "cooldown" | "server" }
> {
  await delay(AUTH_DELAY_MS);
  const session = readInvitationActivation();
  if (!session?.verificationRequired) return { ok: false, code: "server" };
  if (getInvitationResendCooldownSec(session) > 0) return { ok: false, code: "cooldown" };

  const now = Date.now();
  const next: InvitationActivationSession = {
    ...session,
    otpExpiresAt: now + OTP_TTL_MS,
    otpCode: DEMO_VERIFICATION_CODE,
    lastOtpSentAt: now,
  };
  writeInvitationActivation(next);
  return { ok: true, session: next };
}

export type FinalizeInvitationResult =
  | { ok: true; authorizedProjectIds: string[]; account: AuthAccount }
  | { ok: false; code: "session_missing" | "not_verified" | "email_mismatch" | "network" | "server" };

export async function mockFinalizeInvitationActivation(input: {
  authenticatedEmail?: string;
}): Promise<FinalizeInvitationResult> {
  await delay(AUTH_DELAY_MS);
  const session = readInvitationActivation();
  if (!session) return { ok: false, code: "session_missing" };

  const seed = getValidSeed(session);
  if (!seed) return { ok: false, code: "server" };

  if (session.accountKind === "existing") {
    if (!input.authenticatedEmail) return { ok: false, code: "session_missing" };
    if (normalizeEmail(input.authenticatedEmail) !== normalizeEmail(session.email)) {
      return { ok: false, code: "email_mismatch" };
    }
  } else {
    if (!session.credentialsSet) return { ok: false, code: "not_verified" };
    if (session.verificationRequired && !session.verified) {
      return { ok: false, code: "not_verified" };
    }
  }

  const authorizedProjectIds = [...seed.authorizedProjectIds];
  const email = session.email;
  let password = activatedPasswords.get(normalizeEmail(email));
  if (session.accountKind === "existing") {
    password = password ?? "Vertex2024!";
  }
  if (!password) return { ok: false, code: "server" };

  const account: AuthAccount = {
    email,
    password,
    status: "active",
    role: seed.activatedRole,
    firstName: session.firstName ?? seed.firstName ?? "Invited",
    lastName: session.lastName ?? seed.lastName ?? "User",
    initials: session.initials ?? seed.initials ?? "IU",
    company: session.company ?? seed.tenantName,
  };

  const next: InvitationActivationSession = {
    ...session,
    authorizedProjectIds,
  };
  writeInvitationActivation(next);

  return { ok: true, authorizedProjectIds, account };
}

export function tryActivatedAccountLogin(email: string, password: string): AuthAccount | null {
  const session = readInvitationActivation();
  const seed = session ? getValidSeed(session) : null;
  const normalized = normalizeEmail(email);
  const stored = activatedPasswords.get(normalized);
  if (!stored || stored !== password || !session || !seed) return null;
  if (session.accountKind !== "new" || !session.credentialsSet) return null;
  return {
    email: session.email,
    password: stored,
    status: "active",
    role: seed.activatedRole,
    firstName: session.firstName ?? seed.firstName ?? "Invited",
    lastName: session.lastName ?? seed.lastName ?? "User",
    initials: session.initials ?? seed.initials ?? "IU",
    company: session.company ?? seed.tenantName,
  };
}

export { isResetPasswordValid, getResetPasswordValidationError };
