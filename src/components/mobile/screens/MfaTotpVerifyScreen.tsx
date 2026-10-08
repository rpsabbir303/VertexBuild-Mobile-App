"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { MfaVerifyPurpose } from "@/lib/mobile/mfa";
import { getMfaVerifyErrorMessage } from "@/lib/mobile/mfa";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthFormAlert } from "../auth/AuthFormAlert";
import { AuthShell } from "../auth/AuthShell";
import { MfaRecoveryNotice } from "../auth/MfaRecoveryNotice";
import { OtpInput } from "../auth/OtpInput";

export function MfaTotpVerifyScreen({
  purpose,
  title,
  description,
  backHref,
}: {
  purpose: MfaVerifyPurpose;
  title: string;
  description: string;
  backHref?: string;
}) {
  const router = useRouter();
  const {
    authStatus,
    mfaServerState,
    refreshMfaState,
    verifyMfaTotp,
    completeMfaAndAuthenticate,
    logout,
    invitationActivation,
  } = useMobileAuth();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshMfaState();
  }, [refreshMfaState]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace(MOBILE_AUTH_ROUTES.login);
    }
  }, [authStatus, router]);

  const codeLength = mfaServerState?.codeLength ?? 6;
  const codeComplete = code.replace(/\D/g, "").length === codeLength;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!codeComplete) {
      setError(getMfaVerifyErrorMessage("incomplete"));
      return;
    }

    setLoading(true);
    const result = await verifyMfaTotp(code, purpose);
    setLoading(false);

    if (!result.ok) {
      setError(getMfaVerifyErrorMessage(result.code));
      if (result.code === "primary_expired") {
        void logout().then(() => router.replace(MOBILE_AUTH_ROUTES.login));
      }
      return;
    }

    completeMfaAndAuthenticate();
    if (invitationActivation) {
      router.replace(MOBILE_AUTH_ROUTES.inviteComplete);
      return;
    }
    router.replace(MOBILE_AUTH_ROUTES.appHome);
  }

  if (authStatus !== "mfa_pending" || !mfaServerState) {
    return (
      <AuthShell>
        <div className="flex min-h-[40vh] items-center justify-center" aria-hidden="true" />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {backHref ? (
        <div className="pt-2">
          <Link
            href={backHref}
            className="m-press inline-flex h-10 items-center text-[13px] font-semibold text-brand-muted"
          >
            Back
          </Link>
        </div>
      ) : null}

      <div className="mt-4 flex flex-1 flex-col pb-6">
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-brand-navy">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">{description}</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <OtpInput
              value={code}
              onChange={(next) => {
                setCode(next);
                if (error) setError(null);
              }}
              disabled={loading}
              hasError={Boolean(error)}
              autoFocus
              idPrefix="totp"
            />
            {error ? (
              <div className="mt-3">
                <AuthFormAlert>{error}</AuthFormAlert>
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loading || !codeComplete}
            aria-busy={loading}
            className="m-press w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>

        <MfaRecoveryNotice recoveryAvailable={mfaServerState.recoveryAvailable} />

        <button
          type="button"
          onClick={() => {
            void logout().then(() => router.replace(MOBILE_AUTH_ROUTES.login));
          }}
          className="m-press mt-8 text-center text-[13px] font-semibold text-brand-muted"
        >
          Sign in with a different account
        </button>
      </div>
    </AuthShell>
  );
}
