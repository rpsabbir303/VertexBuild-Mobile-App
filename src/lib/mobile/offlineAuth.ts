import type { StoredAuthSession } from "./auth";
import { getAccessibleProjectsForRole } from "./projectAccess";
import type { MockRole } from "./types";

export const OFFLINE_ELIGIBILITY_KEY = "vertex-cms-offline-eligibility";

/**
 * Prototype server policy boundary.
 * Expiry is only present when the server supplies a timestamp.
 * No client-side duration is invented.
 */
export const DEMO_OFFLINE_EXPIRED_EMAIL = "offline.expired@summitconstruction.com";
export const DEMO_OFFLINE_INELIGIBLE_EMAIL = "offline.none@summitconstruction.com";

export type OfflineEligibility = {
  email: string;
  role: MockRole;
  projectIds: string[];
  lastVerifiedOnlineAt: number;
  offlineAccessExpiresAt: number | null;
  session: StoredAuthSession;
};

export type OfflineEligibilityState = "eligible" | "expired" | "none";

export type ServerOfflinePolicy = {
  eligible: boolean;
  /** Authoritative expiry from server policy, or null when the server does not set one. */
  offlineAccessExpiresAt: number | null;
};

export function readServerOfflinePolicy(email: string): ServerOfflinePolicy {
  const normalized = email.toLowerCase();
  if (normalized === DEMO_OFFLINE_INELIGIBLE_EMAIL) {
    return { eligible: false, offlineAccessExpiresAt: null };
  }
  if (normalized === DEMO_OFFLINE_EXPIRED_EMAIL) {
    return { eligible: true, offlineAccessExpiresAt: 1 };
  }
  return { eligible: true, offlineAccessExpiresAt: null };
}

export function isDeviceOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function establishOfflineEligibility(session: StoredAuthSession): OfflineEligibility | null {
  if (typeof window === "undefined") return null;
  if (!session.mfaVerified) return null;
  const policy = readServerOfflinePolicy(session.email);
  if (!policy.eligible) {
    localStorage.removeItem(OFFLINE_ELIGIBILITY_KEY);
    return null;
  }
  const projectIds = getAccessibleProjectsForRole(session.role).map((p) => p.id);
  const record: OfflineEligibility = {
    email: session.email,
    role: session.role,
    projectIds,
    lastVerifiedOnlineAt: Date.now(),
    offlineAccessExpiresAt: policy.offlineAccessExpiresAt,
    session,
  };
  localStorage.setItem(OFFLINE_ELIGIBILITY_KEY, JSON.stringify(record));
  return record;
}

export function readOfflineEligibility(): OfflineEligibility | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(OFFLINE_ELIGIBILITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfflineEligibility;
    if (!parsed?.email || !parsed?.session?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOfflineEligibility() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OFFLINE_ELIGIBILITY_KEY);
}

export function evaluateOfflineEligibility(
  record: OfflineEligibility | null = readOfflineEligibility(),
): OfflineEligibilityState {
  if (!record) return "none";
  if (
    record.offlineAccessExpiresAt != null &&
    Date.now() >= record.offlineAccessExpiresAt
  ) {
    return "expired";
  }
  return "eligible";
}

export function projectAvailableOffline(projectId: string): boolean {
  const record = readOfflineEligibility();
  if (evaluateOfflineEligibility(record) !== "eligible") return false;
  return Boolean(record?.projectIds.includes(projectId));
}
