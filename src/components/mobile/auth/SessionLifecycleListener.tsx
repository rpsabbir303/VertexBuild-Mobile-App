"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isDeviceOnline } from "@/lib/mobile/offlineAuth";
import { flushPendingRemoteLogout } from "@/lib/mobile/sessionSecurity";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";

/** Foreground session refresh/revalidation and pending remote logout flush. */
export function SessionLifecycleListener() {
  const pathname = usePathname();
  const { currentProject } = useMobileApp();
  const { authStatus, revalidateAuthenticatedSession } = useMobileAuth();

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      void flushPendingRemoteLogout();
      if (authStatus === "authenticated" && isDeviceOnline()) {
        void revalidateAuthenticatedSession(pathname, currentProject.id);
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [authStatus, currentProject.id, pathname, revalidateAuthenticatedSession]);

  useEffect(() => {
    if (authStatus === "authenticated" && isDeviceOnline()) {
      void revalidateAuthenticatedSession(pathname, currentProject.id);
    }
    // Run once when becoming authenticated on a route
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  return null;
}
