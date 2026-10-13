"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChoiceRow, FieldText } from "@/components/mobile/daily-log/FieldBits";
import { PhotoAttachments } from "@/components/mobile/daily-log/PhotoAttachments";
import {
  clearIncidentDraft,
  defaultIncidentForm,
  INCIDENT_CATEGORIES,
  INCIDENT_SEVERITIES,
  INJURY_SEVERITIES,
  injurySeverityLabel,
  incidentCategoryLabel,
  incidentSeverityLabel,
  loadIncidentDraft,
  saveIncidentDraft,
  submitIncidentReport,
  validateIncidentForm,
  canReportIncident,
  type IncidentFieldErrors,
  type IncidentFormValues,
} from "@/lib/mobile/incidents";
import { mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { SAFETY_ROUTES } from "@/lib/mobile/safety";
import type { FieldPhoto } from "@/lib/mobile/photoEvidence";
import { IconBack } from "../icons";
import { PermissionDeniedScreen } from "./PermissionDeniedScreen";

type Phase = "form" | "success";

function formFromDraft(draft: ReturnType<typeof loadIncidentDraft>): IncidentFormValues {
  if (!draft) return defaultIncidentForm();
  return {
    categoryId: draft.categoryId,
    occurredDate: draft.occurredDate,
    occurredTime: draft.occurredTime,
    siteLocation: draft.siteLocation,
    title: draft.title,
    description: draft.description,
    peopleInvolved: draft.peopleInvolved,
    severityId: draft.severityId,
    injurySeverityId: draft.injurySeverityId,
    immediateActions: draft.immediateActions,
    evidence: draft.evidence.map((photo) => ({ ...photo })),
  };
}

export function SafetyIncidentCaptureScreen() {
  const { user, currentProject, accessibleProjects, isOffline } = useMobileApp();
  const { session } = useMobileAuth();
  const allowed = canReportIncident(
    user.role,
    accessibleProjects.map((p) => p.id),
    currentProject.id,
  );

  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<IncidentFormValues>(() => defaultIncidentForm());
  const [errors, setErrors] = useState<IncidentFieldErrors>({});
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successReference, setSuccessReference] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const userId = session?.email ?? `${user.firstName}-${user.lastName}`;
  const reporterEmail = session?.email ?? "demo@summitconstruction.com";

  useEffect(() => {
    const draft = loadIncidentDraft(currentProject.id, userId);
    if (draft) {
      setForm(formFromDraft(draft));
      setRestoredDraft(true);
    }
  }, [currentProject.id, userId]);

  const photoContext = useMemo(
    () => ({
      projectId: currentProject.id,
      projectName: currentProject.name,
      recordLabel: "Safety incident",
      sectionLabel: "Evidence",
    }),
    [currentProject.id, currentProject.name],
  );

  const patch = useCallback(<K extends keyof IncidentFormValues>(key: K, value: IncidentFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as keyof IncidentFieldErrors]) return current;
      const next = { ...current };
      delete next[key as keyof IncidentFieldErrors];
      return next;
    });
  }, []);

  function handleSaveDraft() {
    saveIncidentDraft(currentProject.id, userId, form);
    setDraftNotice("Draft saved on this device only.");
    window.setTimeout(() => setDraftNotice(null), 4000);
  }

  async function handleSubmit() {
    if (submitting) return;
    const nextErrors = validateIncidentForm(form);
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await submitIncidentReport({
      ...form,
      projectId: currentProject.id,
      projectName: currentProject.name,
      reporterEmail,
      reporterName: `${user.firstName} ${user.lastName}`,
      offline: isOffline,
    });
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    clearIncidentDraft(currentProject.id, userId);
    setSuccessReference(result.reference);
    setSuccessNotice(result.notice);
    setPhase("success");
  }

  if (!allowed) {
    return <PermissionDeniedScreen backHref={SAFETY_ROUTES.home} />;
  }

  if (phase === "success" && successReference) {
    return (
      <div className={mobilePageBg}>
        <main className="px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(24px,env(safe-area-inset-top))]">
          <div className={`${mobileInsetCard} p-5`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-status-success">Report received</p>
            <h1 className="mt-2 text-[22px] font-bold tracking-[-0.03em] text-brand-navy">Incident submitted</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">{successNotice}</p>
            <div className="mt-4 rounded-[12px] bg-brand-soft px-3.5 py-3">
              <p className="text-[12px] font-medium text-brand-muted">Reference</p>
              <p className="mt-0.5 font-mono text-[16px] font-semibold text-brand-navy">{successReference}</p>
            </div>
            <Link
              href={SAFETY_ROUTES.home}
              className="m-press mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white"
            >
              Back to Safety
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={mobilePageBg}>
      <header className="border-b border-brand-line/50 bg-brand-canvas/95 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Link
            href={SAFETY_ROUTES.home}
            className="m-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
            aria-label="Back to Safety"
          >
            <IconBack />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-semibold text-brand-navy">Report an Incident</h1>
            <p className="truncate text-[12px] text-brand-muted">{currentProject.name}</p>
          </div>
        </div>
        <p className="mt-2 px-2 text-[13px] leading-relaxed text-brand-muted">
          Capture what happened on site, required details, and photo evidence. Required fields are marked with *.
        </p>
      </header>

      <main className="px-4 py-4 pb-[max(9rem,calc(env(safe-area-inset-bottom)+8rem))]">
        {restoredDraft ? (
          <p className="mb-4 rounded-[12px] border border-brand-blue/25 bg-brand-softblue/40 px-3 py-2.5 text-[13px] text-brand-navy" role="status">
            Restored your saved draft for this project.
          </p>
        ) : null}

        {draftNotice ? (
          <p className="mb-4 text-[13px] font-medium text-status-success" role="status">
            {draftNotice}
          </p>
        ) : null}

        {submitError ? (
          <div className="mb-4 rounded-[12px] border border-status-danger/30 bg-red-50 px-3 py-2.5" role="alert">
            <p className="text-[14px] font-semibold text-status-danger">Submission failed</p>
            <p className="mt-0.5 text-[13px] text-brand-navy">{submitError}</p>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              className="m-press mt-2 text-[13px] font-semibold text-brand-blue"
            >
              Retry submit
            </button>
          </div>
        ) : null}

        <section className="space-y-5" aria-labelledby="incident-details-heading">
          <h2 id="incident-details-heading" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
            Incident details
          </h2>

          <div>
            <ChoiceRow
              label="Type *"
              value={form.categoryId}
              options={[...INCIDENT_CATEGORIES]}
              onChange={(id) => {
                patch("categoryId", id);
                if (id !== "injury") patch("injurySeverityId", null);
              }}
            />
            {errors.categoryId ? (
              <p className="mt-1 text-[13px] font-medium text-status-danger" role="alert">
                {errors.categoryId}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldText
              id="incident-date"
              label="Date"
              required
              type="date"
              value={form.occurredDate}
              onChange={(value) => patch("occurredDate", value)}
              error={errors.occurredDate}
            />
            <FieldText
              id="incident-time"
              label="Time"
              required
              type="time"
              value={form.occurredTime}
              onChange={(value) => patch("occurredTime", value)}
              error={errors.occurredTime}
            />
          </div>

          <FieldText
            id="incident-site-location"
            label="Location on site"
            value={form.siteLocation}
            onChange={(value) => patch("siteLocation", value)}
            placeholder="Grid C · Level 2 east"
          />

          <FieldText
            id="incident-title"
            label="Short summary"
            required
            value={form.title}
            onChange={(value) => patch("title", value)}
            placeholder="Brief headline for the report"
            error={errors.title}
          />

          <FieldText
            id="incident-description"
            label="What happened"
            required
            multiline
            value={form.description}
            onChange={(value) => patch("description", value)}
            placeholder="Describe the incident, hazards, and conditions"
            error={errors.description}
          />

          <FieldText
            id="incident-people"
            label="People involved (optional)"
            value={form.peopleInvolved}
            onChange={(value) => patch("peopleInvolved", value)}
            placeholder="Names or crew, if known"
          />

          <div>
            <ChoiceRow
              label="Overall severity *"
              value={form.severityId}
              options={[...INCIDENT_SEVERITIES]}
              onChange={(id) => patch("severityId", id)}
            />
            {errors.severityId ? (
              <p className="mt-1 text-[13px] font-medium text-status-danger" role="alert">
                {errors.severityId}
              </p>
            ) : null}
          </div>

          {form.categoryId === "injury" ? (
            <div>
              <ChoiceRow
                label="Injury severity *"
                value={form.injurySeverityId}
                options={[...INJURY_SEVERITIES]}
                onChange={(id) => patch("injurySeverityId", id)}
              />
              {errors.injurySeverityId ? (
                <p className="mt-1 text-[13px] font-medium text-status-danger" role="alert">
                  {errors.injurySeverityId}
                </p>
              ) : null}
            </div>
          ) : null}

          <FieldText
            id="incident-actions"
            label="Immediate actions taken (optional)"
            multiline
            value={form.immediateActions}
            onChange={(value) => patch("immediateActions", value)}
            placeholder="Area secured, supervisor notified, etc."
          />
        </section>

        <section className="mt-8" aria-labelledby="incident-evidence-heading">
          <h2 id="incident-evidence-heading" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
            Evidence (optional)
          </h2>
          <p className="mt-1 text-[12px] text-brand-muted">Photos upload when you are online.</p>
          <div className="mt-3">
            <PhotoAttachments
              mode="evidence"
              photos={form.evidence}
              onChange={(photos: FieldPhoto[]) => patch("evidence", photos)}
              parentContext={photoContext}
              addLabel="Add photo evidence"
              hint="Capture conditions, injuries, or equipment"
            />
          </div>
          {errors.evidence ? (
            <p className="mt-1 text-[13px] font-medium text-status-danger" role="alert">
              {errors.evidence}
            </p>
          ) : null}
        </section>

        {(form.title || form.categoryId) && (
          <section className={`mt-8 ${mobileInsetCard} overflow-hidden`} aria-label="Summary preview">
            <p className="border-b border-brand-line/60 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-brand-mist">
              Quick review
            </p>
            {form.categoryId ? (
              <ReviewRow label="Type" value={incidentCategoryLabel(form.categoryId)} />
            ) : null}
            {form.severityId ? (
              <ReviewRow label="Severity" value={incidentSeverityLabel(form.severityId)} />
            ) : null}
            {form.categoryId === "injury" && form.injurySeverityId ? (
              <ReviewRow label="Injury" value={injurySeverityLabel(form.injurySeverityId)} />
            ) : null}
            {form.title ? <ReviewRow label="Summary" value={form.title} /> : null}
            {form.evidence.length > 0 ? (
              <ReviewRow label="Photos" value={`${form.evidence.length} attached`} />
            ) : null}
          </section>
        )}

        <p className="mt-6 text-[11px] leading-relaxed text-brand-mist">
          Submissions are saved on this device until synced.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line/60 bg-brand-canvas/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-end gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={handleSaveDraft}
            className="m-press h-12 rounded-full border border-brand-line bg-white px-4 text-[14px] font-semibold text-brand-navy disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="m-press flex h-12 min-w-[148px] items-center justify-center rounded-full bg-brand-blue px-5 text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit incident"}
          </button>
        </div>
        {isOffline ? (
          <p className="mx-auto mt-2 max-w-lg text-[12px] text-brand-muted">Offline — report will queue on this device.</p>
        ) : null}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="border-b border-brand-line/70 px-3.5 py-3 last:border-b-0">
      <p className="text-[12px] text-brand-muted">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold leading-snug text-brand-navy">{value}</p>
    </div>
  );
}
