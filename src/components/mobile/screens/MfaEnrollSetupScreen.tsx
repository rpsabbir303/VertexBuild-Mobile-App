"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { mfaQrImageUrl } from "@/lib/mobile/mfa";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthShell } from "../auth/AuthShell";
import { IconBack } from "../icons";

export function MfaEnrollSetupScreen() {
  const router = useRouter();
  const { authStatus, mfaServerState, refreshMfaState } = useMobileAuth();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refreshMfaState();
  }, [refreshMfaState]);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.replace(MOBILE_AUTH_ROUTES.login);
    if (authStatus === "authenticated") router.replace(MOBILE_AUTH_ROUTES.appHome);
    if (mfaServerState && mfaServerState.phase !== "enroll") {
      router.replace(MOBILE_AUTH_ROUTES.mfaChallenge);
    }
  }, [authStatus, mfaServerState, router]);

  async function copyKey() {
    if (!mfaServerState?.manualEntryKey) return;
    try {
      await navigator.clipboard.writeText(mfaServerState.manualEntryKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!mfaServerState?.provisioningUri || !mfaServerState.manualEntryKey) {
    return (
      <AuthShell>
        <div className="flex min-h-[40vh] items-center justify-center" aria-hidden="true" />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="pt-2">
        <Link
          href={MOBILE_AUTH_ROUTES.mfaEnroll}
          className="m-press inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
          aria-label="Back"
        >
          <IconBack />
        </Link>
      </div>

      <div className="mt-4 flex flex-1 flex-col pb-6">
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-brand-navy">Authenticator setup</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">
          Scan the QR code with your authenticator app, or enter the setup key manually.
        </p>

        <div className="mt-6 flex justify-center rounded-mobile border border-brand-line/70 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mfaQrImageUrl(mfaServerState.provisioningUri)}
            alt="QR code for authenticator setup"
            width={200}
            height={200}
            className="h-[200px] w-[200px]"
          />
        </div>

        <div className="mt-6 rounded-mobile border border-brand-line/70 bg-white/95 px-4 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Manual setup key</p>
          <p className="mt-2 break-all font-mono text-[14px] font-semibold tracking-wide text-brand-navy">
            {mfaServerState.manualEntryKey}
          </p>
          <button
            type="button"
            onClick={copyKey}
            className="m-press mt-3 text-[13px] font-semibold text-brand-blue"
          >
            {copied ? "Copied" : "Copy setup key"}
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-brand-muted">
            Enter this key in Google Authenticator, Microsoft Authenticator, or another TOTP app for VertexBuild.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push(MOBILE_AUTH_ROUTES.mfaEnrollConfirm)}
          className="m-press mt-8 w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft"
        >
          Continue
        </button>
      </div>
    </AuthShell>
  );
}
