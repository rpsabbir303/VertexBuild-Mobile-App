"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isBiometricAvailable } from "@/lib/mobile/biometric";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { LogoutConfirmSheet } from "../auth/LogoutConfirmSheet";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconBack } from "../icons";
import { mobilePageBg, mobileInsetCard } from "@/lib/mobile/mobileUi";
import { MobileCard } from "../ui/MobileCard";

const cardClass = `${mobileInsetCard} p-4`;

export function ProfileScreen() {
  const router = useRouter();
  const { user } = useMobileApp();
  const {
    biometricLoginEnabled,
    enableBiometricLogin,
    disableBiometricLogin,
    logout,
    logoutLoading,
    biometricEnableLoading,
  } = useMobileAuth();

  const [deviceBiometricAvailable, setDeviceBiometricAvailable] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

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
      setToggleError("Could not enable biometric unlock.");
    }
  }

  return (
    <div className={mobilePageBg}>
      <header className="flex items-center gap-2 border-b border-brand-line/50 bg-brand-canvas/95 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
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
        <MobileCard className={cardClass}>
          <p className="text-[15px] font-bold text-brand-navy">
            {user.firstName} {user.lastName}
          </p>
          <p className="mt-1 text-[13px] text-brand-muted">{user.roleLabel}</p>
          <p className="mt-1 text-[13px] text-brand-mist">{user.company}</p>
        </MobileCard>

        {deviceBiometricAvailable ? (
          <MobileCard className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold text-brand-navy">Biometric unlock</p>
                <p className="mt-1 text-[13px] text-brand-muted">
                  {biometricLoginEnabled
                    ? "Locks your local session when the app is backgrounded"
                    : "Off — sign in with password only when returning"}
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
          onClick={() => setLogoutConfirmOpen(true)}
          className="m-press w-full rounded-[18px] border border-brand-line/60 bg-white py-3.5 text-[15px] font-semibold text-[#E35D4A] shadow-[0_2px_12px_rgba(8,35,63,0.06)]"
        >
          Sign out
        </button>
      </main>

      <LogoutConfirmSheet
        open={logoutConfirmOpen}
        loading={logoutLoading}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={async () => {
          const result = await logout();
          setLogoutConfirmOpen(false);
          const params = new URLSearchParams({ signedOut: "1" });
          if (result.offline) params.set("offline", "1");
          if (result.remotePending) params.set("remotePending", "1");
          router.replace(`${MOBILE_AUTH_ROUTES.login}?${params.toString()}`);
        }}
      />
    </div>
  );
}
