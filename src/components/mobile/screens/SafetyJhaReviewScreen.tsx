"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FieldText } from "@/components/mobile/daily-log/FieldBits";
import {
  JHA_ACKNOWLEDGEMENT_STATEMENT,
  allStepsReviewed,
  canAccessJhaDocuments,
  countStepReview,
  documentStatusForUser,
  getJhaDocument,
  jhaStatusLabel,
  loadJhaAcknowledgement,
  loadJhaReviewProgress,
  resolveJhaDocumentsForProject,
  saveJhaReviewProgress,
  submitJhaAcknowledgement,
  type JhaDocument,
  type JhaReviewProgress,
} from "@/lib/mobile/jhaDocuments";
import { mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { SAFETY_ROUTES } from "@/lib/mobile/safety";
import { IconBack, IconChevronDown } from "../icons";
import { PermissionDeniedScreen } from "./PermissionDeniedScreen";
import { StatusBadge } from "../ui/StatusBadge";

type LoadPhase = "loading" | "empty" | "ready" | "success";
type View = "overview" | "steps" | "acknowledge";

export function SafetyJhaReviewScreen() {
  const { user, currentProject, accessibleProjects, isOffline } = useMobileApp();
  const { session } = useMobileAuth();
  const allowed = canAccessJhaDocuments(
    user.role,
    accessibleProjects.map((p) => p.id),
    currentProject.id,
  );

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;
  const reporterEmail = session?.email ?? "demo@summitconstruction.com";

  const [loadPhase, setLoadPhase] = useState<LoadPhase>("loading");
  const [documents, setDocuments] = useState<JhaDocument[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<View>("overview");
  const [progress, setProgress] = useState<JhaReviewProgress | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState(`${user.firstName} ${user.lastName}`);
  const [statementAccepted, setStatementAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [successReference, setSuccessReference] = useState<string | null>(null);
  const [viewingAcknowledged, setViewingAcknowledged] = useState(false);

  const activeDoc = useMemo(() => documents.find((d) => d.id === activeId) ?? null, [documents, activeId]);

  const docStatus = activeDoc ? documentStatusForUser(activeDoc, userKey) : null;
  const readOnly = docStatus?.status === "acknowledged";

  const stepStats = useMemo(() => {
    if (!activeDoc || !progress) return null;
    return countStepReview(activeDoc, progress);
  }, [activeDoc, progress]);

  const toggleStepReviewed = useCallback(
    (stepId: string, reviewed: boolean) => {
      if (!progress || !activeDoc || readOnly) return;
      const set = new Set(progress.reviewedStepIds);
      if (reviewed) set.add(stepId);
      else set.delete(stepId);
      const next: JhaReviewProgress = { ...progress, reviewedStepIds: Array.from(set) };
      setProgress(next);
      saveJhaReviewProgress(next);
      setFormError(null);
    },
    [activeDoc, progress, readOnly],
  );

  useEffect(() => {
    setLoadPhase("loading");
    const timer = window.setTimeout(() => {
      const list = resolveJhaDocumentsForProject(currentProject.id);
      if (list.length === 0) {
        setDocuments([]);
        setActiveId(null);
        setLoadPhase("empty");
        return;
      }
      setDocuments(list);
      const id = list[0].id;
      setActiveId(id);
      const ack = loadJhaAcknowledgement(id, userKey);
      if (ack) {
        setSuccessReference(ack.demoReference);
        setSuccessNotice("Previously acknowledged on this device.");
        setLoadPhase("success");
      } else {
        setProgress(loadJhaReviewProgress(id, userKey));
        setLoadPhase("ready");
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [currentProject.id, userKey]);

  async function handleSubmitAck() {
    if (!activeId || submitting || readOnly) return;
    setFormError(null);
    setSubmitting(true);
    const result = await submitJhaAcknowledgement({
      documentId: activeId,
      userKey,
      participantName,
      statementAccepted,
      reporterEmail,
      offline: isOffline,
    });
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.message);
      if (result.code === "validation") setView("acknowledge");
      return;
    }
    setSuccessReference(result.record.demoReference);
    setSuccessNotice(result.notice);
    setViewingAcknowledged(false);
    setLoadPhase("success");
  }

  if (!allowed) {
    return <PermissionDeniedScreen backHref={SAFETY_ROUTES.home} />;
  }

  if (loadPhase === "loading") {
    return (
      <div className={mobilePageBg}>
        <main className="space-y-3 px-4 py-8 pt-[max(24px,env(safe-area-inset-top))]">
          <div className="h-28 animate-pulse rounded-[16px] bg-brand-soft/80" />
          <div className="h-40 animate-pulse rounded-[16px] bg-brand-soft/60" />
        </main>
      </div>
    );
  }

  if (loadPhase === "empty") {
    return (
      <div className={mobilePageBg}>
        <header className="border-b border-brand-line/50 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <Link href={SAFETY_ROUTES.home} className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft" aria-label="Back to Safety">
              <IconBack />
            </Link>
            <h1 className="text-[17px] font-semibold text-brand-navy">JHA / JSA</h1>
          </div>
        </header>
        <main className="px-4 py-8 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))]">
          <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">No JHA/JSA available</h2>
          <p className="mt-2 max-w-[36ch] text-[14px] leading-relaxed text-brand-muted">
            No job hazard analysis is assigned to {currentProject.name}.
          </p>
          <Link href={SAFETY_ROUTES.home} className="m-press mt-6 inline-flex h-11 items-center rounded-full bg-brand-navy px-5 text-[14px] font-semibold text-white">
            Back to Safety
          </Link>
        </main>
      </div>
    );
  }

  if (loadPhase === "success" && !viewingAcknowledged && successReference && activeDoc) {
    return (
      <div className={mobilePageBg}>
        <main className="px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(24px,env(safe-area-inset-top))]">
          <div className={`${mobileInsetCard} p-5`}>
            <StatusBadge tone="success" label="Acknowledged" />
            <h1 className="mt-3 text-[22px] font-bold tracking-[-0.03em] text-brand-navy">JHA/JSA on file</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">{successNotice}</p>
            <p className="mt-1 text-[13px] font-medium text-brand-navy">{activeDoc.title}</p>
            <div className="mt-4 rounded-[12px] bg-brand-soft px-3.5 py-3">
              <p className="text-[12px] font-medium text-brand-muted">Reference</p>
              <p className="mt-0.5 font-mono text-[16px] font-semibold text-brand-navy">{successReference}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setViewingAcknowledged(true);
                setProgress(loadJhaReviewProgress(activeDoc.id, userKey));
                setLoadPhase("ready");
                setView("overview");
              }}
              className="m-press mt-4 flex h-11 w-full items-center justify-center rounded-full border border-brand-line text-[14px] font-semibold text-brand-navy"
            >
              View document (read-only)
            </button>
            <Link href={SAFETY_ROUTES.home} className="m-press mt-3 flex h-12 w-full items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white">
              Back to Safety
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!activeDoc || !progress || !stepStats || !docStatus) return null;

  const readyToAck = allStepsReviewed(activeDoc, progress);

  return (
    <div className={mobilePageBg}>
      <header className="border-b border-brand-line/50 bg-brand-canvas/95 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <Link href={SAFETY_ROUTES.home} className="m-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft" aria-label="Back to Safety">
            <IconBack />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[17px] font-semibold text-brand-navy">JHA / JSA</h1>
              <StatusBadge tone={docStatus.status === "acknowledged" ? "success" : "warning"} label={jhaStatusLabel(docStatus.status)} />
            </div>
            <p className="truncate text-[13px] font-medium text-brand-navy">{activeDoc.title}</p>
            <p className="truncate text-[12px] text-brand-muted">
              {currentProject.name} · {activeDoc.locationLabel}
            </p>
          </div>
        </div>

        <div className="mt-3 px-2">
          <p className="text-[12px] font-medium text-brand-muted">
            {stepStats.reviewed} of {stepStats.total} steps reviewed
            {!readyToAck ? " · review all steps to acknowledge" : " · ready to acknowledge"}
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-soft">
            <div
              className="h-full rounded-full bg-brand-blue transition-all"
              style={{ width: `${stepStats.total ? Math.round((stepStats.reviewed / stepStats.total) * 100) : 0}%` }}
              role="progressbar"
              aria-valuenow={stepStats.reviewed}
              aria-valuemin={0}
              aria-valuemax={stepStats.total}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2 px-2">
          {(["overview", "steps", "acknowledge"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setView(tab)}
              className={`m-press h-9 rounded-full px-3 text-[12px] font-semibold capitalize ${
                view === tab ? "bg-brand-navy text-white" : "border border-brand-line bg-white text-brand-navy"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-4 px-4 py-4 pb-[max(10rem,calc(env(safe-area-inset-bottom)+9rem))]">
        {readOnly ? (
          <p className="rounded-[12px] border border-brand-line/60 bg-brand-soft/50 px-3 py-2.5 text-[13px] text-brand-muted">
            Acknowledged — document is read-only.
          </p>
        ) : null}

        {view === "overview" ? (
          <section className={`${mobileInsetCard} space-y-3 p-4`}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">Document</h2>
            <p className="text-[15px] font-semibold text-brand-navy">{activeDoc.activitySummary}</p>
            <dl className="grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <dt className="text-brand-muted">Version</dt>
                <dd className="font-medium text-brand-navy">{activeDoc.versionLabel}</dd>
              </div>
              <div>
                <dt className="text-brand-muted">Effective</dt>
                <dd className="font-medium text-brand-navy">{activeDoc.effectiveLabel}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-brand-muted">Prepared by</dt>
                <dd className="font-medium text-brand-navy">{activeDoc.preparedBy}</dd>
              </div>
            </dl>
            <p className="text-[13px] leading-relaxed text-brand-muted">
              Review each work step, hazards, and controls on the Steps tab before acknowledging.
            </p>
          </section>
        ) : null}

        {view === "steps" ? (
          <ul className="space-y-3">
            {activeDoc.steps.map((step, index) => {
              const reviewed = progress.reviewedStepIds.includes(step.id);
              const expanded = expandedStep === step.id;
              return (
                <li key={step.id} className={mobileInsetCard}>
                  <button
                    type="button"
                    onClick={() => setExpandedStep(expanded ? null : step.id)}
                    className="m-press flex w-full items-start gap-3 px-3.5 py-3.5 text-left"
                    aria-expanded={expanded}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-bold text-brand-navy">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-brand-navy">{step.activity}</span>
                      <span className="mt-1 inline-flex items-center gap-2">
                        <StatusBadge tone={reviewed ? "success" : "neutral"} label={reviewed ? "Reviewed" : "Not reviewed"} />
                      </span>
                    </span>
                    <IconChevronDown className={`h-5 w-5 shrink-0 text-brand-mist transition ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded ? (
                    <div className="border-t border-brand-line/60 px-3.5 pb-3.5 pt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-mist">Hazards</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-[14px] text-brand-navy">
                        {step.hazards.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-brand-mist">Controls</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-[14px] text-brand-navy">
                        {step.controls.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                      {!readOnly ? (
                        <label className="mt-4 flex items-start gap-3 rounded-[12px] border border-brand-line/70 bg-brand-soft/30 px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={reviewed}
                            onChange={(event) => toggleStepReviewed(step.id, event.target.checked)}
                            className="mt-0.5 h-5 w-5 shrink-0 rounded border-brand-line"
                          />
                          <span className="text-[14px] text-brand-navy">I reviewed this step</span>
                        </label>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {view === "acknowledge" ? (
          <section className={`${mobileInsetCard} space-y-4 p-4`}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">Field acknowledgement</h2>
            <p className="text-[14px] leading-relaxed text-brand-navy">{JHA_ACKNOWLEDGEMENT_STATEMENT}</p>
            <FieldText id="jha-name" label="Your name" required value={participantName} onChange={setParticipantName} disabled={readOnly} />
            <label className="flex items-start gap-3 rounded-[12px] border border-brand-line/70 bg-brand-soft/40 px-3 py-3">
              <input
                type="checkbox"
                checked={statementAccepted}
                disabled={readOnly}
                onChange={(event) => {
                  setStatementAccepted(event.target.checked);
                  setFormError(null);
                }}
                className="mt-1 h-5 w-5 shrink-0 rounded border-brand-line"
              />
              <span className="text-[14px] leading-snug text-brand-navy">I confirm the statement above. *</span>
            </label>
            {!readyToAck ? (
              <p className="text-[13px] font-medium text-[#8A6232]" role="status">
                Review all {stepStats.total} work steps before submitting.
              </p>
            ) : null}
            {formError ? (
              <p className="text-[13px] font-medium text-status-danger" role="alert">
                {formError}
              </p>
            ) : null}
          </section>
        ) : null}

        <p className="text-[11px] leading-relaxed text-brand-mist">
          JHA content and acknowledgements are saved on this device until synced.
        </p>
      </main>

      {!readOnly && view === "acknowledge" ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line/60 bg-brand-canvas/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
          <button
            type="button"
            disabled={submitting || !readyToAck}
            onClick={() => void handleSubmitAck()}
            className="m-press mx-auto flex h-12 w-full max-w-lg items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit acknowledgement"}
          </button>
          {isOffline ? <p className="mx-auto mt-2 max-w-lg text-center text-[12px] text-brand-muted">Offline — queues on this device.</p> : null}
        </div>
      ) : null}

      {!readOnly && view !== "acknowledge" && readyToAck ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line/60 bg-brand-canvas/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setView("acknowledge")}
            className="m-press mx-auto flex h-12 w-full max-w-lg items-center justify-center rounded-full bg-brand-navy text-[15px] font-semibold text-white"
          >
            Continue to acknowledgement
          </button>
        </div>
      ) : null}
    </div>
  );
}
