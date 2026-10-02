"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isBiometricAvailable } from "@/lib/mobile/biometric";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconBack } from "../icons";
import { MobileCard } from "../ui/MobileCard";

export function ProfileScreen() {
  const { user } = useMobileApp();
  const {
    biometricLoginEnabled,
    enableBiometricLogin,
    disableBiometricLogin,
    logout,
    biometricEnableLoading,
  } = useMobileAuth();

  const [deviceBiometricAvailable, setDeviceBiometricAvailable] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  useEffect(() => {
    void isBiometricAvailable().then(setDeviceBiometricAvailable);
  }, []);

  async function handleToggle() {
    setToggleError(null);
    if (biometricLoginEnabled) {
      disableBiometricLogin();
      return;
    }
    const result = await enableBiometricLogin();
    if (!result.ok && result.code !== "cancelled") {
      setToggleError("Could not enable biometric login.");
    }
  }

  return (
    <>
      <header className="flex items-center gap-2 border-b border-brand-line/80 bg-white/90 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <Link
          href="/mobile-preview/more"
          className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
          aria-label="Back to More"
        >
          <IconBack />
        </Link>
        <h1 className="truncate text-[17px] font-semibold text-brand-navy">Profile</h1>
      </header>

      <main className="space-y-4 px-4 py-4">
        <MobileCard className="p-4">
          <p className="text-[15px] font-bold text-brand-navy">
            {user.firstName} {user.lastName}
          </p>
          <p className="mt-1 text-[13px] text-brand-muted">{user.roleLabel}</p>
          <p className="mt-1 text-[13px] text-brand-mist">{user.company}</p>
        </MobileCard>

        {deviceBiometricAvailable ? (
          <MobileCard className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold text-brand-navy">Biometric Login</p>
                <p className="mt-1 text-[13px] text-brand-muted">
                  {biometricLoginEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={biometricLoginEnabled}
                disabled={biometricEnableLoading}
                onClick={handleToggle}
                className={`relative h-8 w-[52px] shrink-0 rounded-pill transition ${
                  biometricLoginEnabled ? "bg-brand-blue" : "bg-brand-line"
                } disabled:opacity-50`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-soft transition ${
                    biometricLoginEnabled ? "left-[24px]" : "left-1"
                  }`}
                />
              </button>
            </div>
            {toggleError ? (
              <p className="mt-2 text-[13px] text-status-danger" role="alert">
                {toggleError}
              </p>
            ) : null}
          </MobileCard>
        ) : null}

        <button
          type="button"
          onClick={logout}
          className="m-press w-full rounded-mobile border border-brand-line bg-white py-3 text-[15px] font-semibold text-brand-navy shadow-soft"
        >
          Sign out
        </button>
      </main>
    </>
  );
}
