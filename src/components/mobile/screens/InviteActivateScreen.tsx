"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { InviteContextCard } from "../auth/InviteContextCard";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthShell } from "../auth/AuthShell";
import { loginWithInvitationContinue, MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";

export function InviteActivateScreen() {
  const router = useRouter();
  const { invitationActivation, refreshInvitationActivation } = useMobileAuth();

  useEffect(() => {
    refreshInvitationActivation();
  }, [refreshInvitationActivation]);

  useEffect(() => {
    if (!invitationActivation) {
      router.replace(MOBILE_AUTH_ROUTES.invite);
    }
  }, [invitationActivation, router]);

  if (!invitationActivation) {
    return (
      <AuthShell>
        <div className="flex min-h-[40vh] items-center justify-center" aria-hidden="true" />
      </AuthShell>
    );
  }

  const isNew = invitationActivation.accountKind === "new";

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col py-4">
        <AuthBrandMark />
        <h1 className="mt-6 text-[24px] font-bold tracking-[-0.03em] text-brand-navy">
          You&apos;ve been invited to VertexBuild
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">
          {isNew
            ? "Activate your account to join your organization on VertexBuild."
            : "Sign in with your existing VertexBuild account to accept this invitation."}
        </p>

        <div className="mt-6">
          <InviteContextCard
            email={invitationActivation.email}
            tenantName={invitationActivation.tenantName}
            roleLabel={invitationActivation.roleLabel}
            projectLabels={invitationActivation.projectLabels}
            inviterName={invitationActivation.inviterName}
          />
        </div>

        <div className="mt-8 space-y-3">
          {isNew ? (
            <button
              type="button"
              onClick={() => router.push(MOBILE_AUTH_ROUTES.inviteSetup)}
              className="m-press w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft"
            >
              Set up credentials
            </button>
          ) : (
            <Link
              href={loginWithInvitationContinue()}
              className="m-press block w-full rounded-mobile bg-brand-blue py-3.5 text-center text-[16px] font-semibold text-white shadow-soft"
            >
              Sign in to continue
            </Link>
          )}
        </div>

        <Link
          href={MOBILE_AUTH_ROUTES.login}
          className="m-press mt-6 text-center text-[13px] font-semibold text-brand-muted"
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
