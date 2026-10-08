"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getResetPasswordErrorMessage } from "@/lib/mobile/auth";
import { isResetPasswordValid } from "@/lib/mobile/invitation";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthField } from "../auth/AuthField";
import { AuthFormAlert } from "../auth/AuthFormAlert";
import { AuthShell } from "../auth/AuthShell";
import { ResetPasswordRequirements } from "../auth/ResetPasswordRequirements";
import { IconBack, IconEye, IconEyeOff } from "../icons";

export function InviteSetupScreen() {
  const router = useRouter();
  const { invitationActivation, setInvitationCredentials, refreshInvitationActivation } = useMobileAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    refreshInvitationActivation();
  }, [refreshInvitationActivation]);

  useEffect(() => {
    if (!invitationActivation) {
      router.replace(MOBILE_AUTH_ROUTES.invite);
      return;
    }
    if (invitationActivation.accountKind !== "new") {
      router.replace(MOBILE_AUTH_ROUTES.inviteActivate);
    }
  }, [invitationActivation, router]);

  const canSubmit = useMemo(
    () => isResetPasswordValid(password) && confirm.length > 0 && password === confirm,
    [password, confirm],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setConfirmError(null);
    setFormError(null);
    if (!canSubmit) return;

    setLoading(true);
    const result = await setInvitationCredentials(password, confirm);
    setLoading(false);

    if (!result.ok) {
      if (
        result.code === "password_required" ||
        result.code === "password_too_short" ||
        result.code === "password_missing_upper" ||
        result.code === "password_missing_lower" ||
        result.code === "password_missing_number"
      ) {
        setPasswordError(getResetPasswordErrorMessage(result.code));
      } else if (result.code === "confirm_required" || result.code === "password_mismatch") {
        setConfirmError(getResetPasswordErrorMessage(result.code));
      } else {
        setFormError(getResetPasswordErrorMessage("server"));
      }
      return;
    }

    if (result.session.verificationRequired) {
      router.push(MOBILE_AUTH_ROUTES.inviteVerify);
      return;
    }
    router.push(MOBILE_AUTH_ROUTES.inviteComplete);
  }

  if (!invitationActivation) return null;

  return (
    <AuthShell>
      <div className="pt-2">
        <Link
          href={MOBILE_AUTH_ROUTES.inviteActivate}
          className="m-press inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
          aria-label="Back"
        >
          <IconBack />
        </Link>
      </div>

      <div className="mt-4 flex flex-1 flex-col pb-6">
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-brand-navy">Create your password</h1>
        <p className="mt-2 text-[15px] text-brand-muted">Choose a password for your invited account.</p>

        <div className="mt-6">
          <AuthField
            id="invite-email"
            label="Work email"
            type="email"
            value={invitationActivation.email}
            readOnly
            disabled
          />
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
          {formError ? <AuthFormAlert>{formError}</AuthFormAlert> : null}

          <AuthField
            id="invite-password"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            disabled={loading}
            trailing={
              <button
                type="button"
                className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-muted active:bg-brand-soft"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            }
          />

          <AuthField
            id="invite-confirm"
            label="Confirm password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={confirmError}
            disabled={loading}
            trailing={
              <button
                type="button"
                className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-muted active:bg-brand-soft"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <IconEyeOff /> : <IconEye />}
              </button>
            }
          />

          <ResetPasswordRequirements password={password} />

          <button
            type="submit"
            disabled={loading || !canSubmit}
            aria-busy={loading}
            className="m-press w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {loading ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
