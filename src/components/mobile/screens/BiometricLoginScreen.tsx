"use client";

import Link from "next/link";
import { useState } from "react";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthShell } from "../auth/AuthShell";

export function BiometricLoginScreen() {
  const { unlockWithBiometric, biometricUnlockLoading } = useMobileAuth();
  const [error, setError] = useState<string | null>(null);

  async function handleUseBiometrics() {
    setError(null);
    const result = await unlockWithBiometric();
    if (result.ok) return;
    if (result.code === "cancelled") return;
    if (result.code === "expired") {
      setError("Your session has expired. Please sign in with your password.");
      return;
    }
    setError("Biometric authentication failed. Please try again.");
  }

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-6">
        <AuthBrandMark />

        <div className="mt-8 text-center">
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-brand-navy">Welcome back</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">
            Use your device biometrics to continue.
          </p>
        </div>

        {error ? (
          <div
            className="mt-6 rounded-mobile border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-status-danger"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleUseBiometrics}
          disabled={biometricUnlockLoading}
          className="m-press mt-8 w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60"
        >
          {biometricUnlockLoading ? "Verifying…" : "Use biometrics"}
        </button>

        <Link
          href={MOBILE_AUTH_ROUTES.login}
          className="m-press mt-4 block w-full py-2.5 text-center text-[14px] font-semibold text-brand-blue"
        >
          Use password instead
        </Link>
      </div>
    </AuthShell>
  );
}
