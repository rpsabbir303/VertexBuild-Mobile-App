"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthShell } from "../auth/AuthShell";

export function MfaHubScreen() {
  const router = useRouter();
  const { authStatus, mfaServerState, refreshMfaState } = useMobileAuth();

  useEffect(() => {
    refreshMfaState();
  }, [refreshMfaState]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace(MOBILE_AUTH_ROUTES.login);
      return;
    }
    if (authStatus === "authenticated") {
      router.replace(MOBILE_AUTH_ROUTES.appHome);
      return;
    }
    if (authStatus === "mfa_pending" && mfaServerState) {
      router.replace(
        mfaServerState.phase === "enroll"
          ? MOBILE_AUTH_ROUTES.mfaEnroll
          : MOBILE_AUTH_ROUTES.mfaChallenge,
      );
    }
  }, [authStatus, mfaServerState, router]);

  return (
    <AuthShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-brand-line border-t-brand-blue"
          role="status"
          aria-label="Loading security step"
        />
        <p className="mt-4 text-[14px] font-medium text-brand-muted">Checking security requirements…</p>
      </div>
    </AuthShell>
  );
}
