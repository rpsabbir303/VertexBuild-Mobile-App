"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBiometricUnlockErrorMessage, isBiometricAvailable } from "@/lib/mobile/biometric";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthFormAlert } from "../auth/AuthFormAlert";
import { AuthShell } from "../auth/AuthShell";

export function BiometricUnlockScreen() {
  const {
    unlockWithBiometric,
    biometricUnlockLoading,
    preparePasswordFallbackFromLock,
  } = useMobileAuth();
  const [error, setError] = useState<string | null>(null);
  const [deviceAvailable, setDeviceAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    void isBiometricAvailable().then(setDeviceAvailable);
  }, []);

  async function handleUnlock() {
    setError(null);
    const result = await unlockWithBiometric();
    if (result.ok) return;
    if (result.code === "cancelled") return;
    setError(getBiometricUnlockErrorMessage(result.code));
  }

  useEffect(() => {
    if (deviceAvailable) void handleUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-prompt once when lock screen opens
  }, [deviceAvailable]);

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-6">
        <AuthBrandMark />

        <div className="mt-8 text-center">
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-brand-navy">VertexBuild</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">Unlock to continue</p>
        </div>

        {error ? (
          <div className="mt-6">
            <AuthFormAlert>{error}</AuthFormAlert>
          </div>
        ) : null}

        {deviceAvailable === false ? (
          <p className="mt-6 text-center text-[14px] text-brand-muted">
            Biometric unlock is unavailable on this device. Use your password to continue.
          </p>
        ) : (
          <button
            type="button"
            onClick={handleUnlock}
            disabled={biometricUnlockLoading || deviceAvailable === null}
            aria-busy={biometricUnlockLoading}
            className="m-press mt-8 w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {biometricUnlockLoading ? "Verifying…" : "Use device biometrics"}
          </button>
        )}

        <Link
          href={MOBILE_AUTH_ROUTES.login}
          onClick={() => preparePasswordFallbackFromLock()}
          className="m-press mt-4 block w-full py-2.5 text-center text-[14px] font-semibold text-brand-blue"
        >
          Use password instead
        </Link>
      </div>
    </AuthShell>
  );
}
