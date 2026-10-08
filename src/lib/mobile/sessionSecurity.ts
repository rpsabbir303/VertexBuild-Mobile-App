import type { MockRole } from "./types";
import type { StoredAuthSession } from "./auth";

const AUTH_DELAY_MS = 650;

export const MOCK_SERVER_SESSIONS_KEY = "vertex-cms-mock-server-sessions";
export const PENDING_REMOTE_LOGOUT_KEY = "vertex-cms-pending-remote-logout";
export const SESSION_RETURN_PATH_KEY = "vertex-cms-session-return-path";
export const SESSION_END_REASON_KEY = "vertex-cms-session-end-reason";

export const REMOTE_LOGOUT_FAIL_EMAIL = "logoutfail@summitconstruction.com";

/** Prototype accounts — server session flags are set at sign-in, not client timers. */
export const DEMO_SESSION_EXPIRED_EMAIL = "session.expired@summitconstruction.com";
export const DEMO_SESSION_REVOKED_EMAIL = "session.revoked@summitconstruction.com";
export const DEMO_SESSION_SUSPENDED_EMAIL = "session.suspended@summitconstruction.com";
export const DEMO_SESSION_PERMISSION_EMAIL = "session.permission@summitconstruction.com";

export type SessionEndReason = "expired" | "revoked" | "suspended" | "permission_changed";

export type SessionRevalidateResult =
  | { ok: true; session: StoredAuthSession; permissionChanged: boolean }
  | { ok: false; code: SessionEndReason | "network" | "invalid" };

export type RemoteLogoutResult =
  | { ok: true }
  | { ok: false; code: "network" | "server" };

type MockServerSessionRecord = {
  accessToken: string;
  refreshToken: string;
  email: string;
  role: MockRole;
  status: "active" | "revoked" | "suspended" | "expired";
  permissionDemoValidated: boolean;
};

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function readServerSessions(): Record<string, MockServerSessionRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MOCK_SERVER_SESSIONS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, MockServerSessionRecord>;
  } catch {
    return {};
  }
}

function writeServerSessions(sessions: Record<string, MockServerSessionRecord>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_SERVER_SESSIONS_KEY, JSON.stringify(sessions));
}

export function registerMockServerSession(input: {
  accessToken: string;
  email: string;
  role: MockRole;
}): StoredAuthSession {
  const refreshToken = `refresh-${input.accessToken}`;
  let status: MockServerSessionRecord["status"] = "active";

  const email = input.email.toLowerCase();
  if (email === DEMO_SESSION_EXPIRED_EMAIL) status = "expired";
  if (email === DEMO_SESSION_REVOKED_EMAIL) status = "revoked";
  if (email === DEMO_SESSION_SUSPENDED_EMAIL) status = "suspended";

  const record: MockServerSessionRecord = {
    accessToken: input.accessToken,
    refreshToken,
    email,
    role: input.role,
    status,
    permissionDemoValidated: false,
  };

  const sessions = readServerSessions();
  sessions[input.accessToken] = record;
  writeServerSessions(sessions);

  return {
    email: input.email,
    role: input.role,
    token: input.accessToken,
    refreshToken,
    issuedAt: Date.now(),
    mfaVerified: true,
  };
}

export function clearMockServerSession(accessToken: string | null | undefined) {
  if (!accessToken || typeof window === "undefined") return;
  const sessions = readServerSessions();
  delete sessions[accessToken];
  writeServerSessions(sessions);
}

export function readSessionEndReason(): SessionEndReason | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_END_REASON_KEY);
  if (raw === "expired" || raw === "revoked" || raw === "suspended" || raw === "permission_changed") {
    return raw;
  }
  return null;
}

export function writeSessionEndReason(reason: SessionEndReason | null) {
  if (typeof window === "undefined") return;
  if (!reason) {
    sessionStorage.removeItem(SESSION_END_REASON_KEY);
    return;
  }
  sessionStorage.setItem(SESSION_END_REASON_KEY, reason);
}

export function captureSessionReturnPath(pathname: string) {
  if (typeof window === "undefined") return;
  if (pathname.includes("/login") || pathname.includes("/session/")) return;
  sessionStorage.setItem(SESSION_RETURN_PATH_KEY, pathname);
}

export function consumeSessionReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  const path = sessionStorage.getItem(SESSION_RETURN_PATH_KEY);
  sessionStorage.removeItem(SESSION_RETURN_PATH_KEY);
  return path;
}

type PendingRemoteLogout = { accessToken: string; email: string; queuedAt: number };

export function queuePendingRemoteLogout(accessToken: string, email: string) {
  if (typeof window === "undefined") return;
  const pending: PendingRemoteLogout = {
    accessToken,
    email: email.toLowerCase(),
    queuedAt: Date.now(),
  };
  localStorage.setItem(PENDING_REMOTE_LOGOUT_KEY, JSON.stringify(pending));
}

export function readPendingRemoteLogout(): PendingRemoteLogout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_REMOTE_LOGOUT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingRemoteLogout;
  } catch {
    return null;
  }
}

export function clearPendingRemoteLogout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_REMOTE_LOGOUT_KEY);
}

export async function mockRemoteLogout(input: {
  accessToken: string;
  email: string;
}): Promise<RemoteLogoutResult> {
  await delay(AUTH_DELAY_MS);
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ok: false, code: "network" };
  }
  if (input.email.toLowerCase() === REMOTE_LOGOUT_FAIL_EMAIL) {
    return { ok: false, code: "server" };
  }
  clearMockServerSession(input.accessToken);
  return { ok: true };
}

export async function flushPendingRemoteLogout(): Promise<void> {
  const pending = readPendingRemoteLogout();
  if (!pending) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const result = await mockRemoteLogout({
    accessToken: pending.accessToken,
    email: pending.email,
  });
  if (result.ok) {
    clearPendingRemoteLogout();
  }
}

export async function mockRevalidateSession(
  session: StoredAuthSession,
): Promise<SessionRevalidateResult> {
  await delay(AUTH_DELAY_MS);
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ok: false, code: "network" };
  }

  const sessions = readServerSessions();
  const record = sessions[session.token];
  if (!record) {
    return { ok: false, code: "invalid" };
  }

  if (record.status === "revoked") {
    return { ok: false, code: "revoked" };
  }
  if (record.status === "suspended") {
    return { ok: false, code: "suspended" };
  }
  if (record.status === "expired") {
    return { ok: false, code: "expired" };
  }

  let permissionChanged = false;
  let role = record.role;

  if (
    record.email === DEMO_SESSION_PERMISSION_EMAIL &&
    !record.permissionDemoValidated
  ) {
    record.permissionDemoValidated = true;
    role = "field_worker";
    record.role = role;
    permissionChanged = role !== session.role;
    sessions[session.token] = record;
    writeServerSessions(sessions);
  }

  const refreshedToken = `mock-${Date.now()}`;
  const refreshed: StoredAuthSession = {
    ...session,
    role,
    token: refreshedToken,
    refreshToken: `refresh-${refreshedToken}`,
    issuedAt: Date.now(),
    mfaVerified: session.mfaVerified ?? true,
  };

  delete sessions[session.token];
  sessions[refreshedToken] = {
    ...record,
    accessToken: refreshedToken,
    refreshToken: refreshed.refreshToken!,
    role,
  };
  writeServerSessions(sessions);

  return { ok: true, session: refreshed, permissionChanged };
}

export function getSessionEndTitle(reason: SessionEndReason): string {
  switch (reason) {
    case "expired":
      return "Your session has expired";
    case "revoked":
      return "Session no longer valid";
    case "suspended":
      return "Account unavailable";
    case "permission_changed":
      return "Your access has changed";
    default:
      return "Sign in required";
  }
}

export function getSessionEndMessage(reason: SessionEndReason): string {
  switch (reason) {
    case "expired":
      return "Sign in again to continue using VertexBuild.";
    case "revoked":
      return "Your session is no longer valid. Please sign in again.";
    case "suspended":
      return "Your account is currently unavailable. Contact your administrator if you need help.";
    case "permission_changed":
      return "Your project permissions were updated. You no longer have access to this area.";
    default:
      return "Please sign in again.";
  }
}

export function getSessionEndPrimaryAction(reason: SessionEndReason): string {
  return reason === "permission_changed" ? "Continue" : "Sign in again";
}

export function sessionEndRoute(reason: SessionEndReason): string {
  switch (reason) {
    case "expired":
      return "/mobile-preview/session/expired";
    case "revoked":
      return "/mobile-preview/session/revoked";
    case "suspended":
      return "/mobile-preview/session/suspended";
    case "permission_changed":
      return "/mobile-preview/session/permission";
    default:
      return "/mobile-preview/login";
  }
}

export function isSessionEndPath(pathname: string): boolean {
  return pathname.startsWith("/mobile-preview/session/");
}
