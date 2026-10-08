"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSessionEndMessage,
  getSessionEndPrimaryAction,
  getSessionEndTitle,
  type SessionEndReason,
} from "@/lib/mobile/sessionSecurity";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthShell } from "../auth/AuthShell";

type SessionEndScreenProps = {
  reason: SessionEndReason;
};

export function SessionEndScreen({ reason }: SessionEndScreenProps) {
  const router = useRouter();
  const { clearSessionEndReason, dismissPermissionChangedGate } = useMobileAuth();
  const { accessibleProjects, setCurrentProjectId } = useMobileApp();

  function handlePrimary() {
    if (reason === "permission_changed") {
      dismissPermissionChangedGate();
      const fallback = accessibleProjects[0];
      if (fallback) setCurrentProjectId(fallback.id);
      router.replace(MOBILE_AUTH_ROUTES.appHome);
      return;
    }
    clearSessionEndReason();
    router.replace(MOBILE_AUTH_ROUTES.login);
  }

  const primaryLabel = getSessionEndPrimaryAction(reason);

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-8">
        <AuthBrandMark />
        <h1 className="mt-8 text-[24px] font-bold tracking-[-0.03em] text-brand-navy">
          {getSessionEndTitle(reason)}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">
          {getSessionEndMessage(reason)}
        </p>
        {reason === "permission_changed" ? (
          <button
            type="button"
            onClick={handlePrimary}
            className="m-press mt-8 w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft"
          >
            {primaryLabel}
          </button>
        ) : (
          <Link
            href={MOBILE_AUTH_ROUTES.login}
            onClick={() => clearSessionEndReason()}
            className="m-press mt-8 block w-full rounded-mobile bg-brand-blue py-3.5 text-center text-[16px] font-semibold text-white shadow-soft"
          >
            {primaryLabel}
          </Link>
        )}
      </div>
    </AuthShell>
  );
}
