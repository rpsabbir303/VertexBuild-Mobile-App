"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MobileSignaturePad } from "@/components/mobile/ui/MobileSignaturePad";
import {
  TOOLBOX_ACKNOWLEDGEMENT_STATEMENT,
  canAccessToolboxTalks,
  canSignToolboxSession,
  getToolboxSession,
  getUserParticipation,
  loadToolboxSessionState,
  loadToolboxSignature,
  resolveToolboxSessionsForProject,
  submitToolboxSignature,
  type ToolboxSignatureRecord,
} from "@/lib/mobile/toolboxTalks";
import { mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { SAFETY_ROUTES } from "@/lib/mobile/safety";
import { IconBack } from "../icons";
import { PermissionDeniedScreen } from "./PermissionDeniedScreen";
import { StatusBadge } from "../ui/StatusBadge";

type Phase = "loading" | "blocked" | "sign" | "success";

export function SafetyToolboxSignatureScreen() {
  const searchParams = useSearchParams();
  const { user, currentProject, accessibleProjects, isOffline } = useMobileApp();
  const { session } = useMobileAuth();

  const allowed = canAccessToolboxTalks(
    user.role,
    accessibleProjects.map((p) => p.id),
    currentProject.id,
  );

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;
  const reporterEmail = session?.email ?? "demo@summitconstruction.com";

  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState(`${user.firstName} ${user.lastName}`);
  const [statementAccepted, setStatementAccepted] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedRecord, setSavedRecord] = useState<ToolboxSignatureRecord | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const toolboxSession = useMemo(
    () => (sessionId ? getToolboxSession(sessionId) : null),
    [sessionId],
  );

  const onSignatureChange = useCallback((payload: { dataUrl: string | null; hasInk: boolean }) => {
    setSignatureDataUrl(payload.dataUrl);
    setHasInk(payload.hasInk);
    if (formError) setFormError(null);
  }, [formError]);

  useEffect(() => {
    const param = searchParams.get("session");
    const resolved =
      param && getToolboxSession(param)
        ? param
        : resolveToolboxSessionsForProject(currentProject.id)[0]?.id ?? null;

    if (!resolved) {
      setPhase("blocked");
      setBlockMessage("No toolbox talk session is available to sign for this project.");
      return;
    }

    setSessionId(resolved);

    const existing = loadToolboxSignature(resolved, userKey);
    if (existing) {
      setSavedRecord(existing);
      setParticipantName(existing.participantName);
      setPhase("success");
      setSuccessNotice("You already signed this toolbox talk.");
      return;
    }

    const state = loadToolboxSessionState(resolved);
    const participation = state ? getUserParticipation(state, userKey) : null;
    if (participation?.participantName) setParticipantName(participation.participantName);

    const eligible = canSignToolboxSession(resolved, userKey);
    if (!eligible.ok) {
      setPhase("blocked");
      setBlockMessage(eligible.message);
      return;
    }

    setPhase("sign");
  }, [currentProject.id, searchParams, userKey]);

  async function handleSubmit() {
    if (!sessionId || submitting) return;
    setFormError(null);
    setSubmitting(true);
    const result = await submitToolboxSignature({
      sessionId,
      userKey,
      participantName,
      statementAccepted,
      signatureDataUrl: signatureDataUrl ?? "",
      reporterEmail,
      offline: isOffline,
    });
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setSavedRecord(result.record);
    setSuccessNotice(result.notice);
    setPhase("success");
  }

  if (!allowed) {
    return <PermissionDeniedScreen backHref={SAFETY_ROUTES.toolbox} />;
  }

  if (phase === "loading") {
    return (
      <div className={mobilePageBg}>
        <main className="px-4 py-8 pt-[max(24px,env(safe-area-inset-top))]">
          <div className="h-32 animate-pulse rounded-[16px] bg-brand-soft/80" />
        </main>
      </div>
    );
  }

  if (phase === "blocked") {
    return (
      <div className={mobilePageBg}>
        <header className="border-b border-brand-line/50 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <Link
              href={SAFETY_ROUTES.toolbox}
              className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
              aria-label="Back to toolbox talk"
            >
              <IconBack />
            </Link>
            <h1 className="text-[17px] font-semibold text-brand-navy">Toolbox signature</h1>
          </div>
        </header>
        <main className="px-4 py-8 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))]">
          <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">Signature not available</h2>
          <p className="mt-2 max-w-[36ch] text-[14px] leading-relaxed text-brand-muted">{blockMessage}</p>
          <Link
            href={SAFETY_ROUTES.toolbox}
            className="m-press mt-6 inline-flex h-11 items-center rounded-full bg-brand-navy px-5 text-[14px] font-semibold text-white"
          >
            Back to toolbox talk
          </Link>
        </main>
      </div>
    );
  }

  if (phase === "success" && savedRecord && toolboxSession) {
    return (
      <div className={mobilePageBg}>
        <main className="px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(24px,env(safe-area-inset-top))]">
          <div className={`${mobileInsetCard} p-5`}>
            <StatusBadge tone="success" label="Signed" />
            <h1 className="mt-3 text-[22px] font-bold tracking-[-0.03em] text-brand-navy">Signature saved</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">{successNotice}</p>
            <p className="mt-1 text-[13px] font-medium text-brand-navy">{toolboxSession.title}</p>
            <div className="mt-4 rounded-[12px] bg-brand-soft px-3.5 py-3">
              <p className="text-[12px] font-medium text-brand-muted">Reference</p>
              <p className="mt-0.5 font-mono text-[16px] font-semibold text-brand-navy">{savedRecord.demoReference}</p>
            </div>
            <div className="mt-4 overflow-hidden rounded-[12px] border border-brand-line/70 bg-white p-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-mist">Your signature</p>
              <img src={savedRecord.signatureDataUrl} alt="Captured signature" className="mx-auto max-h-24 w-full object-contain" />
            </div>
            <Link
              href={SAFETY_ROUTES.toolbox}
              className="m-press mt-5 flex h-12 w-full items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white"
            >
              Back to toolbox talk
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!toolboxSession || !sessionId) return null;

  return (
    <div className={mobilePageBg}>
      <header className="border-b border-brand-line/50 bg-brand-canvas/95 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <Link
            href={SAFETY_ROUTES.toolbox}
            className="m-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
            aria-label="Back to toolbox talk"
          >
            <IconBack />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-brand-navy">Sign toolbox talk</h1>
            <p className="truncate text-[13px] font-medium text-brand-navy">{toolboxSession.title}</p>
            <p className="truncate text-[12px] text-brand-muted">
              {currentProject.name} · {toolboxSession.locationLabel}
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-5 px-4 py-4 pb-[max(10rem,calc(env(safe-area-inset-bottom)+9rem))]">
        <section className={`${mobileInsetCard} p-4`}>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">Attendee</h2>
          <p className="mt-2 text-[16px] font-semibold text-brand-navy">{participantName}</p>
          <p className="mt-1 text-[13px] text-brand-muted">{toolboxSession.crewLabel}</p>
        </section>

        <section className={`${mobileInsetCard} p-4`}>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">Acknowledgement</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-brand-navy">{TOOLBOX_ACKNOWLEDGEMENT_STATEMENT}</p>
          <label className="mt-4 flex items-start gap-3 rounded-[12px] border border-brand-line/70 bg-brand-soft/40 px-3 py-3">
            <input
              type="checkbox"
              checked={statementAccepted}
              onChange={(event) => {
                setStatementAccepted(event.target.checked);
                setFormError(null);
              }}
              className="mt-1 h-5 w-5 shrink-0 rounded border-brand-line"
            />
            <span className="text-[14px] leading-snug text-brand-navy">I confirm the statement above. *</span>
          </label>
        </section>

        <section className={`${mobileInsetCard} p-4`}>
          <MobileSignaturePad onChange={onSignatureChange} disabled={submitting} />
          {hasInk && signatureDataUrl ? (
            <div className="mt-4 border-t border-brand-line/60 pt-4">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-muted">Preview</p>
              <img
                src={signatureDataUrl}
                alt="Signature preview"
                className="mt-2 max-h-20 w-full rounded-[8px] border border-brand-line/60 bg-white object-contain"
              />
            </div>
          ) : null}
        </section>

        {formError ? (
          <p className="text-[13px] font-medium text-status-danger" role="alert">
            {formError}
          </p>
        ) : null}

        <p className="text-[11px] leading-relaxed text-brand-mist">
          Signatures stay on this device until synced.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line/60 bg-brand-canvas/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleSubmit()}
          className="m-press mx-auto flex h-12 w-full max-w-lg items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit signature"}
        </button>
      </div>
    </div>
  );
}
