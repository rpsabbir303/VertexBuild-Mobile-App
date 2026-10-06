"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { PhotoAttachments } from "@/components/mobile/daily-log/PhotoAttachments";
import {
  PunchCompletionSection,
  PunchCorrectiveActions,
  PunchSyncBar,
  PunchVerificationPanel,
  PunchWorkflowBanner,
} from "@/components/mobile/punch/PunchDetailWorkflow";
import { todayIso } from "@/lib/mobile/dailyLogs";
import { mobileElevatedCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { getProjectById } from "@/lib/mobile/mockData";
import type { PhotoParentContext } from "@/lib/mobile/photoEvidence";
import { normalizeWorkPhotos, type FieldPhoto } from "@/lib/mobile/photoEvidence";
import {
  canAddPunchEvidence,
  canAuthorPunch,
  canVerifyPunch,
  costImpactLine,
  drawingPinLine,
  duePresentation,
  formatShortDate,
  getPunchById,
  getPunchSession,
  getServerPunchSession,
  isPunchOverdue,
  isPendingVerification,
  punchStatusLabel,
  punchWorkflowLabel,
  processPunchSyncQueue,
  subscribePunch,
  updatePunchPhotos,
} from "@/lib/mobile/punch";
import { canAccessMoreMenuItem } from "@/lib/mobile/roleConfig";
import { PunchStatusMark } from "../PunchStatusMark";
import { IconBack } from "../icons";
import { PermissionDeniedScreen } from "./PermissionDeniedScreen";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-brand-line/60 py-3 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-mist">{label}</p>
      <p className="mt-1 text-[15px] font-semibold leading-snug tracking-[-0.02em] text-brand-navy">{value}</p>
    </div>
  );
}

function Denied({ title, body }: { title: string; body: string }) {
  return (
    <div className={mobilePageBg}>
      <header className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <Link href="/mobile-preview/tools/punch" className="m-press inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted">
          <IconBack />
          Punch List
        </Link>
      </header>
      <main className="px-4 pt-6">
        <h1 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">{title}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">{body}</p>
      </main>
    </div>
  );
}

export function PunchDetailScreen({ punchId }: { punchId: string }) {
  const { user, isOffline, accessibleProjects, currentProject } = useMobileApp();
  void useSyncExternalStore(subscribePunch, getPunchSession, getServerPunchSession);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(todayIso());
    setReady(true);
  }, []);

  useEffect(() => {
    processPunchSyncQueue(isOffline);
  }, [isOffline]);

  const punch = ready && today ? getPunchById(punchId, today) : undefined;
  const project = punch ? getProjectById(punch.projectId) : undefined;
  const menuAllowed = canAccessMoreMenuItem(
    "punch",
    user.role,
    accessibleProjects.map((p) => p.id),
    currentProject.id,
  );
  const projectAllowed = punch ? accessibleProjects.some((item) => item.id === punch.projectId) : true;

  const authorName = `${user.firstName} ${user.lastName}`;
  const canAuthor = canAuthorPunch(user.role);
  const canVerify = canVerifyPunch(user.role);
  const canAddIssueEvidence = punch ? canAddPunchEvidence(punch, user.role) : false;
  const issuePhotosLocked = !canAddIssueEvidence;

  const parentContext: PhotoParentContext | null = useMemo(() => {
    if (!punch || !project) return null;
    return {
      projectId: project.id,
      projectName: project.name,
      recordLabel: "Punch",
      sectionLabel: `${punch.number} · Original`,
      workEntryId: punch.id,
    };
  }, [punch, project]);

  const photos = useMemo(() => {
    if (!punch) return [];
    return normalizeWorkPhotos(punch.photos, parentContext ?? undefined);
  }, [punch, parentContext]);

  function onPhotosChange(next: FieldPhoto[]) {
    updatePunchPhotos(punchId, next, isOffline);
  }

  if (!menuAllowed) {
    return <PermissionDeniedScreen backHref="/mobile-preview/more" />;
  }

  if (!ready || !today) {
    return (
      <div className={`${mobilePageBg} px-4 pt-6`} aria-hidden="true">
        <div className="h-3 w-16 animate-pulse rounded bg-brand-line/80" />
        <div className="mt-3 h-7 w-4/5 animate-pulse rounded bg-brand-line/70" />
        <div className="mt-6 h-32 animate-pulse rounded-[16px] bg-white" />
      </div>
    );
  }

  if (!punch || !project || !projectAllowed) {
    return (
      <Denied
        title={punch && !projectAllowed ? "You don't have permission to view this punch item." : "Punch item unavailable"}
        body={
          punch && !projectAllowed
            ? "This punch item isn't included in your project access."
            : "This punch item isn't available on this device."
        }
      />
    );
  }

  const overdue = isPunchOverdue(punch, today);
  const due = duePresentation(punch, today);
  const drawing = drawingPinLine(punch.drawingPin);
  const workflowLabel = punchWorkflowLabel(punch);
  const pending = isPendingVerification(punch);

  return (
    <div className={mobilePageBg}>
      <header className="px-4 pb-4 pt-[max(12px,env(safe-area-inset-top))]">
        <Link
          href="/mobile-preview/tools/punch"
          className="m-press inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted"
        >
          <IconBack />
          Punch List
        </Link>
        <p className="mt-2 text-[12px] font-semibold tracking-[0.08em] text-brand-mist">{punch.number}</p>
        <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.03em] text-brand-navy">{punch.description}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <PunchStatusMark status={punch.status} />
          {workflowLabel !== punchStatusLabel(punch.status) ? (
            <span className="text-[12px] font-semibold text-[#8A6232]">{workflowLabel}</span>
          ) : null}
        </div>
        {due ? (
          <p className={`mt-2 text-[14px] font-semibold ${overdue ? "text-[#8A4B3A]" : "text-brand-navy"}`}>
            {overdue ? `Overdue · ${formatShortDate(punch.dueDate!)}` : due}
          </p>
        ) : null}
        <p className="mt-3 text-[14px] font-semibold text-brand-navy">{project.name}</p>
        <p className="mt-0.5 text-[13px] text-brand-muted">
          {project.city}, {project.state}
        </p>
        {!canAuthor ? (
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">Read only</p>
        ) : pending && !canVerify ? (
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">View only · Pending verification</p>
        ) : null}
        <div className="mt-3">
          <PunchSyncBar punch={punch} punchId={punchId} offline={isOffline} />
        </div>
      </header>

      <main className="space-y-4 px-4 pb-20">
        <PunchWorkflowBanner punch={punch} />

        <section className={`${mobileElevatedCard} px-4 py-1`}>
          <DetailRow label="Location" value={punch.location} />
          <DetailRow label="Status" value={workflowLabel} />
          <DetailRow label="Assigned to" value={punch.assignedTo} />
          {punch.dueDate ? <DetailRow label="Due" value={formatShortDate(punch.dueDate)} /> : null}
          {punch.subcontractor ? <DetailRow label="Subcontractor" value={punch.subcontractor} /> : null}
          {punch.completedBy ? <DetailRow label="Completed by" value={punch.completedBy} /> : null}
          {punch.verifiedBy ? <DetailRow label="Verified by" value={punch.verifiedBy} /> : null}
          <DetailRow label="Cost impact" value={costImpactLine(punch.costImpact)} />
          {drawing ? <DetailRow label="Drawing" value={drawing} /> : null}
        </section>

        <PunchCorrectiveActions punch={punch} role={user.role} offline={isOffline} authorName={authorName} />

        {parentContext ? (
          <section className={`${mobileElevatedCard} px-4 py-4`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Original condition</p>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-muted">Issue photos from when the punch was opened.</p>
            <div className="mt-4">
              <PhotoAttachments
                mode="evidence"
                photos={photos}
                onChange={canAddIssueEvidence ? onPhotosChange : undefined}
                locked={issuePhotosLocked}
                parentContext={parentContext}
                addLabel="Add field photo"
                hint="Document current condition"
              />
            </div>
          </section>
        ) : null}

        {parentContext ? (
          <PunchCompletionSection
            punch={punch}
            punchId={punchId}
            role={user.role}
            offline={isOffline}
            parentContext={parentContext}
            authorName={authorName}
          />
        ) : null}

        <PunchVerificationPanel
          punch={punch}
          punchId={punchId}
          role={user.role}
          offline={isOffline}
          verifierName={authorName}
        />
      </main>
    </div>
  );
}
