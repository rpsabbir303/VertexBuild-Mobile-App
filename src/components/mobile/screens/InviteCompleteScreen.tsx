"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { completeInvitationActivationFlow } from "@/lib/mobile/completeInvitation";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { AuthFormAlert } from "../auth/AuthFormAlert";
import { AuthShell } from "../auth/AuthShell";

export function InviteCompleteScreen() {
  const router = useRouter();
  const started = useRef(false);
  const {
    authStatus,
    session,
    login,
    finalizeInvitationActivation,
    clearInvitationActivation,
    invitationActivation,
  } = useMobileAuth();
  const { applyAuthAccount, setCurrentProjectId } = useMobileApp();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "mfa_pending") {
      router.replace(MOBILE_AUTH_ROUTES.mfa);
      return;
    }
    if (!invitationActivation) {
      router.replace(MOBILE_AUTH_ROUTES.invite);
      return;
    }
    if (started.current) return;
    started.current = true;

    void (async () => {
      const result = await completeInvitationActivationFlow({
        finalize: finalizeInvitationActivation,
        login: async (email, password) => {
          const attempt = await login(email, password);
          return attempt.ok ? attempt : { ok: false as const };
        },
        applyAuthAccount,
        setCurrentProjectId,
        clearInvitation: clearInvitationActivation,
        router,
        authenticated: authStatus === "authenticated" && session?.mfaVerified !== false,
      });

      if (!result.ok) {
        if (result.code === "email_mismatch") {
          setError("Signed-in account does not match this invitation. Sign in with the invited email.");
          return;
        }
        if (result.code === "not_verified") {
          router.replace(MOBILE_AUTH_ROUTES.inviteVerify);
          return;
        }
        setError("Unable to complete activation. Please try again.");
      }
    })();
  }, [
    applyAuthAccount,
    authStatus,
    clearInvitationActivation,
    finalizeInvitationActivation,
    invitationActivation,
    login,
    router,
    setCurrentProjectId,
  ]);

  return (
    <AuthShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-8">
        {error ? (
          <>
            <AuthFormAlert>{error}</AuthFormAlert>
            <Link
              href={MOBILE_AUTH_ROUTES.login}
              className="m-press mt-6 text-[14px] font-semibold text-brand-blue"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <div
              className="h-9 w-9 animate-spin rounded-full border-2 border-brand-line border-t-brand-blue"
              role="status"
              aria-label="Completing activation"
            />
            <p className="mt-4 text-[14px] font-medium text-brand-muted">Completing your access…</p>
          </>
        )}
      </div>
    </AuthShell>
  );
}
