"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { isMobileAuthPath, MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { sessionEndRoute } from "@/lib/mobile/sessionSecurity";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { BiometricEnablePrompt } from "./auth/BiometricEnablePrompt";
import { OfflineAccessBanner } from "./auth/OfflineAccessBanner";
import { OfflineAccessExpiredScreen } from "./screens/OfflineAccessExpiredScreen";
import { OfflineResumeScreen } from "./screens/OfflineResumeScreen";
import { BiometricUnlockScreen } from "./screens/BiometricUnlockScreen";
import { isDeviceOnline } from "@/lib/mobile/offlineAuth";
import { MobileShell } from "./MobileShell";

export function MobileRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    authStatus,
    sessionEndReason,
    permissionAccessBlocked,
    offlineEligibilityState,
    offlineWorkspaceBlocked,
  } = useMobileAuth();

  const authRoute = isMobileAuthPath(pathname);
  const mfaRoute = pathname.startsWith(MOBILE_AUTH_ROUTES.mfa);
  const authEntryRoute =
    pathname === MOBILE_AUTH_ROUTES.login ||
    pathname === MOBILE_AUTH_ROUTES.forgotPassword;
  const sessionPermissionRoute = pathname === MOBILE_AUTH_ROUTES.sessionPermission;

  useEffect(() => {
    if (authStatus === "loading") return;

    if (authStatus === "unauthenticated" && sessionEndReason && !authRoute) {
      const target = sessionEndRoute(sessionEndReason);
      if (pathname !== target) {
        router.replace(target);
      }
      return;
    }

    if (authStatus === "authenticated" && permissionAccessBlocked && !sessionPermissionRoute) {
      router.replace(MOBILE_AUTH_ROUTES.sessionPermission);
      return;
    }

    if (authStatus === "mfa_pending" && !mfaRoute) {
      router.replace(MOBILE_AUTH_ROUTES.mfa);
      return;
    }

    if (authStatus === "unauthenticated" && !authRoute) {
      router.replace(MOBILE_AUTH_ROUTES.login);
      return;
    }

    if (authStatus === "authenticated" && !permissionAccessBlocked) {
      if (authEntryRoute || pathname === MOBILE_AUTH_ROUTES.biometric) {
        router.replace(MOBILE_AUTH_ROUTES.appHome);
      }
    }
  }, [
    authStatus,
    authRoute,
    authEntryRoute,
    mfaRoute,
    pathname,
    permissionAccessBlocked,
    router,
    sessionEndReason,
    sessionPermissionRoute,
    offlineWorkspaceBlocked,
  ]);

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

  if (authStatus === "authenticated" && offlineWorkspaceBlocked && !authRoute) {
    return (
      <MobileShell hideBottomNav>
        {offlineEligibilityState === "expired" ? (
          <OfflineAccessExpiredScreen />
        ) : (
          <OfflineResumeScreen />
        )}
      </MobileShell>
    );
  }

  if (authStatus === "offline_resume" && !authRoute) {
    return (
      <MobileShell hideBottomNav>
        <OfflineResumeScreen />
      </MobileShell>
    );
  }

  if (
    authStatus === "unauthenticated" &&
    offlineEligibilityState === "expired" &&
    !isDeviceOnline() &&
    !authRoute
  ) {
    return (
      <MobileShell hideBottomNav>
        <OfflineAccessExpiredScreen />
      </MobileShell>
    );
  }

  if (authStatus === "biometric_locked" && !authRoute) {
    return (
      <MobileShell hideBottomNav>
        <BiometricUnlockScreen />
      </MobileShell>
    );
  }

  if (authStatus === "mfa_pending" && !mfaRoute) {
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
      <OfflineAccessBanner />
      {children}
      <BiometricEnablePrompt />
    </MobileShell>
  );
}
