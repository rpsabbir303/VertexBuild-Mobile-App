"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { clearSsoTransaction, issueSsoAuthorizationCode, readPendingSso } from "@/lib/mobile/enterpriseSso";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthShell } from "../auth/AuthShell";

export function SsoAuthorizeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pending = readPendingSso();
  const stateMatches = pending && searchParams.get("state") === pending.state;
  const [leaving, setLeaving] = useState(false);

  function cancel() {
    clearSsoTransaction();
    router.replace(`${MOBILE_AUTH_ROUTES.ssoResult}?reason=cancelled`);
  }

  function continueAtIdp() {
    if (!stateMatches) {
      router.replace(`${MOBILE_AUTH_ROUTES.ssoResult}?reason=callback_invalid`);
      return;
    }
    setLeaving(true);
    const issued = issueSsoAuthorizationCode();
    if (!issued.ok) {
      router.replace(`${MOBILE_AUTH_ROUTES.ssoResult}?reason=${issued.code}`);
      return;
    }
    router.replace(issued.callbackPath);
  }

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-8">
        <AuthBrandMark />
        <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-muted">
          Organization sign-in
        </p>
        <h1 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-brand-navy">
          Continue in your organization&apos;s browser
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">
          VertexBuild does not collect your enterprise password. Finish sign-in with your organization,
          then you&apos;ll return here to verify workspace access.
        </p>
        {!stateMatches ? (
          <p className="mt-4 text-[14px] text-brand-muted">
            This sign-in session is no longer available. Start again from the login screen.
          </p>
        ) : null}
        <button
          type="button"
          disabled={leaving || !stateMatches}
          onClick={continueAtIdp}
          className="m-press mt-8 w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60"
        >
          {leaving ? "Returning to VertexBuild…" : "Continue"}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="m-press mt-3 w-full py-2.5 text-[14px] font-semibold text-brand-blue"
        >
          Cancel
        </button>
      </div>
    </AuthShell>
  );
}
