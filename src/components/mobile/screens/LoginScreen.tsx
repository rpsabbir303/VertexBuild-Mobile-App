"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { getLoginErrorMessage, isValidWorkEmail } from "@/lib/mobile/auth";
import { AuthFormAlert } from "../auth/AuthFormAlert";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { routeAfterPrimaryLogin } from "@/lib/mobile/postLoginNavigation";
import { consumeSessionReturnPath } from "@/lib/mobile/sessionSecurity";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthField } from "../auth/AuthField";
import { AuthShell } from "../auth/AuthShell";
import { IconEye, IconEyeOff } from "../icons";

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const continueInvitation = searchParams.get("continue") === "invitation";
  const signedOut = searchParams.get("signedOut") === "1";
  const signedOutOffline = searchParams.get("offline") === "1";
  const { login, authStatus, invitationActivation } = useMobileAuth();
  const { applyAuthAccount } = useMobileApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (invitationActivation?.email && !email) {
      setEmail(invitationActivation.email);
    }
  }, [invitationActivation?.email, email]);

  useEffect(() => {
    if (authStatus === "mfa_pending") {
      router.replace(MOBILE_AUTH_ROUTES.mfa);
      return;
    }
    if (authStatus === "authenticated" && continueInvitation) {
      router.replace(MOBILE_AUTH_ROUTES.inviteComplete);
    }
  }, [authStatus, continueInvitation, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError(getLoginErrorMessage("email_required"));
      return;
    }
    if (!isValidWorkEmail(trimmedEmail)) {
      setEmailError(getLoginErrorMessage("email_invalid"));
      return;
    }
    if (!password) {
      setPasswordError(getLoginErrorMessage("password_required"));
      return;
    }

    setLoading(true);
    const result = await login(trimmedEmail, password);
    setLoading(false);

    if (!result.ok) {
      const message = getLoginErrorMessage(result.code);
      if (result.code === "email_required" || result.code === "email_invalid") {
        setEmailError(message);
      } else if (result.code === "password_required") {
        setPasswordError(message);
      } else {
        setFormError(message);
      }
      return;
    }

    applyAuthAccount(result.account);
    routeAfterPrimaryLogin(router, result, () => {
      if (continueInvitation && invitationActivation) {
        router.replace(MOBILE_AUTH_ROUTES.inviteComplete);
        return;
      }
      const returnPath = consumeSessionReturnPath();
      router.replace(returnPath ?? MOBILE_AUTH_ROUTES.appHome);
    });
  }

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-6">
        <AuthBrandMark />

        <div className="mt-8 text-center">
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-brand-navy">Welcome back</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">
            {continueInvitation
              ? "Sign in to accept your VertexBuild invitation."
              : "Sign in to continue to your projects and field workspace."}
          </p>
        </div>

        {signedOut ? (
          <p
            className="mt-6 rounded-mobile border border-brand-line/60 bg-brand-soft/40 px-3.5 py-3 text-[13px] leading-relaxed text-brand-navy"
            role="status"
          >
            {signedOutOffline
              ? "You're signed out on this device. Sign in again when you're ready."
              : "You've been signed out. Sign in again to continue."}
          </p>
        ) : null}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
          {continueInvitation ? (
            <p className="rounded-mobile border border-brand-line/60 bg-white/90 px-3.5 py-2.5 text-[13px] text-brand-navy">
              Complete invitation activation after sign-in.
            </p>
          ) : null}
          {formError ? <AuthFormAlert>{formError}</AuthFormAlert> : null}

          <AuthField
            id="login-email"
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

          <AuthField
            id="login-password"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter password"
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

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="m-press mt-2 w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-brand-line" />
          <span className="text-[12px] font-medium uppercase tracking-wide text-brand-mist">or</span>
          <span className="h-px flex-1 bg-brand-line" />
        </div>
        <Link
          href={MOBILE_AUTH_ROUTES.sso}
          className="m-press mt-4 block w-full rounded-mobile border border-brand-line bg-white py-3.5 text-center text-[15px] font-semibold text-brand-navy"
        >
          Continue with Enterprise SSO
        </Link>

        <p className="mt-6 text-center">
          <Link
            href={MOBILE_AUTH_ROUTES.forgotPassword}
            className="text-[14px] font-semibold text-brand-blue"
          >
            Forgot password?
          </Link>
        </p>
      </div>

    </AuthShell>
  );
}
