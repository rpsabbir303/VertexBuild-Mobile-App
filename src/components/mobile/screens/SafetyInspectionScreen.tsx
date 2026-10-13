"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChoiceRow, FieldText } from "@/components/mobile/daily-log/FieldBits";
import { PhotoAttachments } from "@/components/mobile/daily-log/PhotoAttachments";
import {
  countReviewed,
  emptyItemResponse,
  FINDING_SEVERITY_OPTIONS,
  inspectionStatusLabel,
  loadInspectionProgress,
  markInspectionStarted,
  resolveInspectionIdForProject,
  resultLabel,
  resultRequiresFinding,
  resultTone,
  saveInspectionProgress,
  submitInspection,
  validateInspectionForCompletion,
  INSPECTION_RESULT_OPTIONS,
  getInspectionTemplate,
  canRunSafetyInspection,
  type InspectionProgress,
  type SafetyInspectionTemplate,
} from "@/lib/mobile/safetyInspections";
import { mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { SAFETY_ROUTES } from "@/lib/mobile/safety";
import type { FieldPhoto } from "@/lib/mobile/photoEvidence";
import { IconBack, IconChevronRight } from "../icons";
import { PermissionDeniedScreen } from "./PermissionDeniedScreen";
import { StatusBadge } from "../ui/StatusBadge";

type LoadPhase = "loading" | "empty" | "ready" | "success";

type WorkView = "checklist" | "item";

const RESULT_BADGE: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  pass: "success",
  attention: "warning",
  fail: "danger",
  na: "neutral",
};

export function SafetyInspectionScreen() {
  const { user, currentProject, accessibleProjects, isOffline } = useMobileApp();
  const { session } = useMobileAuth();
  const allowed = canRunSafetyInspection(
    user.role,
    accessibleProjects.map((p) => p.id),
    currentProject.id,
  );

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;
  const reporterEmail = session?.email ?? "demo@summitconstruction.com";

  const [loadPhase, setLoadPhase] = useState<LoadPhase>("loading");
  const [template, setTemplate] = useState<SafetyInspectionTemplate | null>(null);
  const [progress, setProgress] = useState<InspectionProgress | null>(null);
  const [workView, setWorkView] = useState<WorkView>("checklist");
  const [itemIndex, setItemIndex] = useState(0);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successReference, setSuccessReference] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const persistRef = useRef(progress);

  const readOnly = progress?.status === "completed";

  const persist = useCallback(
    (next: InspectionProgress) => {
      saveInspectionProgress(next, userKey);
      persistRef.current = next;
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    },
    [userKey],
  );

  useEffect(() => {
    setLoadPhase("loading");
    const timer = window.setTimeout(() => {
      const inspectionId = resolveInspectionIdForProject(currentProject.id);
      if (!inspectionId) {
        setTemplate(null);
        setProgress(null);
        setLoadPhase("empty");
        return;
      }
      const tmpl = getInspectionTemplate(inspectionId);
      const loaded = loadInspectionProgress(inspectionId, userKey);
      if (!tmpl || !loaded) {
        setLoadPhase("empty");
        return;
      }
      setTemplate(tmpl);
      setProgress(loaded);
      setLoadPhase(loaded.status === "completed" && loaded.demoReference ? "success" : "ready");
      if (loaded.status === "completed" && loaded.demoReference) {
        setSuccessReference(loaded.demoReference);
        setSuccessNotice("Previously completed inspection.");
      }
      const firstOpen = tmpl.items.findIndex((item) => !loaded.responses[item.id]?.result);
      setItemIndex(firstOpen >= 0 ? firstOpen : 0);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [currentProject.id, userKey]);

  const stats = useMemo(() => {
    if (!template || !progress) return null;
    return countReviewed(template, progress);
  }, [template, progress]);

  const currentItem = template?.items[itemIndex] ?? null;
  const currentResponse = currentItem && progress ? progress.responses[currentItem.id] ?? emptyItemResponse() : null;

  const photoContext = useMemo(
    () => ({
      projectId: currentProject.id,
      projectName: currentProject.name,
      recordLabel: template?.title ?? "Safety inspection",
      sectionLabel: currentItem?.section ?? "Finding",
    }),
    [currentProject.id, currentProject.name, template?.title, currentItem?.section],
  );

  const patchResponse = useCallback(
    (itemId: string, patch: Partial<ReturnType<typeof emptyItemResponse>>) => {
      if (!progress || !template || readOnly) return;
      let nextProgress = markInspectionStarted(progress);
      const prev = nextProgress.responses[itemId] ?? emptyItemResponse();
      const nextResponse = {
        ...prev,
        ...patch,
        finding: patch.finding ? { ...prev.finding, ...patch.finding } : prev.finding,
      };
      if (patch.result && !resultRequiresFinding(patch.result)) {
        nextResponse.finding = { ...prev.finding, description: prev.finding.description };
      }
      nextProgress = {
        ...nextProgress,
        responses: { ...nextProgress.responses, [itemId]: nextResponse },
      };
      setProgress(nextProgress);
      persist(nextProgress);
      setItemErrors((current) => {
        if (!current[itemId]) return current;
        const next = { ...current };
        delete next[itemId];
        return next;
      });
    },
    [persist, progress, readOnly, template],
  );

  async function handleComplete() {
    if (!template || !progress || submitting || readOnly) return;
    const validation = validateInspectionForCompletion(template, progress);
    setItemErrors(validation.itemErrors);
    setSubmitError(null);
    if (Object.keys(validation.itemErrors).length > 0) {
      const firstBad = template.items.find((item) => validation.itemErrors[item.id]);
      if (firstBad) {
        setItemIndex(template.items.indexOf(firstBad));
        setWorkView("item");
      }
      return;
    }

    setSubmitting(true);
    const result = await submitInspection(template, progress, { reporterEmail, offline: isOffline });
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    const completed: InspectionProgress = {
      ...progress,
      status: "completed",
      completedAt: new Date().toISOString(),
      demoReference: result.reference,
    };
    setProgress(completed);
    persist(completed);
    setSuccessReference(result.reference);
    setSuccessNotice(result.notice);
    setLoadPhase("success");
  }

  if (!allowed) {
    return <PermissionDeniedScreen backHref={SAFETY_ROUTES.home} />;
  }

  if (loadPhase === "loading") {
    return (
      <div className={mobilePageBg}>
        <header className="border-b border-brand-line/50 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="h-6 w-40 animate-pulse rounded bg-brand-soft" />
          <div className="mt-3 h-4 w-56 animate-pulse rounded bg-brand-soft/80" />
        </header>
        <main className="space-y-3 px-4 py-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[14px] bg-brand-soft/70" />
          ))}
        </main>
      </div>
    );
  }

  if (loadPhase === "empty") {
    return (
      <div className={mobilePageBg}>
        <header className="border-b border-brand-line/50 bg-brand-canvas/95 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <Link
              href={SAFETY_ROUTES.home}
              className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
              aria-label="Back to Safety"
            >
              <IconBack />
            </Link>
            <h1 className="text-[17px] font-semibold text-brand-navy">Safety inspection</h1>
          </div>
        </header>
        <main className="px-4 py-8 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))]">
          <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">No inspection available</h2>
          <p className="mt-2 max-w-[36ch] text-[14px] leading-relaxed text-brand-muted">
            There is no active or pending inspection checklist for {currentProject.name}.
          </p>
          <Link
            href={SAFETY_ROUTES.home}
            className="m-press mt-6 inline-flex h-11 items-center rounded-full bg-brand-navy px-5 text-[14px] font-semibold text-white"
          >
            Back to Safety
          </Link>
        </main>
      </div>
    );
  }

  if (loadPhase === "success" && successReference && template) {
    return (
      <div className={mobilePageBg}>
        <main className="px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(24px,env(safe-area-inset-top))]">
          <div className={`${mobileInsetCard} p-5`}>
            <StatusBadge tone="success" label="Inspection complete" />
            <h1 className="mt-3 text-[22px] font-bold tracking-[-0.03em] text-brand-navy">Submitted</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">{successNotice}</p>
            <p className="mt-1 text-[13px] text-brand-muted">{template.title}</p>
            <div className="mt-4 rounded-[12px] bg-brand-soft px-3.5 py-3">
              <p className="text-[12px] font-medium text-brand-muted">Reference</p>
              <p className="mt-0.5 font-mono text-[16px] font-semibold text-brand-navy">{successReference}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoadPhase("ready");
                setWorkView("checklist");
              }}
              className="m-press mt-4 flex h-11 w-full items-center justify-center rounded-full border border-brand-line text-[14px] font-semibold text-brand-navy"
            >
              View checklist (read-only)
            </button>
            <Link
              href={SAFETY_ROUTES.home}
              className="m-press mt-3 flex h-12 w-full items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white"
            >
              Back to Safety
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!template || !progress || !stats) return null;

  const progressPct = stats.total > 0 ? Math.round((stats.reviewed / stats.total) * 100) : 0;

  return (
    <div className={mobilePageBg}>
      <header className="border-b border-brand-line/50 bg-brand-canvas/95 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <Link
            href={SAFETY_ROUTES.home}
            className="m-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
            aria-label="Back to Safety"
          >
            <IconBack />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[17px] font-semibold text-brand-navy">Safety inspection</h1>
              <StatusBadge
                tone={progress.status === "completed" ? "success" : progress.status === "in_progress" ? "warning" : "neutral"}
                label={inspectionStatusLabel(progress.status)}
              />
            </div>
            <p className="truncate text-[13px] font-medium text-brand-navy">{template.title}</p>
            <p className="truncate text-[12px] text-brand-muted">
              {currentProject.name} · {template.areaLabel}
            </p>
          </div>
        </div>

        <div className="mt-3 px-2">
          <div className="flex items-center justify-between text-[12px] font-medium text-brand-muted">
            <span>
              {stats.reviewed} of {stats.total} reviewed
            </span>
            {savedFlash ? <span className="text-status-success">Saved</span> : null}
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-soft">
            <div
              className="h-full rounded-full bg-brand-blue transition-all duration-300"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          {stats.requiredRemaining > 0 ? (
            <p className="mt-1.5 text-[12px] text-brand-muted">{stats.requiredRemaining} required checkpoints remaining</p>
          ) : (
            <p className="mt-1.5 text-[12px] font-medium text-brand-navy">All required checkpoints reviewed</p>
          )}
        </div>

        <div className="mt-3 flex gap-2 px-2">
          <button
            type="button"
            onClick={() => setWorkView("checklist")}
            className={`m-press h-9 rounded-full px-3.5 text-[13px] font-semibold ${
              workView === "checklist" ? "bg-brand-navy text-white" : "border border-brand-line bg-white text-brand-navy"
            }`}
          >
            Checklist
          </button>
          <button
            type="button"
            onClick={() => setWorkView("item")}
            className={`m-press h-9 rounded-full px-3.5 text-[13px] font-semibold ${
              workView === "item" ? "bg-brand-navy text-white" : "border border-brand-line bg-white text-brand-navy"
            }`}
          >
            Current item
          </button>
        </div>
      </header>

      <main className="px-4 py-4 pb-[max(9rem,calc(env(safe-area-inset-bottom)+8rem))]">
        {readOnly ? (
          <p className="mb-4 rounded-[12px] border border-brand-line/60 bg-brand-soft/60 px-3 py-2 text-[13px] text-brand-muted">
            This inspection is complete. Checklist is read-only.
          </p>
        ) : null}

        {submitError ? (
          <div className="mb-4 rounded-[12px] border border-status-danger/30 bg-red-50 px-3 py-2.5" role="alert">
            <p className="text-[14px] font-semibold text-status-danger">Submission failed</p>
            <p className="mt-0.5 text-[13px] text-brand-navy">{submitError}</p>
            <button type="button" onClick={() => void handleComplete()} className="m-press mt-2 text-[13px] font-semibold text-brand-blue">
              Retry submit
            </button>
          </div>
        ) : null}

        {workView === "checklist" ? (
          <ul className={`${mobileInsetCard} divide-y divide-brand-line/60`}>
            {template.items.map((item, index) => {
              const response = progress.responses[item.id] ?? emptyItemResponse();
              const hasFinding = resultRequiresFinding(response.result);
              const err = itemErrors[item.id];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setItemIndex(index);
                      setWorkView("item");
                    }}
                    className="m-press flex w-full items-start gap-3 px-3.5 py-3.5 text-left active:bg-brand-soft/50"
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                        response.result
                          ? "bg-brand-soft text-brand-navy"
                          : item.required
                            ? "border border-brand-line text-brand-muted"
                            : "border border-dashed border-brand-line text-brand-mist"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-mist">{item.section}</span>
                      <span className="mt-0.5 block text-[14px] font-semibold leading-snug text-brand-navy">{item.prompt}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        {response.result ? (
                          <StatusBadge tone={RESULT_BADGE[response.result] ?? "neutral"} label={resultLabel(response.result)} />
                        ) : (
                          <span className="text-[12px] text-brand-muted">Not reviewed</span>
                        )}
                        {hasFinding ? (
                          <span className="text-[12px] font-medium text-[#8A6232]">Finding recorded</span>
                        ) : null}
                        {!item.required ? (
                          <span className="text-[11px] text-brand-mist">Optional</span>
                        ) : null}
                      </span>
                      {err ? (
                        <span className="mt-1 block text-[12px] font-medium text-status-danger">{err}</span>
                      ) : null}
                    </span>
                    <IconChevronRight className="mt-1 h-[18px] w-[18px] shrink-0 text-brand-mist" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {workView === "item" && currentItem && currentResponse ? (
          <div className="space-y-5">
            <div className="overflow-x-auto pb-1">
              <div className="flex gap-1.5" role="tablist" aria-label="Inspection items">
                {template.items.map((item, index) => {
                  const result = progress.responses[item.id]?.result ?? null;
                  const active = index === itemIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setItemIndex(index)}
                      className={`m-press flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center rounded-full px-2.5 text-[12px] font-bold ${
                        active
                          ? "bg-brand-navy text-white"
                          : result
                            ? resultTone(result) === "success"
                              ? "bg-emerald-50 text-emerald-800"
                              : resultTone(result) === "danger"
                                ? "bg-red-50 text-red-700"
                                : resultTone(result) === "warning"
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-brand-soft text-brand-navy"
                            : "border border-brand-line text-brand-muted"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`${mobileInsetCard} p-4`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-mist">{currentItem.section}</p>
              <h2 className="mt-1 text-[17px] font-bold leading-snug tracking-[-0.02em] text-brand-navy">{currentItem.prompt}</h2>
              {!currentItem.required ? (
                <p className="mt-1 text-[12px] text-brand-muted">Optional checkpoint</p>
              ) : null}

              <div className="mt-4">
                <ChoiceRow
                  label="Result"
                  value={currentResponse.result}
                  options={[...INSPECTION_RESULT_OPTIONS]}
                  onChange={(id) => patchResponse(currentItem.id, { result: id })}
                  disabled={readOnly}
                />
              </div>

              <FieldText
                id={`insp-note-${currentItem.id}`}
                label="Notes (optional)"
                value={currentResponse.note}
                onChange={(value) => patchResponse(currentItem.id, { note: value })}
                multiline
                disabled={readOnly}
                placeholder="Context for the reviewer"
              />

              {resultRequiresFinding(currentResponse.result) ? (
                <div className="mt-5 space-y-4 border-t border-brand-line/60 pt-4">
                  <p className="text-[13px] font-semibold text-brand-navy">Finding</p>
                  <FieldText
                    id={`finding-desc-${currentItem.id}`}
                    label="Description"
                    required
                    value={currentResponse.finding.description}
                    onChange={(value) =>
                      patchResponse(currentItem.id, { finding: { ...currentResponse.finding, description: value } })
                    }
                    multiline
                    disabled={readOnly}
                    error={
                      itemErrors[currentItem.id]?.includes("finding description") ||
                      itemErrors[currentItem.id]?.includes("Add a finding")
                        ? itemErrors[currentItem.id]
                        : null
                    }
                    placeholder="What was observed and what needs correction"
                  />
                  <div>
                    <ChoiceRow
                      label="Severity"
                      value={currentResponse.finding.severityId}
                      options={[...FINDING_SEVERITY_OPTIONS]}
                      onChange={(id) =>
                        patchResponse(currentItem.id, { finding: { ...currentResponse.finding, severityId: id } })
                      }
                      disabled={readOnly}
                    />
                    {itemErrors[currentItem.id]?.includes("severity") ? (
                      <p className="mt-1 text-[13px] font-medium text-status-danger" role="alert">
                        {itemErrors[currentItem.id]}
                      </p>
                    ) : null}
                  </div>
                  <FieldText
                    id={`finding-action-${currentItem.id}`}
                    label="Corrective action (optional)"
                    value={currentResponse.finding.correctiveAction}
                    onChange={(value) =>
                      patchResponse(currentItem.id, { finding: { ...currentResponse.finding, correctiveAction: value } })
                    }
                    multiline
                    disabled={readOnly}
                  />
                  <FieldText
                    id={`finding-assignee-${currentItem.id}`}
                    label="Assign follow-up to (optional)"
                    value={currentResponse.finding.assignee}
                    onChange={(value) =>
                      patchResponse(currentItem.id, { finding: { ...currentResponse.finding, assignee: value } })
                    }
                    disabled={readOnly}
                    placeholder="Name or crew"
                  />
                  <PhotoAttachments
                    mode="evidence"
                    photos={currentResponse.finding.evidence}
                    onChange={(photos: FieldPhoto[]) =>
                      patchResponse(currentItem.id, { finding: { ...currentResponse.finding, evidence: photos } })
                    }
                    parentContext={photoContext}
                    locked={readOnly}
                    addLabel="Add finding photo"
                    hint="Document the hazard or condition"
                  />
                </div>
              ) : null}

              {itemErrors[currentItem.id] &&
              (!resultRequiresFinding(currentResponse.result) ||
                itemErrors[currentItem.id]?.includes("photo") ||
                itemErrors[currentItem.id]?.includes("Record a result")) ? (
                <p className="mt-3 text-[13px] font-medium text-status-danger" role="alert">
                  {itemErrors[currentItem.id]}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={itemIndex === 0}
                onClick={() => setItemIndex((i) => Math.max(0, i - 1))}
                className="m-press h-11 rounded-full border border-brand-line px-4 text-[14px] font-semibold text-brand-navy disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={itemIndex >= template.items.length - 1}
                onClick={() => setItemIndex((i) => Math.min(template.items.length - 1, i + 1))}
                className="m-press h-11 rounded-full border border-brand-line px-4 text-[14px] font-semibold text-brand-navy disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        <p className="mt-6 text-[11px] leading-relaxed text-brand-mist">
          Progress saves on this device until synced.
        </p>
      </main>

      {!readOnly ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line/60 bg-brand-canvas/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              disabled={submitting || stats.requiredRemaining > 0}
              onClick={() => void handleComplete()}
              className="m-press flex h-12 w-full items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Complete inspection"}
            </button>
            {stats.requiredRemaining > 0 ? (
              <p className="mt-2 text-center text-[12px] text-brand-muted">
                Finish {stats.requiredRemaining} required {stats.requiredRemaining === 1 ? "item" : "items"} to complete.
              </p>
            ) : null}
            {isOffline ? (
              <p className="mt-1 text-center text-[12px] text-brand-muted">Offline — submission queues on this device.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
