"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { InviteErrorPanel } from "../auth/InviteErrorPanel";
import { AuthShell } from "../auth/AuthShell";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import type { InvitationErrorCode } from "@/lib/mobile/invitation";

export function InviteEntryScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { validateInvitationToken } = useMobileAuth();
  const [errorCode, setErrorCode] = useState<InvitationErrorCode | null>(null);

  useEffect(() => {
    const token = searchParams.get("token") ?? searchParams.get("t") ?? "";
    if (!token.trim()) {
      setErrorCode("invalid");
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await validateInvitationToken(token);
      if (cancelled) return;
      if (!result.ok) {
        setErrorCode(result.code);
        return;
      }
      router.replace(MOBILE_AUTH_ROUTES.inviteActivate);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams, validateInvitationToken]);

  if (errorCode) {
    return <InviteErrorPanel code={errorCode} />;
  }

  return (
    <AuthShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-brand-line border-t-brand-blue"
          role="status"
          aria-label="Validating invitation"
        />
        <p className="mt-4 text-[14px] font-medium text-brand-muted">Validating your invitation…</p>
      </div>
    </AuthShell>
  );
}
