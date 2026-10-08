import { PROVISIONED_ACCOUNTS, type AuthAccount } from "./auth";
import { getAccessibleProjectsForRole } from "./projectAccess";

const PENDING_KEY = "vertex-cms-sso-pending";
const ISSUED_CODE_KEY = "vertex-cms-sso-issued-code";

const DELAY_MS = 700;

export type SsoOrganization = {
  id: string;
  name: string;
  ssoConfigured: boolean;
};

export type SsoDiscoveryResult =
  | { ok: true; organizations: SsoOrganization[] }
  | { ok: false; code: "email_required" | "email_invalid" | "not_found" | "network" };

export type SsoCallbackFailure =
  | "cancelled"
  | "not_provisioned"
  | "membership_denied"
  | "suspended"
  | "project_denied"
  | "network"
  | "callback_invalid"
  | "service"
  | "not_configured";

export type SsoExchangeResult =
  | { ok: true; account: AuthAccount }
  | { ok: false; code: SsoCallbackFailure };

type PendingSso = {
  state: string;
  verifier: string;
  email: string;
  organizationId: string;
  createdAt: number;
};

type IssuedCode = {
  code: string;
  state: string;
  email: string;
  organizationId: string;
};

const DIRECTORY: { domain: string; organizations: SsoOrganization[] }[] = [
  {
    domain: "summitconstruction.com",
    organizations: [{ id: "org-summit", name: "Summit Construction Group", ssoConfigured: true }],
  },
  {
    domain: "sharedbuilders.com",
    organizations: [
      { id: "org-vertex", name: "VertexBuild Construction", ssoConfigured: true },
      { id: "org-acme", name: "Acme Construction Group", ssoConfigured: true },
    ],
  },
  {
    domain: "nossoconstruction.com",
    organizations: [{ id: "org-nosso", name: "Northline Builders", ssoConfigured: false }],
  },
];

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export function isPlausibleWorkEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function discoverSsoOrganizations(email: string): Promise<SsoDiscoveryResult> {
  await delay(DELAY_MS);
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, code: "email_required" };
  if (!isPlausibleWorkEmail(trimmed)) return { ok: false, code: "email_invalid" };
  if (trimmed === "failnetwork@summitconstruction.com") return { ok: false, code: "network" };

  const domain = trimmed.split("@")[1] ?? "";
  const match = DIRECTORY.find((entry) => entry.domain === domain);
  if (!match) return { ok: false, code: "not_found" };
  return { ok: true, organizations: match.organizations };
}

export async function beginSsoTransaction(input: {
  email: string;
  organization: SsoOrganization;
}): Promise<{ ok: true; authorizePath: string } | { ok: false; code: "not_configured" | "service" }> {
  if (!input.organization.ssoConfigured) return { ok: false, code: "not_configured" };
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return { ok: false, code: "service" };
  }

  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const verifier = bytesToBase64Url(verifierBytes);
  const challenge = await sha256Base64Url(verifier);
  const stateBytes = new Uint8Array(16);
  crypto.getRandomValues(stateBytes);
  const state = bytesToBase64Url(stateBytes);

  const pending: PendingSso = {
    state,
    verifier,
    email: input.email.trim().toLowerCase(),
    organizationId: input.organization.id,
    createdAt: Date.now(),
  };
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  sessionStorage.removeItem(ISSUED_CODE_KEY);

  const params = new URLSearchParams({
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return { ok: true, authorizePath: `/mobile-preview/sso/authorize?${params.toString()}` };
}

export function readPendingSso(): PendingSso | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSso;
    if (!parsed?.state || !parsed.verifier) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSsoTransaction() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_KEY);
  sessionStorage.removeItem(ISSUED_CODE_KEY);
}

function readIssuedCode(): IssuedCode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ISSUED_CODE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IssuedCode;
  } catch {
    return null;
  }
}

/** IdP authorization result. Returns an opaque code only — never the verifier. */
export function issueSsoAuthorizationCode(): { ok: true; callbackPath: string } | { ok: false; code: "callback_invalid" } {
  const pending = readPendingSso();
  if (!pending) return { ok: false, code: "callback_invalid" };

  const existing = readIssuedCode();
  if (existing && existing.state === pending.state) {
    const params = new URLSearchParams({ code: existing.code, state: existing.state });
    return { ok: true, callbackPath: `/mobile-preview/sso/callback?${params.toString()}` };
  }

  const codeBytes = new Uint8Array(24);
  crypto.getRandomValues(codeBytes);
  const code = bytesToBase64Url(codeBytes);
  const issued: IssuedCode = {
    code,
    state: pending.state,
    email: pending.email,
    organizationId: pending.organizationId,
  };
  sessionStorage.setItem(ISSUED_CODE_KEY, JSON.stringify(issued));
  const params = new URLSearchParams({ code, state: pending.state });
  return { ok: true, callbackPath: `/mobile-preview/sso/callback?${params.toString()}` };
}

let exchangeInFlight: Promise<SsoExchangeResult> | null = null;

export function exchangeSsoCallback(input: {
  code: string | null;
  state: string | null;
}): Promise<SsoExchangeResult> {
  if (exchangeInFlight) return exchangeInFlight;
  exchangeInFlight = performSsoExchange(input).finally(() => {
    exchangeInFlight = null;
  });
  return exchangeInFlight;
}

async function performSsoExchange(input: {
  code: string | null;
  state: string | null;
}): Promise<SsoExchangeResult> {
  const pending = readPendingSso();
  const issued = readIssuedCode();
  clearSsoTransaction();

  if (!input.code || !input.state || !pending || !issued) {
    return { ok: false, code: "callback_invalid" };
  }
  if (input.state !== pending.state || issued.state !== pending.state || issued.code !== input.code) {
    return { ok: false, code: "callback_invalid" };
  }

  const expectedChallenge = await sha256Base64Url(pending.verifier);
  if (!expectedChallenge) {
    return { ok: false, code: "service" };
  }

  await delay(DELAY_MS);

  const email = pending.email;
  if (email === "failnetwork@summitconstruction.com") {
    return { ok: false, code: "network" };
  }
  if (email.startsWith("sso.service@")) {
    return { ok: false, code: "service" };
  }

  const account = PROVISIONED_ACCOUNTS.find((a) => a.email.toLowerCase() === email);
  if (!account) return { ok: false, code: "not_provisioned" };
  if (email.startsWith("sso.nomember@")) return { ok: false, code: "membership_denied" };
  if (account.status !== "active") return { ok: false, code: "suspended" };
  if (email.startsWith("sso.noproject@") || getAccessibleProjectsForRole(account.role).length === 0) {
    return { ok: false, code: "project_denied" };
  }

  return { ok: true, account };
}

export function ssoFailureCopy(code: SsoCallbackFailure): { title: string; message: string } {
  switch (code) {
    case "cancelled":
      return {
        title: "Enterprise sign-in cancelled",
        message: "Enterprise sign-in was cancelled. You can try again or use your password.",
      };
    case "not_configured":
      return {
        title: "Enterprise SSO isn't available",
        message: "Your organization hasn't configured Enterprise SSO for VertexBuild.",
      };
    case "not_provisioned":
      return {
        title: "Account not provisioned",
        message:
          "Your enterprise account is not provisioned for VertexBuild. Please contact your organization administrator.",
      };
    case "membership_denied":
      return {
        title: "Access denied",
        message:
          "Your organization account was verified, but you don't have access to this VertexBuild organization.",
      };
    case "suspended":
      return {
        title: "Account unavailable",
        message: "Your account is currently unavailable. Contact your administrator if you need help.",
      };
    case "project_denied":
      return {
        title: "No project access",
        message:
          "Your enterprise account was verified, but you don't have access to a VertexBuild project yet.",
      };
    case "network":
      return {
        title: "Unable to complete enterprise sign-in",
        message: "Check your connection and try again.",
      };
    case "callback_invalid":
      return {
        title: "Sign-in could not be completed",
        message: "The enterprise sign-in response was missing or no longer valid. Start again.",
      };
    case "service":
    default:
      return {
        title: "Unable to complete enterprise sign-in",
        message: "The sign-in service could not finish. Try again in a moment.",
      };
  }
}
