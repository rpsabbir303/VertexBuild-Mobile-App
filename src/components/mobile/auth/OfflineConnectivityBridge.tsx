"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";

/** Keeps app offline flag aligned with local access mode so sync waits for revalidation. */
export function OfflineConnectivityBridge() {
  const pathname = usePathname();
  const { currentProject } = useMobileApp();
  const { setIsOffline } = useMobileApp();
  const { accessMode, authStatus, revalidateAuthenticatedSession } = useMobileAuth();

  useEffect(() => {
    const treatOffline = accessMode === "offline_local" || accessMode === "revalidating";
    setIsOffline(treatOffline);
  }, [accessMode, setIsOffline]);

  useEffect(() => {
    if (accessMode !== "revalidating") return;
    if (authStatus !== "authenticated") return;
    void revalidateAuthenticatedSession(pathname, currentProject.id);
  }, [accessMode, authStatus, currentProject.id, pathname, revalidateAuthenticatedSession]);

  return null;
}
