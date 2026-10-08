"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MOBILE_AUTH_ROUTES } from "@/lib/mobile/authRoutes";
import {
  beginSsoTransaction,
  discoverSsoOrganizations,
  type SsoOrganization,
} from "@/lib/mobile/enterpriseSso";
import { AuthBrandMark } from "../auth/AuthBrandMark";
import { AuthField } from "../auth/AuthField";
import { AuthFormAlert } from "../auth/AuthFormAlert";
import { AuthShell } from "../auth/AuthShell";

export function SsoDiscoverScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<SsoOrganization[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function discover(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOrganizations(null);
    setStatus("Finding your organization…");
    setLoading(true);
    const result = await discoverSsoOrganizations(email);
    setLoading(false);
    setStatus(null);
    if (!result.ok) {
      if (result.code === "not_found") {
        setError("We couldn't find an organization for that work email.");
      } else if (result.code === "network") {
        setError("Check your connection and try again.");
      } else if (result.code === "email_invalid" || result.code === "email_required") {
        setError("Enter your work email.");
      } else {
        setError("Unable to look up your organization.");
      }
      return;
    }
    if (result.organizations.length === 1) {
      await continueWith(result.organizations[0]!);
      return;
    }
    setOrganizations(result.organizations);
    setSelectedId(result.organizations[0]?.id ?? null);
  }

  async function continueWith(organization: SsoOrganization) {
    setError(null);
    setStatus("Connecting to your organization's sign-in…");
    setLoading(true);
    const started = await beginSsoTransaction({ email, organization });
    setLoading(false);
    setStatus(null);
    if (!started.ok) {
      router.push(`${MOBILE_AUTH_ROUTES.ssoResult}?reason=${started.code}`);
      return;
    }
    router.push(started.authorizePath);
  }

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col justify-center py-6">
        <AuthBrandMark />
        <h1 className="mt-8 text-[24px] font-bold tracking-[-0.03em] text-brand-navy">Enterprise sign in</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">
          Continue with your work account. VertexBuild never asks for your organization password here.
        </p>

        {status ? (
          <p className="mt-4 text-[13px] font-medium text-brand-navy" role="status">
            {status}
          </p>
        ) : null}
        {error ? (
          <div className="mt-4">
            <AuthFormAlert>{error}</AuthFormAlert>
          </div>
        ) : null}

        {!organizations ? (
          <form className="mt-6 space-y-4" onSubmit={(e) => void discover(e)} noValidate>
            <AuthField
              id="sso-email"
              label="Work email"
              type="email"
              autoComplete="username"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="m-press w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white shadow-soft disabled:opacity-60"
            >
              {loading ? "Please wait…" : "Continue"}
            </button>
          </form>
        ) : (
          <div className="mt-6">
            <p className="text-[13px] font-semibold text-brand-navy">Select organization</p>
            <ul className="mt-3 space-y-2">
              {organizations.map((org) => (
                <li key={org.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(org.id)}
                    className={`m-press w-full rounded-mobile border px-3.5 py-3 text-left text-[15px] font-semibold ${
                      selectedId === org.id
                        ? "border-brand-blue bg-brand-softblue text-brand-navy"
                        : "border-brand-line bg-white text-brand-navy"
                    }`}
                  >
                    {org.name}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={loading || !selectedId}
              onClick={() => {
                const org = organizations.find((item) => item.id === selectedId);
                if (org) void continueWith(org);
              }}
              className="m-press mt-4 w-full rounded-mobile bg-brand-blue py-3.5 text-[16px] font-semibold text-white disabled:opacity-60"
            >
              Continue
            </button>
          </div>
        )}

        <Link
          href={MOBILE_AUTH_ROUTES.login}
          className="m-press mt-6 block text-center text-[14px] font-semibold text-brand-blue"
        >
          Use password login
        </Link>
      </div>
    </AuthShell>
  );
}
