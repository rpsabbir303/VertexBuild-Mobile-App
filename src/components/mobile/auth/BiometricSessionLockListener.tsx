"use client";

import { useEffect } from "react";
import { shouldProtectSessionWithBiometric } from "@/lib/mobile/biometric";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";

/**
 * Locks the protected local session when the app is backgrounded/hidden
 * and biometric unlock is enabled. No inactivity timer — visibility only.
 */
export function BiometricSessionLockListener() {
  const { authStatus, lockSessionForBiometric } = useMobileAuth();

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== "hidden") return;
      if (authStatus !== "authenticated") return;
      if (!shouldProtectSessionWithBiometric()) return;
      lockSessionForBiometric();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [authStatus, lockSessionForBiometric]);

  return null;
}
