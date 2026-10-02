"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  getResetPasswordErrorMessage,
  getResetPasswordValidationError,
  isResetPasswordValid,
} from "@/lib/mobile/auth";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthField } from "../auth/AuthField";
import { AuthShell } from "../auth/AuthShell";
import { ResetPasswordRequirements } from "../auth/ResetPasswordRequirements";
import { IconBack, IconCheck, IconEye, IconEyeOff } from "../icons";

export function ResetPasswordScreen() {
  const router = useRouter();
  const { completePasswordReset, hasActiveResetSession, clearPasswordRecovery } =
    useMobileAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!hasActiveResetSession && !resetSuccess) {
      setSessionExpired(true);
    }
  }, [hasActiveResetSession, resetSuccess]);

  const canSubmit = useMemo(() => {
    return (
      isResetPasswordValid(password) &&
      confirm.length > 0 &&
      password === confirm &&
      !sessionExpired
    );
  }, [password, confirm, sessionExpired]);

  function validateFields(): boolean {
    setPasswordError(null);
    setConfirmError(null);
    setFormError(null);

    const pwdCode = getResetPasswordValidationError(password);
    if (pwdCode) {
      setPasswordError(getResetPasswordErrorMessage(pwdCode));
      return false;
    }
    if (!confirm) {
      setConfirmError(getResetPasswordErrorMessage("confirm_required"));
      return false;
    }
    if (password !== confirm) {
      setConfirmError(getResetPasswordErrorMessage("password_mismatch"));
      return false;
    }
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sessionExpired || resetSuccess || loading) return;

    if (!validateFields()) return;

    setLoading(true);
    const result = await completePasswordReset(password, confirm);
    setLoading(false);

    if (!result.ok) {
      if (result.code === "session_expired") {
        setSessionExpired(true);
        setFormError(getResetPasswordErrorMessage("session_expired"));
        return;
      }
      if (
        result.code === "password_required" ||
        result.code === "password_too_short" ||
        result.code === "password_missing_upper" ||
        result.code === "password_missing_lower" ||
        result.code === "password_missing_number" ||
        result.code === "password_weak"
      ) {
        setPasswordError(getResetPasswordErrorMessage(result.code));
      } else if (result.code === "confirm_required" || result.code === "password_mismatch") {
        setConfirmError(getResetPasswordErrorMessage(result.code));
      } else {
        setFormError(getResetPasswordErrorMessage("server"));
      }
      return;
    }

    setPassword("");
    setConfirm("");
    setResetSuccess(true);
  }

  function startAgain() {
    clearPasswordRecovery();
    router.push(MOBILE_AUTH_ROUTES.forgotPassword);
  }

  const backHref = hasActiveResetSession
    ? MOBILE_AUTH_ROUTES.verifyOtp
    : MOBILE_AUTH_ROUTES.forgotPassword;

  if (resetSuccess) {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col justify-center py-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <IconCheck strokeWidth={2.5} className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-center text-[24px] font-bold tracking-[-0.03em] text-brand-navy">
            Password reset successfully.
          </h1>
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

  return (
    <AuthShell>
      <div className="pt-2">
        <Link
          href={backHref}
          className="m-press inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
          aria-label="Back"
        >
          <IconBack />
        </Link>
      </div>

      <div className="mt-4 flex flex-1 flex-col pb-6">
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-brand-navy">
          Create a new password
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">
          Enter a new password for your account.
        </p>

        {sessionExpired ? (
          <div
            className="mt-4 rounded-mobile border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] font-medium text-amber-900"
            role="alert"
          >
            {getResetPasswordErrorMessage("session_expired")}
            <button
              type="button"
              onClick={startAgain}
              className="m-press mt-3 block font-semibold text-brand-blue"
            >
              Start again
            </button>
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <div
              className="rounded-mobile border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-status-danger"
              role="alert"
            >
              {formError}
            </div>
          ) : null}

          <AuthField
            id="reset-password"
            label="New password"
            placeholder="Enter new password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            error={passwordError}
            disabled={loading || sessionExpired}
            trailing={
              <button
                type="button"
                className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-muted active:bg-brand-soft"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={sessionExpired}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            }
          />

          <AuthField
            id="reset-confirm"
            label="Confirm password"
            placeholder="Confirm new password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (confirmError) setConfirmError(null);
            }}
            error={confirmError}
            disabled={loading || sessionExpired}
            trailing={
              <button
                type="button"
                className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-muted active:bg-brand-soft"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                disabled={sessionExpired}
              >
                {showConfirm ? <IconEyeOff /> : <IconEye />}
              </button>
            }
          />

          <ResetPasswordRequirements password={password} />

          <button
            type="submit"
            disabled={loading || sessionExpired}
            aria-disabled={!canSubmit || loading || sessionExpired}
            className={`m-press w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60 ${
              !canSubmit && !loading && !sessionExpired ? "opacity-60" : ""
            }`}
          >
            {loading ? "Resetting password..." : "Reset password"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
