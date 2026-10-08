"use client";

import Link from "next/link";
import { getInvitationErrorMessage, type InvitationErrorCode } from "@/lib/mobile/invitation";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { AuthShell } from "./AuthShell";
import { AuthBrandMark } from "./AuthBrandMark";

export function InviteErrorPanel({ code }: { code: InvitationErrorCode }) {
  const title =
    code === "expired"
      ? "Invitation expired"
      : code === "revoked"
        ? "Invitation revoked"
        : code === "used"
          ? "Invitation already used"
          : code === "invalid"
            ? "Invalid invitation"
            : "Unable to continue";

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-8">
        <AuthBrandMark />
        <h1 className="mt-8 text-center text-[24px] font-bold tracking-[-0.03em] text-brand-navy">{title}</h1>
        <p className="mt-3 text-center text-[15px] leading-relaxed text-brand-muted">
          {getInvitationErrorMessage(code)}
        </p>
        <Link
          href={MOBILE_AUTH_ROUTES.login}
          className="m-press mt-8 block w-full rounded-mobile bg-brand-blue py-3.5 text-center text-[16px] font-semibold text-white shadow-soft"
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
