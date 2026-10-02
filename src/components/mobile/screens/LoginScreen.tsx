"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getLoginErrorMessage } from "@/lib/mobile/auth";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthField } from "../auth/AuthField";
import { AuthShell } from "../auth/AuthShell";
import { IconEye, IconEyeOff } from "../icons";

export function LoginScreen() {
  const router = useRouter();
  const { login } = useMobileAuth();
  const { applyAuthAccount } = useMobileApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    setLoading(true);

    const result = await login(email, password);
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
    router.replace(MOBILE_AUTH_ROUTES.appHome);
  }

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-6">
        <AuthBrandMark />

        <div className="mt-8 text-center">
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-brand-navy">Welcome back</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">
            Sign in to continue to your projects and field workspace.
          </p>
        </div>

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
            className="m-press mt-2 w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

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
