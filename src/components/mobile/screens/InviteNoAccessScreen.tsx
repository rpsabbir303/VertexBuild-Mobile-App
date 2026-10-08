"use client";

import Link from "next/link";
import { useEffect } from "react";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthShell } from "../auth/AuthShell";

export function InviteNoAccessScreen() {
  const { invitationActivation, clearInvitationActivation } = useMobileAuth();

  useEffect(() => {
    if (!invitationActivation) return;
  }, [invitationActivation]);

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-8">
        <AuthBrandMark />
        <h1 className="mt-8 text-[24px] font-bold tracking-[-0.03em] text-brand-navy">No project access</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">
          Your account was activated, but you are not assigned to any projects yet. Contact your administrator if
          you believe this is an error.
        </p>
        <Link
          href={MOBILE_AUTH_ROUTES.login}
          onClick={() => clearInvitationActivation()}
          className="m-press mt-8 block w-full rounded-mobile bg-brand-blue py-3.5 text-center text-[16px] font-semibold text-white shadow-soft"
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
