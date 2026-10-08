"use client";

import Link from "next/link";
import { useState } from "react";
import { getBiometricUnlockErrorMessage } from "@/lib/mobile/biometric";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { readOfflineEligibility } from "@/lib/mobile/offlineAuth";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthFormAlert } from "../auth/AuthFormAlert";
import { AuthShell } from "../auth/AuthShell";

export function OfflineResumeScreen() {
  const { beginOfflineResume, biometricUnlockLoading, offlineEligibilityState } = useMobileAuth();
  const [error, setError] = useState<string | null>(null);
  const record = readOfflineEligibility();

  async function handleContinue() {
    setError(null);
    const result = await beginOfflineResume();
    if (result.ok) return;
    if (result.code === "cancelled") {
      setError("Unlock was cancelled. Your offline workspace stays locked.");
      return;
    }
    if (result.code === "expired") {
      setError("Offline access expired. Connect to verify your access.");
      return;
    }
    if (result.code === "none") {
      setError("No eligible offline workspace is stored on this device.");
      return;
    }
    if (
      result.code === "failed" ||
      result.code === "unavailable" ||
      result.code === "invalidated" ||
      result.code === "no_vault"
    ) {
      setError(getBiometricUnlockErrorMessage(result.code));
      return;
    }
    setError("Could not unlock the offline workspace.");
  }

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-8">
        <AuthBrandMark />
        <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-muted">
          Offline mode
        </p>
        <h1 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-brand-navy">
          You&apos;re currently offline
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">
          Your approved offline workspace is available on this device. This is stored locally and was
          last verified online
          {record?.lastVerifiedOnlineAt
            ? ` ${new Date(record.lastVerifiedOnlineAt).toLocaleString()}`
            : ""}
          .
        </p>
        {offlineEligibilityState !== "eligible" ? (
          <p className="mt-4 text-[14px] text-brand-muted">
            No eligible offline workspace is available on this device. Connect to verify your access.
            Offline use is not treated as a current server session.
          </p>
        ) : null}
        {error ? (
          <div className="mt-5">
            <AuthFormAlert>{error}</AuthFormAlert>
          </div>
        ) : null}
        {offlineEligibilityState === "eligible" ? (
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={biometricUnlockLoading}
            className="m-press mt-8 w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {biometricUnlockLoading ? "Unlocking…" : "Unlock & continue"}
          </button>
        ) : null}
        <Link
          href={MOBILE_AUTH_ROUTES.login}
          className="m-press mt-4 block py-2 text-center text-[14px] font-semibold text-brand-blue"
        >
          Sign in when online
        </Link>
      </div>
    </AuthShell>
  );
}
