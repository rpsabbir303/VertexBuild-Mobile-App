"use client";

import Link from "next/link";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { AuthShell } from "../auth/AuthShell";
import { IconCheck } from "../icons";

export function PasswordUpdatedScreen() {
  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <IconCheck strokeWidth={2.5} className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-center text-[24px] font-bold tracking-[-0.03em] text-brand-navy">
          Password reset successfully
        </h1>
        <p className="mt-3 text-center text-[15px] leading-relaxed text-brand-muted">
          Sign in with your new password to continue.
        </p>

        <Link
          href={MOBILE_AUTH_ROUTES.login}
          className="m-press mt-8 block w-full rounded-mobile bg-brand-blue py-3.5 text-center text-[16px] font-semibold text-white shadow-soft"
        >
          Back to login
        </Link>
      </div>
    </AuthShell>
  );
}
