"use client";

import { useState } from "react";
import { isDeviceOnline } from "@/lib/mobile/offlineAuth";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthFormAlert } from "../auth/AuthFormAlert";
import { AuthShell } from "../auth/AuthShell";

export function OfflineAccessExpiredScreen() {
  const { retryOfflineConnection, accessMode } = useMobileAuth();
  const [message, setMessage] = useState<string | null>(null);

  function handleTryAgain() {
    if (!isDeviceOnline()) {
      setMessage("Still offline. Connect to the internet to verify your access.");
      return;
    }
    setMessage(null);
    retryOfflineConnection();
  }

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-8">
        <AuthBrandMark />
        <h1 className="mt-8 text-[24px] font-bold tracking-[-0.03em] text-brand-navy">
          Offline access expired
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">
          Connect to the internet to verify your access. Offline authorization is not treated as a
          current server session.
        </p>
        {message ? (
          <div className="mt-5">
            <AuthFormAlert>{message}</AuthFormAlert>
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleTryAgain}
          disabled={accessMode === "revalidating"}
          className="m-press mt-8 w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60"
        >
          {accessMode === "revalidating" ? "Checking connection…" : "Try again"}
        </button>
      </div>
    </AuthShell>
  );
}
