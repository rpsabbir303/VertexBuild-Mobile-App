import type { MockRole } from "./types";

export type PasswordRequirementId =
  | "length"
  | "upper"
  | "lower"
  | "number"
  | "special";

export type PasswordRequirement = {
  id: PasswordRequirementId;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "Minimum 8 characters",
    test: (p) => p.length >= 8,
  },
  {
    id: "upper",
    label: "Uppercase",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "Lowercase",
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: "number",
    label: "Number",
    test: (p) => /\d/.test(p),
  },
  {
    id: "special",
    label: "Special character",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export function evaluatePasswordRequirements(password: string) {
  return PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    met: req.test(password),
  }));
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((req) => req.test(password));
}

const WORK_EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidWorkEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return WORK_EMAIL.test(trimmed);
}

export type AuthAccount = {
  email: string;
  password: string;
  status: "active" | "inactive";
  role: MockRole;
  firstName: string;
  lastName: string;
  initials: string;
  company: string;
};

/** Provisioned org accounts — no self-service registration. */
export const PROVISIONED_ACCOUNTS: AuthAccount[] = [
  {
    email: "alex.morgan@summitconstruction.com",
    password: "Vertex2024!",
    status: "active",
    role: "project_manager",
    firstName: "Alex",
    lastName: "Morgan",
    initials: "AM",
    company: "Summit Construction Group",
  },
  {
    email: "jordan.lee@summitconstruction.com",
    password: "Vertex2024!",
    status: "active",
    role: "superintendent",
    firstName: "Jordan",
    lastName: "Lee",
    initials: "JL",
    company: "Summit Construction Group",
  },
  {
    email: "inactive@summitconstruction.com",
    password: "Vertex2024!",
    status: "inactive",
    role: "project_manager",
    firstName: "Inactive",
    lastName: "User",
    initials: "IU",
    company: "Summit Construction Group",
  },
];

export type LoginErrorCode =
  | "email_required"
  | "email_invalid"
  | "password_required"
  | "invalid_credentials"
  | "account_inactive"
  | "network";

export type LoginResult =
  | { ok: true; account: AuthAccount }
  | { ok: false; code: LoginErrorCode };

export type SendCodeErrorCode = "email_required" | "email_invalid" | "server";

export type VerifyOtpErrorCode =
  | "incomplete"
  | "incorrect"
  | "expired"
  | "network";

export type ResendCodeErrorCode = "server" | "cooldown";

export type ResetPasswordErrorCode =
  | "password_required"
  | "password_too_short"
  | "password_missing_upper"
  | "password_missing_lower"
  | "password_missing_number"
  | "password_weak"
  | "confirm_required"
  | "password_mismatch"
  | "session_expired"
  | "server";

/** Forgot-password reset step (no special character requirement). */
export const RESET_PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "Minimum 8 characters",
    test: (p) => p.length >= 8,
  },
  {
    id: "upper",
    label: "Uppercase letter",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "Lowercase letter",
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: "number",
    label: "Number",
    test: (p) => /\d/.test(p),
  },
];

export function evaluateResetPasswordRequirements(password: string) {
  return RESET_PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    met: req.test(password),
  }));
}

export function isResetPasswordValid(password: string): boolean {
  return RESET_PASSWORD_REQUIREMENTS.every((req) => req.test(password));
}

export function getResetPasswordValidationError(
  password: string,
): ResetPasswordErrorCode | null {
  if (!password) return "password_required";
  if (password.length < 8) return "password_too_short";
  if (!/[A-Z]/.test(password)) return "password_missing_upper";
  if (!/[a-z]/.test(password)) return "password_missing_lower";
  if (!/\d/.test(password)) return "password_missing_number";
  return null;
}

export type ResetPasswordResult = { ok: true } | { ok: false; code: ResetPasswordErrorCode };

export type PasswordRecoveryState = {
  email: string;
  otpCode: string;
  otpExpiresAt: number;
  lastSentAt: number;
  verified: boolean;
  resetSessionToken: string | null;
  resetSessionExpiresAt: number | null;
};

export const AUTH_SESSION_STORAGE_KEY = "vertex-cms-mobile-auth-session";
export const PASSWORD_RECOVERY_STORAGE_KEY = "vertex-cms-mobile-password-recovery";

export const OTP_RESEND_COOLDOWN_SEC = 45;
/** Documented OTP validity window (backend / session storage is source of truth). */
export const OTP_TTL_MS = 3 * 60 * 1000;
export const RESET_SESSION_TTL_MS = 15 * 60 * 1000;

/** Demo OTP for all successful send/resend operations (prototype). */
export const DEMO_VERIFICATION_CODE = "123456";

const AUTH_DELAY_MS = 850;
export const NETWORK_FAIL_EMAIL = "failnetwork@summitconstruction.com";
export const RESEND_FAIL_EMAIL = "resendfail@summitconstruction.com";
export const RESET_FAIL_EMAIL = "resetfail@summitconstruction.com";
export const EXPIRED_OTP_EMAIL = "expireotp@summitconstruction.com";

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function readPasswordRecovery(): PasswordRecoveryState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PasswordRecoveryState;
  } catch {
    return null;
  }
}

export function writePasswordRecovery(state: PasswordRecoveryState | null) {
  if (typeof window === "undefined") return;
  if (!state) {
    window.sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, JSON.stringify(state));
}

export function getResendCooldownRemainingSec(state: PasswordRecoveryState | null): number {
  if (!state) return 0;
  const elapsed = Math.floor((Date.now() - state.lastSentAt) / 1000);
  return Math.max(0, OTP_RESEND_COOLDOWN_SEC - elapsed);
}

/** Seconds until `otpExpiresAt`; derived from stored expiry timestamp only. */
export function getOtpExpiryRemainingSec(state: PasswordRecoveryState | null): number {
  if (!state) return 0;
  const msRemaining = state.otpExpiresAt - Date.now();
  if (msRemaining <= 0) return 0;
  return Math.ceil(msRemaining / 1000);
}

export function maskEmailForDisplay(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!domain) return "***";
  if (local.length === 1) return `${local}***@${domain}`;
  if (local.length === 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function isResetSessionActive(state: PasswordRecoveryState | null): boolean {
  if (!state?.verified || !state.resetSessionToken || !state.resetSessionExpiresAt) {
    return false;
  }
  return state.resetSessionExpiresAt > Date.now();
}

export function isOtpExpired(state: PasswordRecoveryState | null): boolean {
  if (!state) return true;
  return state.otpExpiresAt <= Date.now();
}

export function getLoginErrorMessage(code: LoginErrorCode): string {
  switch (code) {
    case "email_required":
      return "Enter your work email.";
    case "email_invalid":
      return "Enter a valid work email address.";
    case "password_required":
      return "Enter your password.";
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "account_inactive":
      return "Your account access has been disabled. Contact your administrator.";
    case "network":
      return "We couldn't reach the server. Check your connection and try again.";
    default:
      return "Something went wrong. Try again.";
  }
}

export function getSendCodeErrorMessage(code: SendCodeErrorCode): string {
  switch (code) {
    case "email_required":
      return "Email is required.";
    case "email_invalid":
      return "Enter a valid email address.";
    case "server":
      return "Something went wrong. Please try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function getVerifyOtpErrorMessage(code: VerifyOtpErrorCode): string {
  switch (code) {
    case "incomplete":
      return "Enter the 6-digit verification code.";
    case "incorrect":
      return "That code is incorrect. Please try again.";
    case "expired":
      return "Your verification code has expired.";
    case "network":
      return "Unable to verify the code. Please try again.";
    default:
      return "Unable to verify the code. Please try again.";
  }
}

export function getResendCodeErrorMessage(code: ResendCodeErrorCode): string {
  switch (code) {
    case "server":
      return "Couldn't resend the code. Please try again.";
    default:
      return "Couldn't resend the code. Please try again.";
  }
}

export function getResetPasswordErrorMessage(code: ResetPasswordErrorCode): string {
  switch (code) {
    case "password_required":
      return "Password is required.";
    case "password_too_short":
      return "Password must be at least 8 characters.";
    case "password_missing_upper":
      return "Password must contain at least one uppercase letter.";
    case "password_missing_lower":
      return "Password must contain at least one lowercase letter.";
    case "password_missing_number":
      return "Password must contain at least one number.";
    case "password_weak":
      return "Password does not meet the requirements.";
    case "confirm_required":
      return "Please confirm your password.";
    case "password_mismatch":
      return "Passwords do not match.";
    case "session_expired":
      return "Your password reset session has expired.";
    case "server":
      return "Unable to reset your password. Please try again.";
    default:
      return "Unable to reset your password. Please try again.";
  }
}

export async function mockLogin(email: string, password: string): Promise<LoginResult> {
  await delay(AUTH_DELAY_MS);
  const normalized = normalizeEmail(email);

  if (!normalized) return { ok: false, code: "email_required" };
  if (!isValidWorkEmail(normalized)) return { ok: false, code: "email_invalid" };
  if (!password) return { ok: false, code: "password_required" };
  if (normalized === NETWORK_FAIL_EMAIL) {
    return { ok: false, code: "network" };
  }

  const account = PROVISIONED_ACCOUNTS.find((a) => a.email.toLowerCase() === normalized);
  if (!account || account.password !== password) {
    return { ok: false, code: "invalid_credentials" };
  }
  if (account.status === "inactive") {
    return { ok: false, code: "account_inactive" };
  }
  return { ok: true, account };
}

function buildOtpChallenge(email: string): PasswordRecoveryState {
  const now = Date.now();
  const expiresAt =
    email === EXPIRED_OTP_EMAIL ? now - 1000 : now + OTP_TTL_MS;
  return {
    email,
    otpCode: DEMO_VERIFICATION_CODE,
    otpExpiresAt: expiresAt,
    lastSentAt: now,
    verified: false,
    resetSessionToken: null,
    resetSessionExpiresAt: null,
  };
}

export async function mockSendVerificationCode(email: string): Promise<
  | { ok: true; recovery: PasswordRecoveryState }
  | { ok: false; code: SendCodeErrorCode }
> {
  await delay(AUTH_DELAY_MS);
  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false, code: "email_required" };
  if (!isValidWorkEmail(normalized)) return { ok: false, code: "email_invalid" };
  if (normalized === NETWORK_FAIL_EMAIL) return { ok: false, code: "server" };

  const recovery = buildOtpChallenge(normalized);
  writePasswordRecovery(recovery);
  return { ok: true, recovery };
}

export async function mockResendVerificationCode(): Promise<
  | { ok: true; recovery: PasswordRecoveryState }
  | { ok: false; code: ResendCodeErrorCode }
> {
  await delay(AUTH_DELAY_MS);
  const existing = readPasswordRecovery();
  if (!existing) return { ok: false, code: "server" };
  if (getResendCooldownRemainingSec(existing) > 0) {
    return { ok: false, code: "cooldown" };
  }
  if (existing.email === RESEND_FAIL_EMAIL) return { ok: false, code: "server" };
  if (existing.email === NETWORK_FAIL_EMAIL) return { ok: false, code: "server" };

  const now = Date.now();
  const recovery: PasswordRecoveryState = {
    ...existing,
    otpCode: DEMO_VERIFICATION_CODE,
    otpExpiresAt: now + OTP_TTL_MS,
    lastSentAt: now,
    verified: false,
    resetSessionToken: null,
    resetSessionExpiresAt: null,
  };
  writePasswordRecovery(recovery);
  return { ok: true, recovery };
}

export async function mockVerifyOtp(code: string): Promise<
  | { ok: true; recovery: PasswordRecoveryState }
  | { ok: false; code: VerifyOtpErrorCode }
> {
  await delay(AUTH_DELAY_MS);
  const digits = code.replace(/\D/g, "");
  if (digits.length < 6) return { ok: false, code: "incomplete" };

  const recovery = readPasswordRecovery();
  if (!recovery) return { ok: false, code: "expired" };
  if (recovery.email === NETWORK_FAIL_EMAIL) return { ok: false, code: "network" };
  if (isOtpExpired(recovery)) return { ok: false, code: "expired" };

  if (digits !== recovery.otpCode) return { ok: false, code: "incorrect" };

  const now = Date.now();
  const verified: PasswordRecoveryState = {
    ...recovery,
    verified: true,
    resetSessionToken: `reset-${now}`,
    resetSessionExpiresAt: now + RESET_SESSION_TTL_MS,
  };
  writePasswordRecovery(verified);
  return { ok: true, recovery: verified };
}

export async function mockCompletePasswordReset(
  password: string,
  confirm: string,
): Promise<ResetPasswordResult> {
  await delay(AUTH_DELAY_MS);
  const recovery = readPasswordRecovery();
  if (!isResetSessionActive(recovery)) {
    return { ok: false, code: "session_expired" };
  }
  if (recovery!.email === RESET_FAIL_EMAIL || recovery!.email === NETWORK_FAIL_EMAIL) {
    return { ok: false, code: "server" };
  }

  const passwordError = getResetPasswordValidationError(password);
  if (passwordError) return { ok: false, code: passwordError };
  if (!confirm) return { ok: false, code: "confirm_required" };
  if (password !== confirm) return { ok: false, code: "password_mismatch" };

  writePasswordRecovery(null);
  return { ok: true };
}

export type StoredAuthSession = {
  email: string;
  role: MockRole;
  token: string;
  issuedAt: number;
};
