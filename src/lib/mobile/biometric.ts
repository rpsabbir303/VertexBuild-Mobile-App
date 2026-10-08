import type { StoredAuthSession } from "./auth";

export const BIOMETRIC_PREF_KEY = "vertex-cms-biometric-pref";
export const BIOMETRIC_VAULT_KEY = "vertex-cms-biometric-vault";
export const BIOMETRIC_ENABLE_DISMISSED_KEY = "vertex-cms-biometric-enable-dismissed";

/** Mock session validity for vault restore (prototype). */
export const BIOMETRIC_VAULT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export type BiometricPreference = {
  enabled: boolean;
  email: string;
  credentialId: string;
};

export type BiometricUnlockError =
  | "unavailable"
  | "cancelled"
  | "failed"
  | "expired"
  | "no_vault"
  | "invalidated";

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBuffer(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function randomChallenge(): BufferSource {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge;
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  if (!window.PublicKeyCredential) return false;
  try {
    const available =
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
        ? await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        : false;
    return Boolean(available);
  } catch {
    return false;
  }
}

export function readBiometricPreference(): BiometricPreference | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BIOMETRIC_PREF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BiometricPreference;
    if (!parsed?.enabled || !parsed.credentialId || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBiometricPreference(pref: BiometricPreference | null) {
  if (typeof window === "undefined") return;
  if (!pref) {
    localStorage.removeItem(BIOMETRIC_PREF_KEY);
    return;
  }
  localStorage.setItem(BIOMETRIC_PREF_KEY, JSON.stringify(pref));
}

export function readBiometricVault(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BIOMETRIC_VAULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed?.email || !parsed?.token || !parsed?.issuedAt) return null;
    if (Date.now() - parsed.issuedAt > BIOMETRIC_VAULT_MAX_AGE_MS) {
      localStorage.removeItem(BIOMETRIC_VAULT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeBiometricVault(session: StoredAuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    localStorage.removeItem(BIOMETRIC_VAULT_KEY);
    return;
  }
  localStorage.setItem(BIOMETRIC_VAULT_KEY, JSON.stringify(session));
}

export function clearBiometricSecureStorage() {
  writeBiometricVault(null);
  writeBiometricPreference(null);
  if (typeof window !== "undefined") {
    localStorage.removeItem(BIOMETRIC_ENABLE_DISMISSED_KEY);
  }
}

export function isBiometricEnableDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(BIOMETRIC_ENABLE_DISMISSED_KEY) === "1";
}

export function setBiometricEnableDismissed(dismissed: boolean) {
  if (typeof window === "undefined") return;
  if (dismissed) {
    localStorage.setItem(BIOMETRIC_ENABLE_DISMISSED_KEY, "1");
  } else {
    localStorage.removeItem(BIOMETRIC_ENABLE_DISMISSED_KEY);
  }
}

export async function registerBiometricCredential(
  email: string,
  displayName: string,
): Promise<{ ok: true; credentialId: string } | { ok: false; code: "unavailable" | "cancelled" | "failed" }> {
  const available = await isBiometricAvailable();
  if (!available) return { ok: false, code: "unavailable" };

  const userId = new TextEncoder().encode(email.toLowerCase());

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: "Vertex CMS Mobile" },
        user: {
          id: userId,
          name: email,
          displayName,
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;

    if (!credential?.rawId) return { ok: false, code: "failed" };
    return { ok: true, credentialId: bufferToBase64Url(credential.rawId) };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "AbortError") {
      return { ok: false, code: "cancelled" };
    }
    return { ok: false, code: "failed" };
  }
}

export async function verifyBiometricCredential(
  credentialId: string,
): Promise<
  { ok: true } | { ok: false; code: "unavailable" | "cancelled" | "failed" | "invalidated" }
> {
  const available = await isBiometricAvailable();
  if (!available) return { ok: false, code: "unavailable" };

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: [
          {
            id: base64UrlToBuffer(credentialId),
            type: "public-key",
          },
        ],
        userVerification: "required",
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;

    if (!assertion) return { ok: false, code: "failed" };
    return { ok: true };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "AbortError") {
      return { ok: false, code: "cancelled" };
    }
    if (name === "NotFoundError" || name === "InvalidStateError" || name === "SecurityError") {
      return { ok: false, code: "invalidated" };
    }
    return { ok: false, code: "failed" };
  }
}

export function invalidateBiometricEnrollment() {
  writeBiometricPreference(null);
  writeBiometricVault(null);
  setBiometricEnableDismissed(false);
}

export function getBiometricUnlockErrorMessage(code: BiometricUnlockError): string {
  switch (code) {
    case "cancelled":
      return "Biometric unlock was cancelled.";
    case "unavailable":
      return "Biometric unlock is unavailable on this device.";
    case "expired":
      return "Your protected session expired. Sign in with your password.";
    case "invalidated":
      return "Biometric unlock is no longer available on this device. Sign in with your password.";
    case "no_vault":
      return "No protected session is available. Sign in with your password.";
    case "failed":
      return "Biometric unlock failed. Try again or use your password.";
    default:
      return "Biometric unlock failed. Try again or use your password.";
  }
}

export function shouldProtectSessionWithBiometric(): boolean {
  return Boolean(readBiometricPreference()?.enabled);
}

export function shouldOfferBiometricUnlock(): boolean {
  const pref = readBiometricPreference();
  const vault = readBiometricVault();
  return Boolean(pref?.enabled && vault);
}
