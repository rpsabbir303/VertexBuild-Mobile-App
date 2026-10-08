"use client";

import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";

export function OfflineAccessBanner() {
  const { accessMode, authStatus } = useMobileAuth();
  if (authStatus !== "authenticated") return null;

  if (accessMode === "revalidating") {
    return (
      <div className="border-b border-brand-line/70 bg-white px-4 py-2.5 text-[13px] text-brand-navy">
        <p className="font-semibold">Connection restored</p>
        <p className="text-brand-muted">Revalidating your access…</p>
      </div>
    );
  }

  if (accessMode === "offline_local") {
    return (
      <div className="border-b border-brand-line/70 bg-white px-4 py-2 text-[13px] text-brand-navy">
        <p className="font-semibold">Offline</p>
        <p className="text-[12px] text-brand-muted">Changes will sync when you&apos;re back online.</p>
      </div>
    );
  }

  return null;
}
