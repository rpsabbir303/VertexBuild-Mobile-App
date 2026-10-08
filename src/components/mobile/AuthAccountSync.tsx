"use client";

import { useEffect } from "react";
import { PROVISIONED_ACCOUNTS } from "@/lib/mobile/auth";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";

/** Keeps mock user profile aligned with the active auth session (including biometric restore). */
export function AuthAccountSync() {
  const { session, authStatus } = useMobileAuth();
  const { applyAuthAccount } = useMobileApp();

  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.email || session.mfaVerified === false) return;
    const account = PROVISIONED_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === session.email.toLowerCase(),
    );
    if (account) applyAuthAccount({ ...account, role: session.role });
  }, [authStatus, session?.email, session?.role, applyAuthAccount]);

  return null;
}
