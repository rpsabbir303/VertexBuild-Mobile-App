"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTH_SESSION_STORAGE_KEY,
  PROVISIONED_ACCOUNTS,
  type AuthAccount,
  type LoginErrorCode,
  type PasswordRecoveryState,
  type ResetPasswordErrorCode,
  type LoginSuccessResult,
  type MfaNextStep,
  type StoredAuthSession,
  getOtpExpiryRemainingSec,
  getResendCooldownRemainingSec,
  isResetSessionActive,
  mockCompletePasswordReset,
  mockLogin,
  mockResendVerificationCode,
  mockSendVerificationCode,
  mockVerifyOtp,
  readPasswordRecovery,
  writePasswordRecovery,
} from "./auth";
import {
  invalidateBiometricEnrollment,
  isBiometricAvailable,
  isBiometricEnableDismissed,
  type BiometricUnlockError,
  readBiometricPreference,
  readBiometricVault,
  registerBiometricCredential,
  setBiometricEnableDismissed,
  shouldOfferBiometricUnlock,
  verifyBiometricCredential,
  writeBiometricPreference,
  writeBiometricVault,
} from "./biometric";
import {
  clearInvitationActivation,
  getInvitationOtpExpiryRemainingSec,
  getInvitationResendCooldownSec,
  mockFinalizeInvitationActivation,
  mockResendInvitationOtp,
  mockSetInvitationCredentials,
  mockValidateInvitationToken,
  mockVerifyInvitationOtp,
  readInvitationActivation,
  tryActivatedAccountLogin,
  type InvitationActivationSession,
  type InvitationErrorCode,
} from "./invitation";
import {
  clearMfaServerState,
  mockBeginMfaFlow,
  mockEvaluateMfaPolicy,
  mockVerifyMfaTotp,
  readMfaServerState,
  type MfaServerState,
  type MfaVerifyErrorCode,
  type MfaVerifyPurpose,
} from "./mfa";
import { exchangeSsoCallback, type SsoCallbackFailure } from "./enterpriseSso";
import { getAccessibleProjectsForRole } from "./projectAccess";
import {
  clearOfflineEligibility,
  establishOfflineEligibility,
  evaluateOfflineEligibility,
  isDeviceOnline,
  readOfflineEligibility,
  type OfflineEligibilityState,
} from "./offlineAuth";
import {
  captureSessionReturnPath,
  clearMockServerSession,
  clearPendingRemoteLogout,
  flushPendingRemoteLogout,
  mockRevalidateSession,
  mockRemoteLogout,
  queuePendingRemoteLogout,
  readSessionEndReason,
  registerMockServerSession,
  writeSessionEndReason,
  type SessionEndReason,
} from "./sessionSecurity";

type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "biometric_locked"
  | "mfa_pending"
  | "offline_resume";

export type AccessMode = "online" | "offline_local" | "revalidating";

export type LogoutResult = {
  ok: true;
  offline: boolean;
  remotePending: boolean;
};

type MobileAuthContextValue = {
  authStatus: AuthStatus;
  session: StoredAuthSession | null;
  passwordRecovery: PasswordRecoveryState | null;
  resendCooldownSec: number;
  otpExpiryRemainingSec: number;
  refreshPasswordRecovery: () => void;
  biometricLoginEnabled: boolean;
  showBiometricEnablePrompt: boolean;
  biometricEnableLoading: boolean;
  biometricUnlockLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<LoginSuccessResult | { ok: false; code: LoginErrorCode }>;
  completeEnterpriseIdentity: (
    account: AuthAccount,
  ) => Promise<LoginSuccessResult | { ok: false; code: "network" }>;
  exchangeEnterpriseCallback: (input: {
    code: string | null;
    state: string | null;
  }) => Promise<LoginSuccessResult | { ok: false; code: SsoCallbackFailure | "network" }>;
  mfaServerState: MfaServerState | null;
  refreshMfaState: () => void;
  verifyMfaTotp: (
    code: string,
    purpose: MfaVerifyPurpose,
  ) => Promise<{ ok: true } | { ok: false; code: MfaVerifyErrorCode }>;
  completeMfaAndAuthenticate: () => void;
  logout: () => Promise<LogoutResult>;
  logoutLoading: boolean;
  sessionEndReason: SessionEndReason | null;
  permissionAccessBlocked: boolean;
  clearSessionEndReason: () => void;
  dismissPermissionChangedGate: () => void;
  revalidateAuthenticatedSession: (pathname: string, currentProjectId?: string) => Promise<void>;
  accessMode: AccessMode;
  offlineEligibilityState: OfflineEligibilityState;
  /** Live session exists, but this device has no eligible offline workspace. */
  offlineWorkspaceBlocked: boolean;
  beginOfflineResume: () => Promise<{ ok: true } | { ok: false; code: string }>;
  retryOfflineConnection: () => void;
  enableBiometricLogin: () => Promise<
    { ok: true } | { ok: false; code: "unavailable" | "cancelled" | "failed" | "no_session" }
  >;
  disableBiometricLogin: () => void;
  dismissBiometricEnablePrompt: () => void;
  lockSessionForBiometric: () => void;
  preparePasswordFallbackFromLock: () => void;
  unlockWithBiometric: () => Promise<{ ok: true } | { ok: false; code: BiometricUnlockError }>;
  sendVerificationCode: (
    email: string,
  ) => Promise<
    | { ok: true }
    | { ok: false; code: "email_required" | "email_invalid" | "server" | "network" }
  >;
  verifyOtp: (
    code: string,
  ) => Promise<
    | { ok: true }
    | { ok: false; code: "incomplete" | "incorrect" | "expired" | "network" }
  >;
  resendVerificationCode: () => Promise<
    | { ok: true }
    | { ok: false; code: "server" | "cooldown" }
  >;
  completePasswordReset: (
    password: string,
    confirm: string,
  ) => Promise<{ ok: true } | { ok: false; code: ResetPasswordErrorCode }>;
  clearPasswordRecovery: () => void;
  hasActiveResetSession: boolean;
  invitationActivation: InvitationActivationSession | null;
  invitationOtpExpirySec: number;
  invitationResendCooldownSec: number;
  refreshInvitationActivation: () => void;
  validateInvitationToken: (
    token: string,
  ) => Promise<
    | { ok: true; session: InvitationActivationSession }
    | { ok: false; code: InvitationErrorCode }
  >;
  clearInvitationActivation: () => void;
  setInvitationCredentials: (
    password: string,
    confirm: string,
  ) => ReturnType<typeof mockSetInvitationCredentials>;
  verifyInvitationOtp: (code: string) => ReturnType<typeof mockVerifyInvitationOtp>;
  resendInvitationOtp: () => ReturnType<typeof mockResendInvitationOtp>;
  finalizeInvitationActivation: () => ReturnType<typeof mockFinalizeInvitationActivation>;
};

const MobileAuthContext = createContext<MobileAuthContextValue | null>(null);

function readStoredSession(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed?.email || !parsed?.token) return null;
    return { ...parsed, mfaVerified: parsed.mfaVerified ?? true };
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredAuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function MobileAuthProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<StoredAuthSession | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState<PasswordRecoveryState | null>(null);
  const [resendCooldownSec, setResendCooldownSec] = useState(0);
  const [otpExpiryRemainingSec, setOtpExpiryRemainingSec] = useState(0);
  const [biometricLoginEnabled, setBiometricLoginEnabled] = useState(false);
  const [showBiometricEnablePrompt, setShowBiometricEnablePrompt] = useState(false);
  const [biometricEnableLoading, setBiometricEnableLoading] = useState(false);
  const [biometricUnlockLoading, setBiometricUnlockLoading] = useState(false);
  const [invitationActivation, setInvitationActivation] = useState<InvitationActivationSession | null>(
    null,
  );
  const [invitationOtpExpirySec, setInvitationOtpExpirySec] = useState(0);
  const [invitationResendCooldownSec, setInvitationResendCooldownSec] = useState(0);
  const [mfaServerState, setMfaServerState] = useState<MfaServerState | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [sessionEndReason, setSessionEndReason] = useState<SessionEndReason | null>(null);
  const [permissionAccessBlocked, setPermissionAccessBlocked] = useState(false);
  const [accessMode, setAccessMode] = useState<AccessMode>("online");
  const [offlineEligibilityState, setOfflineEligibilityState] =
    useState<OfflineEligibilityState>("none");
  const [offlineWorkspaceBlocked, setOfflineWorkspaceBlocked] = useState(false);

  const refreshPasswordRecovery = useCallback(() => {
    setPasswordRecovery(readPasswordRecovery());
  }, []);

  const refreshInvitationActivation = useCallback(() => {
    setInvitationActivation(readInvitationActivation());
  }, []);

  const refreshMfaState = useCallback(() => {
    setMfaServerState(readMfaServerState());
  }, []);

  const syncBiometricPref = useCallback(() => {
    setBiometricLoginEnabled(Boolean(readBiometricPreference()?.enabled));
  }, []);

  const maybePromptBiometricEnable = useCallback(async (activeSession: StoredAuthSession) => {
    if (activeSession.mfaVerified === false) {
      setShowBiometricEnablePrompt(false);
      return;
    }
    const pref = readBiometricPreference();
    if (pref?.enabled) {
      writeBiometricVault(activeSession);
      setShowBiometricEnablePrompt(false);
      return;
    }
    if (isBiometricEnableDismissed()) {
      setShowBiometricEnablePrompt(false);
      return;
    }
    const available = await isBiometricAvailable();
    setShowBiometricEnablePrompt(available);
  }, []);

  const clearLocalAuthState = useCallback(() => {
    writeStoredSession(null);
    writeBiometricVault(null);
    clearMfaServerState();
    setMfaServerState(null);
    setSession(null);
    setShowBiometricEnablePrompt(false);
    setPermissionAccessBlocked(false);
    clearOfflineEligibility();
    setOfflineEligibilityState("none");
    setOfflineWorkspaceBlocked(false);
    setAccessMode("online");
  }, []);

  const clearSessionEndReason = useCallback(() => {
    writeSessionEndReason(null);
    setSessionEndReason(null);
  }, []);

  const dismissPermissionChangedGate = useCallback(() => {
    setPermissionAccessBlocked(false);
    writeSessionEndReason(null);
    setSessionEndReason(null);
  }, []);

  const terminateSessionForReason = useCallback(
    (reason: SessionEndReason, pathname?: string) => {
      const active = session ?? readStoredSession();
      if (pathname) captureSessionReturnPath(pathname);
      clearMockServerSession(active?.token);
      clearLocalAuthState();
      writeSessionEndReason(reason);
      setSessionEndReason(reason);
      setAuthStatus("unauthenticated");
    },
    [clearLocalAuthState, session],
  );

  const finalizeAuthenticatedSession = useCallback((base: StoredAuthSession): StoredAuthSession => {
    const registered = registerMockServerSession({
      accessToken: base.token,
      email: base.email,
      role: base.role,
    });
    const next = { ...registered, mfaVerified: true };
    if (isDeviceOnline()) {
      establishOfflineEligibility(next);
      setOfflineEligibilityState(evaluateOfflineEligibility());
      setAccessMode("online");
    }
    return next;
  }, []);

  useEffect(() => {
    const stored = readStoredSession();
    syncBiometricPref();
    setPasswordRecovery(readPasswordRecovery());
    setInvitationActivation(readInvitationActivation());
    setMfaServerState(readMfaServerState());
    setSessionEndReason(readSessionEndReason());
    const eligibilityState = evaluateOfflineEligibility();
    setOfflineEligibilityState(eligibilityState);
    const online = isDeviceOnline();

    if (stored) {
      setSession(stored);
      if (stored.mfaVerified === false) {
        setAuthStatus("mfa_pending");
      } else if (!online && eligibilityState !== "eligible") {
        setAuthStatus("authenticated");
        setAccessMode("offline_local");
        setOfflineWorkspaceBlocked(true);
      } else {
        setAuthStatus("authenticated");
        setAccessMode(online ? "online" : "offline_local");
        setOfflineWorkspaceBlocked(false);
        if (online) establishOfflineEligibility(stored);
      }
      return;
    }

    if (!online && eligibilityState === "eligible") {
      setSession(null);
      setAccessMode("offline_local");
      setAuthStatus("offline_resume");
      return;
    }

    if (!online) {
      setSession(null);
      setAuthStatus("unauthenticated");
      return;
    }

    if (shouldOfferBiometricUnlock()) {
      setSession(null);
      setAuthStatus("biometric_locked");
      return;
    }

    setSession(null);
    setAuthStatus("unauthenticated");
  }, [syncBiometricPref]);

  useEffect(() => {
    const tick = () => {
      const recovery = readPasswordRecovery();
      setResendCooldownSec(getResendCooldownRemainingSec(recovery));
      setOtpExpiryRemainingSec(getOtpExpiryRemainingSec(recovery));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [passwordRecovery]);

  useEffect(() => {
    const tick = () => {
      const inv = readInvitationActivation();
      setInvitationOtpExpirySec(getInvitationOtpExpiryRemainingSec(inv));
      setInvitationResendCooldownSec(getInvitationResendCooldownSec(inv));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [invitationActivation]);

  useEffect(() => {
    function onOffline() {
      const eligible = evaluateOfflineEligibility() === "eligible";
      setOfflineEligibilityState(evaluateOfflineEligibility());
      setOfflineWorkspaceBlocked(!eligible);
      setAccessMode((mode) => (mode === "online" ? "offline_local" : mode));
    }
    function onOnline() {
      setOfflineWorkspaceBlocked(false);
      const active = readStoredSession();
      if (active?.mfaVerified) {
        setAccessMode("revalidating");
      }
    }
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const completeEnterpriseIdentity = useCallback(
    async (account: AuthAccount): Promise<LoginSuccessResult | { ok: false; code: "network" }> => {
      const issuedAt = Date.now();
      const baseSession: StoredAuthSession = {
        email: account.email,
        role: account.role,
        token: `mock-${Date.now()}`,
        issuedAt,
        mfaVerified: false,
      };

      writePasswordRecovery(null);
      setPasswordRecovery(null);

      const policy = await mockEvaluateMfaPolicy(account.email);
      if (policy.requirement === "none") {
        clearSessionEndReason();
        const session = finalizeAuthenticatedSession(baseSession);
        writeStoredSession(session);
        setSession(session);
        setAuthStatus("authenticated");
        syncBiometricPref();
        void maybePromptBiometricEnable(session);
        void flushPendingRemoteLogout();
        return { ok: true as const, account, mfaNext: "none" as const };
      }

      const phase = policy.enrolled ? "challenge" : "enroll";
      const begun = await mockBeginMfaFlow({
        email: account.email,
        phase,
        primaryIssuedAt: issuedAt,
      });
      if (!begun.ok) return { ok: false as const, code: "network" as const };

      writeStoredSession(baseSession);
      setSession(baseSession);
      setMfaServerState(begun.state);
      setAuthStatus("mfa_pending");
      const mfaNext: MfaNextStep = phase === "enroll" ? "enroll" : "challenge";
      return { ok: true as const, account, mfaNext };
    },
    [clearSessionEndReason, finalizeAuthenticatedSession, maybePromptBiometricEnable, syncBiometricPref],
  );

  const exchangeEnterpriseCallback = useCallback(
    async (input: { code: string | null; state: string | null }) => {
      const exchanged = await exchangeSsoCallback(input);
      if (!exchanged.ok) return exchanged;
      return completeEnterpriseIdentity(exchanged.account);
    },
    [completeEnterpriseIdentity],
  );

  const login = useCallback(async (email: string, password: string) => {
    let result = await mockLogin(email, password);
    if (!result.ok) {
      const activated = tryActivatedAccountLogin(email, password);
      if (activated) {
        result = { ok: true, account: activated };
      } else {
        return result;
      }
    }
    if (!result.ok) return result;
    return completeEnterpriseIdentity(result.account);
  }, [completeEnterpriseIdentity]);

  const completeMfaAndAuthenticate = useCallback(() => {
    const active = readStoredSession();
    if (!active) return;
    clearSessionEndReason();
    const session = finalizeAuthenticatedSession(active);
    writeStoredSession(session);
    setSession(session);
    setAuthStatus("authenticated");
    syncBiometricPref();
    void maybePromptBiometricEnable(session);
    void flushPendingRemoteLogout();
  }, [clearSessionEndReason, finalizeAuthenticatedSession, maybePromptBiometricEnable, syncBiometricPref]);

  const verifyMfaTotp = useCallback(async (code: string, purpose: MfaVerifyPurpose) => {
    const result = await mockVerifyMfaTotp({ code, purpose });
    if (result.ok) {
      setMfaServerState(null);
    } else if (result.code !== "primary_expired") {
      setMfaServerState(readMfaServerState());
    }
    return result;
  }, []);

  const retryOfflineConnection = useCallback(() => {
    if (!isDeviceOnline()) return;
    setAccessMode("revalidating");
  }, []);

  const revalidateAuthenticatedSession = useCallback(
    async (pathname: string, currentProjectId?: string) => {
      const active = readStoredSession();
      if (!active || active.mfaVerified === false) return;

      if (!isDeviceOnline()) {
      setAccessMode("offline_local");
      return;
    }

    setAccessMode("revalidating");
    const result = await mockRevalidateSession(active);
      if (!result.ok) {
        if (result.code === "network") {
          setAccessMode("offline_local");
          return;
        }
        if (result.code === "invalid") {
          terminateSessionForReason("revoked", pathname);
          return;
        }
        terminateSessionForReason(result.code, pathname);
        return;
      }

      writeStoredSession(result.session);
      setSession(result.session);
      setAccessMode("online");
      setOfflineWorkspaceBlocked(false);
      establishOfflineEligibility(result.session);
      setOfflineEligibilityState(evaluateOfflineEligibility());
      const pref = readBiometricPreference();
      if (pref?.enabled) {
        writeBiometricVault(result.session);
      }

      if (result.permissionChanged && currentProjectId) {
        const allowed = getAccessibleProjectsForRole(result.session.role);
        const stillAuthorized = allowed.some((p) => p.id === currentProjectId);
        if (!stillAuthorized) {
          setPermissionAccessBlocked(true);
          writeSessionEndReason("permission_changed");
          setSessionEndReason("permission_changed");
        }
      }
    },
    [terminateSessionForReason],
  );

  const logout = useCallback(async (): Promise<LogoutResult> => {
    const active = session ?? readStoredSession();
    const accessToken = active?.token;
    const email = active?.email;

    setLogoutLoading(true);
    clearLocalAuthState();
    clearSessionEndReason();
    setAuthStatus("unauthenticated");

    let remotePending = false;
    const offline = typeof navigator !== "undefined" && !navigator.onLine;

    clearMockServerSession(accessToken);

    if (accessToken && email) {
      if (offline) {
        queuePendingRemoteLogout(accessToken, email);
        remotePending = true;
      } else {
        const remote = await mockRemoteLogout({ accessToken, email });
        if (!remote.ok) {
          queuePendingRemoteLogout(accessToken, email);
          remotePending = true;
        } else {
          clearPendingRemoteLogout();
        }
      }
    }

    setLogoutLoading(false);
    return { ok: true, offline, remotePending };
  }, [clearLocalAuthState, clearSessionEndReason, session]);

  const enableBiometricLogin = useCallback(async () => {
    const activeSession = session ?? readStoredSession();
    if (!activeSession) return { ok: false as const, code: "no_session" as const };
    if (activeSession.mfaVerified === false) {
      return { ok: false as const, code: "no_session" as const };
    }

    const account = PROVISIONED_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === activeSession.email.toLowerCase(),
    );
    const displayName = account
      ? `${account.firstName} ${account.lastName}`
      : activeSession.email;

    setBiometricEnableLoading(true);
    const registered = await registerBiometricCredential(activeSession.email, displayName);
    setBiometricEnableLoading(false);

    if (!registered.ok) return registered;

    writeBiometricPreference({
      enabled: true,
      email: activeSession.email.toLowerCase(),
      credentialId: registered.credentialId,
    });
    writeBiometricVault(activeSession);
    setBiometricLoginEnabled(true);
    setShowBiometricEnablePrompt(false);
    setBiometricEnableDismissed(false);
    return { ok: true as const };
  }, [session]);

  const disableBiometricLogin = useCallback(() => {
    writeBiometricPreference(null);
    writeBiometricVault(null);
    setBiometricLoginEnabled(false);
  }, []);

  const dismissBiometricEnablePrompt = useCallback(() => {
    setBiometricEnableDismissed(true);
    setShowBiometricEnablePrompt(false);
  }, []);

  const lockSessionForBiometric = useCallback(() => {
    if (authStatus !== "authenticated") return;
    const pref = readBiometricPreference();
    if (!pref?.enabled) return;

    const activeSession = session ?? readStoredSession();
    if (!activeSession || activeSession.mfaVerified === false) return;

    writeBiometricVault(activeSession);
    writeStoredSession(null);
    setSession(null);
    setShowBiometricEnablePrompt(false);
    setAuthStatus("biometric_locked");
  }, [authStatus, session]);

  const preparePasswordFallbackFromLock = useCallback(() => {
    writeStoredSession(null);
    setSession(null);
    setAuthStatus("unauthenticated");
  }, []);

  const unlockWithBiometric = useCallback(async () => {
    const pref = readBiometricPreference();
    const vault = readBiometricVault();
    if (!pref?.enabled) {
      setAuthStatus("unauthenticated");
      return { ok: false as const, code: "no_vault" as const };
    }
    if (!vault) {
      setAuthStatus("unauthenticated");
      return { ok: false as const, code: "expired" as const };
    }

    if (!isDeviceOnline() && evaluateOfflineEligibility() !== "eligible") {
      setAuthStatus("unauthenticated");
      return { ok: false as const, code: "expired" as const };
    }

    setBiometricUnlockLoading(true);
    const verified = await verifyBiometricCredential(pref.credentialId);
    setBiometricUnlockLoading(false);

    if (!verified.ok) {
      if (verified.code === "invalidated") {
        invalidateBiometricEnrollment();
        syncBiometricPref();
        setSession(null);
        setAuthStatus("unauthenticated");
      }
      return verified;
    }

    if (vault.email.toLowerCase() !== pref.email.toLowerCase()) {
      writeBiometricVault(null);
      setAuthStatus("unauthenticated");
      return { ok: false as const, code: "expired" as const };
    }

    const normalized = { ...vault, mfaVerified: vault.mfaVerified ?? true };
    if (normalized.mfaVerified === false) {
      setSession(normalized);
      setAuthStatus("mfa_pending");
      setMfaServerState(readMfaServerState());
      return { ok: true as const };
    }
    writeStoredSession(normalized);
    setSession(normalized);
    setAuthStatus("authenticated");

    const revalidated = await mockRevalidateSession(normalized);
    if (!revalidated.ok && revalidated.code !== "network") {
      const reason =
        revalidated.code === "invalid" ? ("revoked" as const) : revalidated.code;
      terminateSessionForReason(reason);
      return { ok: false as const, code: "expired" as const };
    }
    if (revalidated.ok) {
      writeStoredSession(revalidated.session);
      setSession(revalidated.session);
      if (readBiometricPreference()?.enabled) {
        writeBiometricVault(revalidated.session);
      }
    }

    if (revalidated.ok) {
      setAccessMode(isDeviceOnline() ? "online" : "offline_local");
    } else {
      setAccessMode("offline_local");
    }

    return { ok: true as const };
  }, [syncBiometricPref, terminateSessionForReason]);

  const beginOfflineResume = useCallback(async () => {
    const state = evaluateOfflineEligibility();
    setOfflineEligibilityState(state);
    if (state === "expired") return { ok: false as const, code: "expired" };
    if (state !== "eligible") return { ok: false as const, code: "none" };

    const pref = readBiometricPreference();
    if (pref?.enabled) {
      const unlocked = await unlockWithBiometric();
      if (!unlocked.ok) return unlocked;
      setAccessMode("offline_local");
      return { ok: true as const };
    }

    const record = readOfflineEligibility();
    if (!record) return { ok: false as const, code: "none" };
    writeStoredSession(record.session);
    setSession(record.session);
    setAuthStatus("authenticated");
    setAccessMode("offline_local");
    return { ok: true as const };
  }, [unlockWithBiometric]);

  const sendVerificationCode = useCallback(async (email: string) => {
    const result = await mockSendVerificationCode(email);
    if (!result.ok) return result;
    setPasswordRecovery(result.recovery);
    return { ok: true as const };
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    const result = await mockVerifyOtp(code);
    if (!result.ok) return result;
    setPasswordRecovery(result.recovery);
    return { ok: true as const };
  }, []);

  const resendVerificationCode = useCallback(async () => {
    const result = await mockResendVerificationCode();
    if (!result.ok) return result;
    setPasswordRecovery(result.recovery);
    return { ok: true as const };
  }, []);

  const completePasswordReset = useCallback(async (password: string, confirm: string) => {
    const result = await mockCompletePasswordReset(password, confirm);
    if (result.ok) {
      writeStoredSession(null);
      writeBiometricVault(null);
      setSession(null);
      setAuthStatus("unauthenticated");
      setPasswordRecovery(null);
    }
    return result;
  }, []);

  const clearPasswordRecovery = useCallback(() => {
    writePasswordRecovery(null);
    setPasswordRecovery(null);
  }, []);

  const validateInvitationToken = useCallback(async (token: string) => {
    const result = await mockValidateInvitationToken(token);
    if (result.ok) setInvitationActivation(result.session);
    return result;
  }, []);

  const clearInvitationActivationFn = useCallback(() => {
    clearInvitationActivation();
    setInvitationActivation(null);
  }, []);

  const setInvitationCredentials = useCallback(async (password: string, confirm: string) => {
    const result = await mockSetInvitationCredentials({ password, confirm });
    if (result.ok) setInvitationActivation(result.session);
    return result;
  }, []);

  const verifyInvitationOtp = useCallback(async (code: string) => {
    const result = await mockVerifyInvitationOtp(code);
    if (result.ok) setInvitationActivation(result.session);
    return result;
  }, []);

  const resendInvitationOtp = useCallback(async () => {
    const result = await mockResendInvitationOtp();
    if (result.ok) setInvitationActivation(result.session);
    return result;
  }, []);

  const finalizeInvitationActivation = useCallback(async () => {
    const active = readStoredSession();
    return mockFinalizeInvitationActivation({
      authenticatedEmail: active?.email,
    });
  }, []);

  const hasActiveResetSession = useMemo(
    () => isResetSessionActive(passwordRecovery),
    [passwordRecovery],
  );

  const value = useMemo(
    () => ({
      authStatus,
      session,
      passwordRecovery,
      resendCooldownSec,
      otpExpiryRemainingSec,
      refreshPasswordRecovery,
      biometricLoginEnabled,
      showBiometricEnablePrompt,
      biometricEnableLoading,
      biometricUnlockLoading,
      login,
      completeEnterpriseIdentity,
      exchangeEnterpriseCallback,
      logout,
      enableBiometricLogin,
      disableBiometricLogin,
      dismissBiometricEnablePrompt,
      lockSessionForBiometric,
      preparePasswordFallbackFromLock,
      unlockWithBiometric,
      sendVerificationCode,
      verifyOtp,
      resendVerificationCode,
      completePasswordReset,
      clearPasswordRecovery,
      hasActiveResetSession,
      invitationActivation,
      invitationOtpExpirySec,
      invitationResendCooldownSec,
      refreshInvitationActivation,
      validateInvitationToken,
      clearInvitationActivation: clearInvitationActivationFn,
      setInvitationCredentials,
      verifyInvitationOtp,
      resendInvitationOtp,
      finalizeInvitationActivation,
      mfaServerState,
      refreshMfaState,
      verifyMfaTotp,
      completeMfaAndAuthenticate,
      logoutLoading,
      sessionEndReason,
      permissionAccessBlocked,
      clearSessionEndReason,
      dismissPermissionChangedGate,
      revalidateAuthenticatedSession,
      accessMode,
      offlineEligibilityState,
      offlineWorkspaceBlocked,
      beginOfflineResume,
      retryOfflineConnection,
    }),
    [
      authStatus,
      session,
      passwordRecovery,
      resendCooldownSec,
      otpExpiryRemainingSec,
      refreshPasswordRecovery,
      biometricLoginEnabled,
      showBiometricEnablePrompt,
      biometricEnableLoading,
      biometricUnlockLoading,
      login,
      completeEnterpriseIdentity,
      exchangeEnterpriseCallback,
      logout,
      enableBiometricLogin,
      disableBiometricLogin,
      dismissBiometricEnablePrompt,
      lockSessionForBiometric,
      preparePasswordFallbackFromLock,
      unlockWithBiometric,
      sendVerificationCode,
      verifyOtp,
      resendVerificationCode,
      completePasswordReset,
      clearPasswordRecovery,
      hasActiveResetSession,
      invitationActivation,
      invitationOtpExpirySec,
      invitationResendCooldownSec,
      refreshInvitationActivation,
      validateInvitationToken,
      clearInvitationActivationFn,
      setInvitationCredentials,
      verifyInvitationOtp,
      resendInvitationOtp,
      finalizeInvitationActivation,
      mfaServerState,
      refreshMfaState,
      verifyMfaTotp,
      completeMfaAndAuthenticate,
      logoutLoading,
      sessionEndReason,
      permissionAccessBlocked,
      clearSessionEndReason,
      dismissPermissionChangedGate,
      revalidateAuthenticatedSession,
      accessMode,
      offlineEligibilityState,
      offlineWorkspaceBlocked,
      beginOfflineResume,
      retryOfflineConnection,
    ],
  );

  return <MobileAuthContext.Provider value={value}>{children}</MobileAuthContext.Provider>;
}

export function useMobileAuth() {
  const ctx = useContext(MobileAuthContext);
  if (!ctx) {
    throw new Error("useMobileAuth must be used within MobileAuthProvider");
  }
  return ctx;
}
