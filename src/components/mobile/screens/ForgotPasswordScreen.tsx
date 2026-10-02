"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getSendCodeErrorMessage, isValidWorkEmail } from "@/lib/mobile/auth";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { AuthField } from "../auth/AuthField";
import { AuthShell } from "../auth/AuthShell";
import { IconBack } from "../icons";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendVerificationCode } = useMobileAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setFormError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(getSendCodeErrorMessage("email_required"));
      return;
    }
    if (!isValidWorkEmail(trimmed)) {
      setEmailError(getSendCodeErrorMessage("email_invalid"));
      return;
    }

    setLoading(true);
    const result = await sendVerificationCode(trimmed);
    setLoading(false);

    if (!result.ok) {
      if (result.code === "email_required" || result.code === "email_invalid") {
        setEmailError(getSendCodeErrorMessage(result.code));
      } else {
        setFormError(getSendCodeErrorMessage("server"));
      }
      return;
    }

    router.push(MOBILE_AUTH_ROUTES.verifyOtp);
  }

  return (
    <AuthShell>
      <div className="pt-2">
        <Link
          href={MOBILE_AUTH_ROUTES.login}
          className="m-press inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
          aria-label="Back to login"
        >
          <IconBack />
        </Link>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-brand-navy">
          Forgot your password?
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">
          Enter your work email and we&apos;ll send you a verification code.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <div
              className="rounded-mobile border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium text-status-danger"
              role="alert"
            >
              {formError}
            </div>
          ) : null}

          <AuthField
            id="forgot-email"
            label="Work email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="m-press w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {loading ? "Sending code..." : "Send code"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
