"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { routeAfterPrimaryLogin } from "@/lib/mobile/postLoginNavigation";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { AuthShell } from "../auth/AuthShell";

export function SsoCallbackScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { exchangeEnterpriseCallback } = useMobileAuth();
  const { applyAuthAccount } = useMobileApp();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    void (async () => {
      const result = await exchangeEnterpriseCallback({ code, state });
      if (!result.ok) {
        router.replace(`${MOBILE_AUTH_ROUTES.ssoResult}?reason=${result.code}`);
        return;
      }
      applyAuthAccount(result.account);
      routeAfterPrimaryLogin(router, result, () => {
        router.replace(MOBILE_AUTH_ROUTES.appHome);
      });
    })();
  }, [applyAuthAccount, exchangeEnterpriseCallback, router, searchParams]);

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-10">
        <p className="text-[15px] font-semibold text-brand-navy" role="status">
          Verifying your VertexBuild access…
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">
          Organization sign-in is separate from project access. This step checks your workspace
          membership.
        </p>
      </div>
    </AuthShell>
  );
}
