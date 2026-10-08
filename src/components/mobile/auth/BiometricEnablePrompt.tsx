"use client";

import { useState } from "react";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";

export function BiometricEnablePrompt() {
  const {
    showBiometricEnablePrompt,
    dismissBiometricEnablePrompt,
    enableBiometricLogin,
    biometricEnableLoading,
  } = useMobileAuth();
  const [error, setError] = useState<string | null>(null);

  if (!showBiometricEnablePrompt) return null;

  async function handleEnable() {
    setError(null);
    const result = await enableBiometricLogin();
    if (!result.ok) {
      if (result.code === "cancelled") {
        setError(null);
        return;
      }
      if (result.code === "unavailable") {
        dismissBiometricEnablePrompt();
        return;
      }
      setError("Could not enable biometric unlock. Please try again.");
    }
  }

  return (
    <div className="absolute inset-0 z-[70] flex items-end justify-center bg-brand-ink/30 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-6 sm:items-center">
      <div
        className="w-full max-w-[390px] rounded-mobile-lg border border-brand-line/80 bg-white p-5 shadow-float"
        role="dialog"
        aria-modal="true"
        aria-labelledby="biometric-enable-title"
      >
        <h2 id="biometric-enable-title" className="text-[18px] font-bold text-brand-navy">
          Use biometrics to unlock VertexBuild?
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">
          Protect your local session when the app is locked. This does not replace account sign-in
          — your device controls biometric security through the operating system.
        </p>
        {error ? (
          <p className="mt-3 text-[13px] font-medium text-status-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={biometricEnableLoading}
            onClick={handleEnable}
            className="m-press w-full rounded-mobile bg-brand-blue py-3 text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {biometricEnableLoading ? "Enabling…" : "Enable"}
          </button>
          <button
            type="button"
            disabled={biometricEnableLoading}
            onClick={() => dismissBiometricEnablePrompt()}
            className="m-press w-full rounded-mobile border border-brand-line py-3 text-[15px] font-semibold text-brand-navy"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
