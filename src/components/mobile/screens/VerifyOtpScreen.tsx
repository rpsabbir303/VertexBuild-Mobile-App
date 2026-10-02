"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  getResendCodeErrorMessage,
  getVerifyOtpErrorMessage,
  maskEmailForDisplay,
} from "@/lib/mobile/auth";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthShell } from "../auth/AuthShell";
import { OtpInput } from "../auth/OtpInput";
import { IconBack } from "../icons";

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function VerifyOtpScreen() {
  const router = useRouter();
  const {
    passwordRecovery,
    verifyOtp,
    resendVerificationCode,
    resendCooldownSec,
    otpExpiryRemainingSec,
    refreshPasswordRecovery,
    clearPasswordRecovery,
  } = useMobileAuth();

  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const otpExpired = otpExpiryRemainingSec <= 0;
  const otpComplete = otp.replace(/\D/g, "").length === 6;
  const maskedEmail = passwordRecovery?.email
    ? maskEmailForDisplay(passwordRecovery.email)
    : "";

  useEffect(() => {
    refreshPasswordRecovery();
  }, [refreshPasswordRecovery]);

  useEffect(() => {
    if (!passwordRecovery?.email) {
      router.replace(MOBILE_AUTH_ROUTES.forgotPassword);
    }
  }, [passwordRecovery?.email, router]);

  useEffect(() => {
    if (otpExpired && passwordRecovery?.email) {
      setOtpError(getVerifyOtpErrorMessage("expired"));
      setOtp("");
    }
  }, [otpExpired, passwordRecovery?.email]);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setResendError(null);

    if (otpExpired) {
      setOtpError(getVerifyOtpErrorMessage("expired"));
      setOtp("");
      return;
    }

    if (!otpComplete) {
      setOtpError(getVerifyOtpErrorMessage("incomplete"));
      return;
    }

    setOtpError(null);
    setVerifying(true);
    const result = await verifyOtp(otp);
    setVerifying(false);

    if (!result.ok) {
      setOtpError(getVerifyOtpErrorMessage(result.code));
      if (result.code === "expired") {
        setOtp("");
      }
      return;
    }

    router.push(MOBILE_AUTH_ROUTES.resetPassword);
  }

  async function handleResend() {
    if (resending) return;
    if (resendCooldownSec > 0 && !otpExpired) return;

    setResendError(null);
    setOtpError(null);
    setResending(true);
    const result = await resendVerificationCode();
    setResending(false);

    if (!result.ok) {
      if (result.code !== "cooldown") {
        setResendError(getResendCodeErrorMessage("server"));
      }
      return;
    }

    refreshPasswordRecovery();
    setOtp("");
  }

  if (!passwordRecovery?.email) {
    return (
      <AuthShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-brand-line border-t-brand-blue"
            role="status"
            aria-label="Loading"
          />
        </div>
      </AuthShell>
    );
  }

  const canResend = !resending && (otpExpired || resendCooldownSec <= 0);

  return (
    <AuthShell>
      <div className="pt-2">
        <Link
          href={MOBILE_AUTH_ROUTES.forgotPassword}
          className="m-press inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
          aria-label="Back"
        >
          <IconBack />
        </Link>
      </div>

      <div className="mt-4 flex flex-1 flex-col pb-6">
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-brand-navy">
          Enter verification code
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">
          We sent a 6-digit code to:
        </p>
        <p className="mt-1 text-[15px] font-semibold text-brand-navy">{maskedEmail}</p>

        <form className="mt-6 space-y-5" onSubmit={handleVerify} noValidate>
          <div>
            <OtpInput
              value={otp}
              onChange={(next) => {
                setOtp(next);
                if (otpError && !otpExpired) setOtpError(null);
              }}
              disabled={verifying || resending || otpExpired}
              hasError={Boolean(otpError)}
              autoFocus
            />

            {!otpExpired ? (
              <p
                className="mt-3 text-[14px] font-semibold tabular-nums text-brand-navy"
                aria-live="polite"
              >
                Code expires in {formatTimer(otpExpiryRemainingSec)}
              </p>
            ) : (
              <p
                className="mt-3 text-[14px] font-semibold text-status-danger"
                role="status"
                aria-live="polite"
              >
                Code expires in 00:00
              </p>
            )}

            {otpError ? (
              <p className="mt-2 text-[13px] font-medium text-status-danger" role="alert">
                {otpError}
              </p>
            ) : null}

            {otpExpired ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend}
                className="m-press mt-3 text-[14px] font-semibold text-brand-blue disabled:opacity-45"
              >
                {resending ? "Sending..." : "Resend code"}
              </button>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={verifying || otpExpired}
            aria-disabled={verifying || !otpComplete || otpExpired}
            className={`m-press w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60 ${
              (!otpComplete || otpExpired) && !verifying ? "opacity-60" : ""
            }`}
          >
            {verifying ? "Verifying..." : "Verify code"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[14px] text-brand-muted">Didn&apos;t receive the code?</p>
          {resendCooldownSec > 0 && !otpExpired ? (
            <p className="mt-1 text-[14px] font-semibold text-brand-muted">
              Resend code in {formatTimer(resendCooldownSec)}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className="m-press mt-1 text-[14px] font-semibold text-brand-blue disabled:opacity-45"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          )}
          {resendError ? (
            <p className="mt-2 text-[13px] font-medium text-status-danger" role="alert">
              {resendError}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            clearPasswordRecovery();
            router.push(MOBILE_AUTH_ROUTES.forgotPassword);
          }}
          className="m-press mt-8 text-[13px] font-semibold text-brand-muted"
        >
          Use a different email
        </button>
      </div>
    </AuthShell>
  );
}
