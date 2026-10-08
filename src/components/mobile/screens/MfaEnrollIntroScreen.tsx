"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthShell } from "../auth/AuthShell";

export function MfaEnrollIntroScreen() {
  const router = useRouter();
  const { authStatus, mfaServerState, refreshMfaState, logout } = useMobileAuth();

  useEffect(() => {
    refreshMfaState();
  }, [refreshMfaState]);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.replace(MOBILE_AUTH_ROUTES.login);
    if (authStatus === "authenticated") router.replace(MOBILE_AUTH_ROUTES.appHome);
    if (mfaServerState && mfaServerState.phase === "challenge") {
      router.replace(MOBILE_AUTH_ROUTES.mfaChallenge);
    }
  }, [authStatus, mfaServerState, router]);

  if (authStatus !== "mfa_pending") return null;

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-6">
        <AuthBrandMark />
        <h1 className="mt-8 text-[24px] font-bold tracking-[-0.03em] text-brand-navy">
          Secure your VertexBuild account
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">
          Your organization requires an authenticator app for sign-in. Set up a TOTP authenticator to finish
          signing in.
        </p>

        <button
          type="button"
          onClick={() => router.push(MOBILE_AUTH_ROUTES.mfaEnrollSetup)}
          className="m-press mt-8 w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft"
        >
          Set up authenticator
        </button>

        <button
          type="button"
          onClick={() => {
            void logout().then(() => router.replace(MOBILE_AUTH_ROUTES.login));
          }}
          className="m-press mt-4 text-[13px] font-semibold text-brand-muted"
        >
          Cancel and sign out
        </button>
      </div>
    </AuthShell>
  );
}
