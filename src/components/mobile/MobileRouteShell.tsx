"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { isMobileAuthPath, MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { BiometricEnablePrompt } from "./auth/BiometricEnablePrompt";
import { MobileShell } from "./MobileShell";

export function MobileRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authStatus } = useMobileAuth();

  const authRoute = isMobileAuthPath(pathname);
  const authEntryRoute =
    pathname === MOBILE_AUTH_ROUTES.login ||
    pathname === MOBILE_AUTH_ROUTES.forgotPassword;
  const passwordLoginRoute = pathname === MOBILE_AUTH_ROUTES.login;

  useEffect(() => {
    if (authStatus === "loading") return;

    if (authStatus === "biometric_locked") {
      if (!passwordLoginRoute && pathname !== MOBILE_AUTH_ROUTES.biometric) {
        router.replace(MOBILE_AUTH_ROUTES.biometric);
      }
      return;
    }

    if (authStatus === "unauthenticated" && !authRoute) {
      router.replace(MOBILE_AUTH_ROUTES.login);
      return;
    }

    if (authStatus === "authenticated") {
      if (authEntryRoute || pathname === MOBILE_AUTH_ROUTES.biometric) {
        router.replace(MOBILE_AUTH_ROUTES.appHome);
      }
    }
  }, [authStatus, authRoute, authEntryRoute, passwordLoginRoute, pathname, router]);

  if (authStatus === "loading") {
    return (
      <MobileShell hideBottomNav>
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-6">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-brand-line border-t-brand-blue"
            role="status"
            aria-label="Loading"
          />
        </div>
      </MobileShell>
    );
  }

  if (authStatus === "biometric_locked" && pathname !== MOBILE_AUTH_ROUTES.biometric && !passwordLoginRoute) {
    return (
      <MobileShell hideBottomNav>
        <div className="flex min-h-[40vh] items-center justify-center" aria-hidden="true" />
      </MobileShell>
    );
  }

  if (authStatus === "unauthenticated" && !authRoute) {
    return (
      <MobileShell hideBottomNav>
        <div className="flex min-h-[40vh] items-center justify-center" aria-hidden="true" />
      </MobileShell>
    );
  }

  if (authStatus === "authenticated" && (authEntryRoute || pathname === MOBILE_AUTH_ROUTES.biometric)) {
    return (
      <MobileShell hideBottomNav>
        <div className="flex min-h-[40vh] items-center justify-center" aria-hidden="true" />
      </MobileShell>
    );
  }

  return (
    <MobileShell hideBottomNav={authRoute}>
      {children}
      <BiometricEnablePrompt />
    </MobileShell>
  );
}
