"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { ssoFailureCopy, type SsoCallbackFailure } from "@/lib/mobile/enterpriseSso";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthShell } from "../auth/AuthShell";

const KNOWN: SsoCallbackFailure[] = [
  "cancelled",
  "not_provisioned",
  "membership_denied",
  "suspended",
  "project_denied",
  "network",
  "callback_invalid",
  "service",
  "not_configured",
];

export function SsoResultScreen() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("reason");
  const reason = KNOWN.includes(raw as SsoCallbackFailure) ? (raw as SsoCallbackFailure) : "service";
  const copy = ssoFailureCopy(reason);

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-8">
        <AuthBrandMark />
        <h1 className="mt-8 text-[24px] font-bold tracking-[-0.03em] text-brand-navy">{copy.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">{copy.message}</p>
        <Link
          href={MOBILE_AUTH_ROUTES.sso}
          className="m-press mt-8 block w-full rounded-mobile bg-brand-blue py-3.5 text-center text-[16px] font-semibold text-white shadow-soft"
        >
          Try again
        </Link>
        <Link
          href={MOBILE_AUTH_ROUTES.login}
          className="m-press mt-3 block py-2.5 text-center text-[14px] font-semibold text-brand-blue"
        >
          Use password login
        </Link>
      </div>
    </AuthShell>
  );
}
