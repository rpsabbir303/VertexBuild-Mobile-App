"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { getResendCodeErrorMessage } from "@/lib/mobile/auth";
import { maskEmailForDisplay } from "@/lib/mobile/auth";
import { getVerifyInvitationOtpErrorMessage } from "@/lib/mobile/invitation";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthFormAlert } from "../auth/AuthFormAlert";
import { AuthShell } from "../auth/AuthShell";
import { OtpInput } from "../auth/OtpInput";
import { IconBack } from "../icons";

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function InviteVerifyScreen() {
  const router = useRouter();
  const {
    invitationActivation,
    invitationOtpExpirySec,
    invitationResendCooldownSec,
    verifyInvitationOtp,
    resendInvitationOtp,
    refreshInvitationActivation,
  } = useMobileAuth();

  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const otpExpired = invitationOtpExpirySec <= 0;
  const otpComplete = otp.replace(/\D/g, "").length === 6;

  useEffect(() => {
    refreshInvitationActivation();
  }, [refreshInvitationActivation]);

  useEffect(() => {
    if (!invitationActivation?.verificationRequired) {
      router.replace(MOBILE_AUTH_ROUTES.inviteActivate);
    }
  }, [invitationActivation?.verificationRequired, router]);

  useEffect(() => {
    if (otpExpired) setOtp("");
  }, [otpExpired]);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setResendError(null);
    if (otpExpired) {
      setOtpError(getVerifyInvitationOtpErrorMessage("expired"));
      return;
    }
    if (!otpComplete) {
      setOtpError(getVerifyInvitationOtpErrorMessage("incomplete"));
      return;
    }
    setOtpError(null);
    setVerifying(true);
    const result = await verifyInvitationOtp(otp);
    setVerifying(false);
    if (!result.ok) {
      setOtpError(getVerifyInvitationOtpErrorMessage(result.code));
      if (result.code === "expired") setOtp("");
      return;
    }
    router.push(MOBILE_AUTH_ROUTES.inviteComplete);
  }

  async function handleResend() {
    if (resending) return;
    if (invitationResendCooldownSec > 0 && !otpExpired) return;
    setResendError(null);
    setOtpError(null);
    setResending(true);
    const result = await resendInvitationOtp();
    setResending(false);
    if (!result.ok) {
      setResendError(getResendCodeErrorMessage(result.code));
      return;
    }
    refreshInvitationActivation();
    setOtp("");
  }

  if (!invitationActivation) {
    return (
      <AuthShell>
        <div className="flex min-h-[40vh] items-center justify-center" aria-hidden="true" />
      </AuthShell>
    );
  }

  const canResend = !resending && (otpExpired || invitationResendCooldownSec <= 0);
  const masked = maskEmailForDisplay(invitationActivation.email);

  return (
    <AuthShell>
      <div className="pt-2">
        <Link
          href={MOBILE_AUTH_ROUTES.inviteSetup}
          className="m-press inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
          aria-label="Back"
        >
          <IconBack />
        </Link>
      </div>

      <div className="mt-4 flex flex-1 flex-col pb-6">
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-brand-navy">Verify your account</h1>
        <p className="mt-2 text-[15px] text-brand-muted">Enter the 6-digit code sent to:</p>
        <p className="mt-1 text-[15px] font-semibold text-brand-navy">{masked}</p>

        <form className="mt-6 space-y-5" onSubmit={handleVerify} noValidate>
          <div>
            <OtpInput value={otp} onChange={setOtp} disabled={verifying || resending || otpExpired} hasError={Boolean(otpError)} autoFocus />
            {!otpExpired ? (
              <p className="mt-3 text-[14px] font-semibold tabular-nums text-brand-navy" aria-live="polite">
                Code expires in {formatTimer(invitationOtpExpirySec)}
              </p>
            ) : (
              <p className="mt-3 text-[14px] font-semibold text-status-danger" role="status">
                {getVerifyInvitationOtpErrorMessage("expired")}
              </p>
            )}
            {otpError && !otpExpired ? (
              <p className="mt-2 text-[13px] font-medium text-status-danger" role="alert">
                {otpError}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={verifying || otpExpired || !otpComplete}
            aria-busy={verifying}
            className="m-press w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {verifying ? "Verifying…" : "Verify and continue"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[14px] text-brand-muted">Didn&apos;t receive the code?</p>
          {invitationResendCooldownSec > 0 && !otpExpired ? (
            <p className="mt-1 text-[14px] font-semibold text-brand-muted">
              Resend code in {formatTimer(invitationResendCooldownSec)}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className="m-press mt-1 text-[14px] font-semibold text-brand-blue disabled:opacity-45"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          )}
          {resendError ? (
            <div className="mt-2">
              <AuthFormAlert>{resendError}</AuthFormAlert>
            </div>
          ) : null}
        </div>
      </div>
    </AuthShell>
  );
}
