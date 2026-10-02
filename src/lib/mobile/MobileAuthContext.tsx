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
  isBiometricAvailable,
  isBiometricEnableDismissed,
  readBiometricPreference,
  readBiometricVault,
  registerBiometricCredential,
  setBiometricEnableDismissed,
  shouldOfferBiometricUnlock,
  verifyBiometricCredential,
  writeBiometricPreference,
  writeBiometricVault,
} from "./biometric";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "biometric_locked";

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
  ) => Promise<{ ok: true; account: AuthAccount } | { ok: false; code: LoginErrorCode }>;
  logout: () => void;
  enableBiometricLogin: () => Promise<
    { ok: true } | { ok: false; code: "unavailable" | "cancelled" | "failed" | "no_session" }
  >;
  disableBiometricLogin: () => void;
  dismissBiometricEnablePrompt: () => void;
  unlockWithBiometric: () => Promise<
    { ok: true } | { ok: false; code: "unavailable" | "cancelled" | "failed" | "expired" | "no_vault" }
  >;
  sendVerificationCode: (
    email: string,
  ) => Promise<
    | { ok: true }
    | { ok: false; code: "email_required" | "email_invalid" | "server" }
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
};

const MobileAuthContext = createContext<MobileAuthContextValue | null>(null);

function readStoredSession(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed?.email || !parsed?.token) return null;
    return parsed;
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

  const refreshPasswordRecovery = useCallback(() => {
    setPasswordRecovery(readPasswordRecovery());
  }, []);

  const syncBiometricPref = useCallback(() => {
    setBiometricLoginEnabled(Boolean(readBiometricPreference()?.enabled));
  }, []);

  const maybePromptBiometricEnable = useCallback(async (activeSession: StoredAuthSession) => {
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

  useEffect(() => {
    const stored = readStoredSession();
    syncBiometricPref();
    setPasswordRecovery(readPasswordRecovery());

    if (stored) {
      setSession(stored);
      setAuthStatus("authenticated");
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

  const login = useCallback(async (email: string, password: string) => {
    const result = await mockLogin(email, password);
    if (!result.ok) return result;
    const nextSession: StoredAuthSession = {
      email: result.account.email,
      role: result.account.role,
      token: `mock-${Date.now()}`,
      issuedAt: Date.now(),
    };
    writeStoredSession(nextSession);
    writePasswordRecovery(null);
    setPasswordRecovery(null);
    setSession(nextSession);
    setAuthStatus("authenticated");
    syncBiometricPref();
    void maybePromptBiometricEnable(nextSession);
    return result;
  }, [maybePromptBiometricEnable, syncBiometricPref]);

  const logout = useCallback(() => {
    writeStoredSession(null);
    writeBiometricVault(null);
    setSession(null);
    setAuthStatus("unauthenticated");
    setShowBiometricEnablePrompt(false);
  }, []);

  const enableBiometricLogin = useCallback(async () => {
    const activeSession = session ?? readStoredSession();
    if (!activeSession) return { ok: false as const, code: "no_session" as const };

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

  const unlockWithBiometric = useCallback(async () => {
    const pref = readBiometricPreference();
    const vault = readBiometricVault();
    if (!pref?.enabled || !vault) {
      setAuthStatus("unauthenticated");
      return { ok: false as const, code: "no_vault" as const };
    }

    setBiometricUnlockLoading(true);
    const verified = await verifyBiometricCredential(pref.credentialId);
    setBiometricUnlockLoading(false);

    if (!verified.ok) return verified;

    if (vault.email.toLowerCase() !== pref.email.toLowerCase()) {
      writeBiometricVault(null);
      setAuthStatus("unauthenticated");
      return { ok: false as const, code: "expired" as const };
    }

    writeStoredSession(vault);
    setSession(vault);
    setAuthStatus("authenticated");
    return { ok: true as const };
  }, []);

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
      logout,
      enableBiometricLogin,
      disableBiometricLogin,
      dismissBiometricEnablePrompt,
      unlockWithBiometric,
      sendVerificationCode,
      verifyOtp,
      resendVerificationCode,
      completePasswordReset,
      clearPasswordRecovery,
      hasActiveResetSession,
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
      logout,
      enableBiometricLogin,
      disableBiometricLogin,
      dismissBiometricEnablePrompt,
      unlockWithBiometric,
      sendVerificationCode,
      verifyOtp,
      resendVerificationCode,
      completePasswordReset,
      clearPasswordRecovery,
      hasActiveResetSession,
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
