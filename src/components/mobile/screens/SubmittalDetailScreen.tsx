"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FieldText } from "@/components/mobile/daily-log/FieldBits";
import { todayIso } from "@/lib/mobile/dailyLogs";
import { mobilePageBg } from "@/lib/mobile/mobileUi";
import { getProjectById } from "@/lib/mobile/mockData";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import {
  addSubmittalReviewNote,
  canAddReviewNote,
  canWriteSubmittal,
  currentRevisionLabel,
  duePresentation,
  getSubmittalById,
  getSubmittalStoreVersion,
  isSubmittalOverdue,
  readCommentDraft,
  revisionStateLabel,
  revisionUpdatedLabel,
  subscribeSubmittals,
  writeCommentDraft,
  type SubmittalRevision,
} from "@/lib/mobile/submittals";
import { SubmittalStatusMark } from "../SubmittalStatusMark";
import { IconBack } from "../icons";

export function SubmittalDetailScreen({ submittalId }: { submittalId: string }) {
  const { user, isOffline, accessibleProjects } = useMobileApp();
  const storeVersion = useSyncExternalStore(subscribeSubmittals, getSubmittalStoreVersion, () => 0);

  const [ready, setReady] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [denied, setDenied] = useState<string | null>(null);
  const [viewRevision, setViewRevision] = useState<SubmittalRevision | null>(null);
  const skipWrite = useRef(true);
  const authorName = `${user.firstName} ${user.lastName}`;
  const canWrite = canWriteSubmittal(user.role);

  useEffect(() => {
    setToday(todayIso());
    setReady(true);
  }, []);

  useEffect(() => {
    const saved = readCommentDraft(submittalId);
    skipWrite.current = true;
    setDraft(saved);
    setComposing(Boolean(saved.trim()));
    setDenied(null);
    setViewRevision(null);
  }, [submittalId]);

  useEffect(() => {
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    writeCommentDraft(submittalId, draft);
  }, [submittalId, draft]);

  const record = ready && today ? getSubmittalById(submittalId, today) : undefined;
  void storeVersion;
  const project = record ? getProjectById(record.projectId) : undefined;
  const allowed = record ? accessibleProjects.some((item) => item.id === record.projectId) : true;

  if (!ready || !today) {
    return (
      <div className={`${mobilePageBg} px-4 pt-6`} aria-hidden="true">
        <div className="h-3 w-16 animate-pulse rounded bg-brand-line/80" />
        <div className="mt-3 h-7 w-4/5 animate-pulse rounded bg-brand-line/70" />
        <div className="mt-6 h-24 animate-pulse rounded-[16px] bg-white" />
        <div className="mt-4 h-32 animate-pulse rounded-[16px] bg-white" />
      </div>
    );
  }

  if (!record || !project || !allowed) {
    return (
      <Denied
        title={record && !allowed ? "You don't have permission to view this Submittal." : "Submittal unavailable"}
        body={
          record && !allowed
            ? "This Submittal isn't included in your project access."
            : "This Submittal isn't available on this device."
        }
      />
    );
  }

  const due = duePresentation(record, today);
  const overdue = isSubmittalOverdue(record, today);
  const canReview = canAddReviewNote(record, user.role);
  const sortedRevisions = record.revisions.slice().sort((a, b) => b.revision - a.revision);

  function saveReviewNote() {
    const saved = addSubmittalReviewNote(
      record!.id,
      { author: authorName, body: draft, offline: isOffline },
      user.role,
    );
    if (!saved) {
      setDenied("You don't have permission to add a review note on this Submittal.");
      return;
    }
    setDraft("");
    setComposing(false);
    setDenied(null);
  }

  return (
    <div className={`${mobilePageBg} overflow-x-hidden`}>
      <div className="mx-auto max-w-lg pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))]">
        <header className="border-b border-brand-line/45 px-4 pb-5 pt-[max(12px,env(safe-area-inset-top))]">
          <Link
            href="/mobile-preview/tools/submittals"
            className="m-press inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted"
          >
            <IconBack />
            Submittals
          </Link>
          <p className="mt-2 text-[11px] font-semibold tracking-[0.08em] text-brand-mist">{record.number}</p>
          <h1 className="mt-1 text-[22px] font-bold leading-[1.2] tracking-[-0.03em] text-brand-navy">{record.title}</h1>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-mist">Project</p>
          <p className="mt-1 text-[15px] font-semibold text-brand-navy">{project.name}</p>
          <p className="mt-0.5 text-[13px] text-brand-muted">
            {project.city}, {project.state}
          </p>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-mist">Status</p>
          <div className="mt-1.5">
            <SubmittalStatusMark status={record.status} />
          </div>

          {due ? (
            <p className={`mt-3 text-[14px] font-semibold ${overdue ? "text-[#8A4B3A]" : "text-brand-navy"}`}>{due}</p>
          ) : null}
          <p className="mt-2 text-[13px] text-brand-navy">{record.responsibleParty}</p>
          <p className="mt-2 inline-flex items-baseline gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-mist">Current</span>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-brand-navy">{currentRevisionLabel(record)}</span>
          </p>

          {!canWrite ? (
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">Read only</p>
          ) : null}
          {record.sync !== "synced" ? (
            <p className="mt-2 text-[12px] font-medium text-brand-muted" role="status">
              {record.syncLabel}
            </p>
          ) : null}
          {record.notice ? (
            <p className="mt-1 text-[13px] font-semibold text-[#1B6B45]" role="status">
              {record.notice}
            </p>
          ) : null}
        </header>

        <main className="space-y-7 px-4 pt-6">
          {(record.specSection || record.drawingNumber || record.packageTitle !== record.title) && (
            <section>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-mist">Context</h2>
              <div className="mt-2 space-y-1.5 border-t border-brand-line/50 pt-3">
                {record.packageTitle && record.packageTitle !== record.title ? (
                  <p className="text-[15px] font-semibold leading-snug text-brand-navy">{record.packageTitle}</p>
                ) : null}
                {record.specSection ? (
                  <p className="text-[13px] text-brand-navy">
                    <span className="text-brand-muted">Specification · </span>
                    {record.specSection}
                  </p>
                ) : null}
                {record.drawingNumber ? (
                  <p className="text-[13px] text-brand-navy">
                    <span className="text-brand-muted">Drawing · </span>
                    {record.drawingNumber}
                  </p>
                ) : null}
              </div>
            </section>
          )}

          {sortedRevisions.length > 0 ? (
            <section>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-mist">For review</h2>
              <ul className="mt-2 divide-y divide-brand-line/50 border-y border-brand-line/50">
                {sortedRevisions.map((revision) => (
                  <DocumentRow
                    key={revision.revision}
                    revision={revision}
                    current={record.currentRevision}
                    today={today}
                    onView={() => setViewRevision(revision)}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {record.comments.length > 0 ? (
            <section>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-mist">Review notes</h2>
              <ul className="mt-2 space-y-3">
                {record.comments.map((comment) => (
                  <li key={comment.id} className="border-t border-brand-line/45 pt-3 first:border-t-0 first:pt-0">
                    <p className="text-[13px] font-semibold text-brand-navy">{comment.author}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-brand-navy/85">{comment.body}</p>
                    <p className="mt-1.5 text-[11px] text-brand-mist">{comment.timeLabel}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {canReview ? (
            <section>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-mist">Field review</h2>
              {composing ? (
                <div className="mt-2 space-y-3 border-t border-brand-line/50 pt-3">
                  <FieldText
                    id="submittal-review-note"
                    label="Review note"
                    value={draft}
                    onChange={setDraft}
                    placeholder="Add a concise review note for the project record…"
                    multiline
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={saveReviewNote}
                      disabled={!draft.trim()}
                      className="m-press rounded-full bg-brand-navy px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
                    >
                      Save note
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft("");
                        setComposing(false);
                        writeCommentDraft(submittalId, "");
                      }}
                      className="m-press rounded-full border border-brand-line/70 px-4 py-2 text-[13px] font-semibold text-brand-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setComposing(true)}
                  className="m-press mt-2 w-full border-t border-brand-line/50 pt-3 text-left text-[14px] font-semibold text-brand-navy"
                >
                  Add review note
                </button>
              )}
            </section>
          ) : null}

          {denied ? (
            <p className="text-[13px] font-semibold text-[#8A4B3A]" role="alert">
              {denied}
            </p>
          ) : null}
        </main>
      </div>

      {viewRevision ? (
        <AttachmentReader
          revision={viewRevision}
          current={record.currentRevision}
          today={today}
          onClose={() => setViewRevision(null)}
        />
      ) : null}
    </div>
  );
}

function DocumentRow({
  revision,
  current,
  today,
  onView,
}: {
  revision: SubmittalRevision;
  current: number;
  today: string;
  onView: () => void;
}) {
  const isCurrent = revision.revision === current;
  const updated = revisionUpdatedLabel(revision, today);
  const state = revisionStateLabel(revision, current);

  return (
    <li className={`py-3 ${isCurrent ? "" : "opacity-80"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={`text-[13px] font-semibold ${isCurrent ? "text-brand-navy" : "text-brand-navy/55"}`}>
              Rev {revision.revision}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                isCurrent ? "text-brand-navy" : "text-brand-mist"
              }`}
            >
              {state}
            </span>
          </p>
          <p className={`mt-1 text-[14px] leading-snug ${isCurrent ? "font-medium text-brand-navy" : "text-brand-navy/60"}`}>
            {revision.fileName}
          </p>
          {updated ? <p className="mt-0.5 text-[11px] text-brand-muted">{updated}</p> : null}
        </div>
        <button type="button" onClick={onView} className="shrink-0 text-[13px] font-semibold text-brand-navy">
          Read
        </button>
      </div>
    </li>
  );
}

function AttachmentReader({
  revision,
  current,
  today,
  onClose,
}: {
  revision: SubmittalRevision;
  current: number;
  today: string;
  onClose: () => void;
}) {
  const isCurrent = revision.revision === current;
  const updated = revisionUpdatedLabel(revision, today);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-brand-navy/35" role="dialog" aria-modal="true">
      <div className="mx-auto mt-auto flex w-full max-w-lg flex-col rounded-t-[18px] bg-white pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center justify-between px-4 pb-3">
          <p className="text-[13px] font-semibold text-brand-navy">
            Rev {revision.revision} · {revisionStateLabel(revision, current)}
          </p>
          <button type="button" onClick={onClose} className="text-[13px] font-semibold text-brand-muted">
            Close
          </button>
        </div>
        <div className="mx-4 mb-4 flex min-h-[200px] flex-col justify-center border border-brand-line/55 bg-[#FAFCFE] px-4 py-8">
          <p className={`text-center text-[15px] font-semibold ${isCurrent ? "text-brand-navy" : "text-brand-navy/60"}`}>
            {revision.fileName}
          </p>
          {updated ? <p className="mt-2 text-center text-[12px] text-brand-muted">{updated}</p> : null}
          <p className="mt-4 text-center text-[13px] leading-relaxed text-brand-muted">
            Field review view. Refer to the project record for the authoritative document.
          </p>
        </div>
      </div>
    </div>
  );
}

function Denied({ title, body }: { title: string; body: string }) {
  return (
    <div className={`${mobilePageBg} px-4 pt-[max(12px,env(safe-area-inset-top))]`}>
      <Link
        href="/mobile-preview/tools/submittals"
        className="m-press inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted"
      >
        <IconBack />
        Submittals
      </Link>
      <h1 className="mt-6 text-[20px] font-bold text-brand-navy">{title}</h1>
      <p className="mt-2 text-[14px] text-brand-muted">{body}</p>
    </div>
  );
}
