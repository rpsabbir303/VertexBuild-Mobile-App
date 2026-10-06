"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { PhotoAttachments } from "@/components/mobile/daily-log/PhotoAttachments";
import { fieldInput, fieldLabel, mobileElevatedCard } from "@/lib/mobile/mobileUi";
import type { PhotoParentContext } from "@/lib/mobile/photoEvidence";
import { normalizeWorkPhotos, type FieldPhoto } from "@/lib/mobile/photoEvidence";
import {
  canContinuePunchWork,
  canEditCompletionEvidence,
  canMarkPunchComplete,
  canReviewVerification,
  canStartPunchWork,
  formatPunchDateTime,
  isPendingVerification,
  markPunchComplete,
  readCompletionNoteDraft,
  rejectPunchVerification,
  retryPunchSync,
  startPunchWork,
  updatePunchCompletionPhotos,
  verifyPunch,
  writeCompletionNoteDraft,
  type ProjectPunch,
} from "@/lib/mobile/punch";
import type { MockRole } from "@/lib/mobile/types";

export function PunchWorkflowBanner({ punch }: { punch: ProjectPunch }) {
  if (punch.status === "verified" && punch.verifiedBy) {
    return (
      <div className="rounded-[14px] border border-brand-navy/15 bg-[#F4F7FB] px-3.5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-navy">Verified</p>
        <p className="mt-1 text-[14px] font-semibold text-brand-navy">Verified by {punch.verifiedBy}</p>
        {punch.verifiedAt ? (
          <p className="mt-0.5 text-[13px] text-brand-muted">Verified · {formatPunchDateTime(punch.verifiedAt)}</p>
        ) : null}
      </div>
    );
  }

  if (isPendingVerification(punch)) {
    return (
      <div className="rounded-[14px] border border-[#D8C4A8]/80 bg-[#FBF6F1] px-3.5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A6232]">Pending verification</p>
        {punch.completedBy ? (
          <p className="mt-1 text-[14px] font-semibold text-brand-navy">Completed by {punch.completedBy}</p>
        ) : null}
        {punch.completedAt ? (
          <p className="mt-0.5 text-[13px] text-brand-muted">Completed · {formatPunchDateTime(punch.completedAt)}</p>
        ) : null}
        <p className="mt-2 text-[13px] leading-snug text-brand-muted">Awaiting supervisor verification</p>
      </div>
    );
  }

  if (punch.status === "completed" && punch.completedBy) {
    return (
      <div className="rounded-[14px] border border-[#C8DDD0]/80 bg-[#F3FAF6] px-3.5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1B6B45]">Completed</p>
        <p className="mt-1 text-[14px] font-semibold text-brand-navy">Work completed by {punch.completedBy}</p>
        {punch.completedAt ? (
          <p className="mt-0.5 text-[13px] text-brand-muted">Completed · {formatPunchDateTime(punch.completedAt)}</p>
        ) : null}
      </div>
    );
  }

  if (punch.correctionNeeded && punch.status === "in_progress") {
    return (
      <div className="rounded-[14px] border border-[#E8DDD4]/85 bg-[#FCF8F5] px-3.5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A4B3A]">Correction needed</p>
        {punch.rejectionNote ? (
          <p className="mt-1 text-[14px] leading-snug text-brand-navy">{punch.rejectionNote}</p>
        ) : (
          <p className="mt-1 text-[14px] text-brand-navy">Supervisor requested additional corrective work.</p>
        )}
        {punch.rejectedBy ? (
          <p className="mt-2 text-[12px] text-brand-muted">Rejected by {punch.rejectedBy}</p>
        ) : null}
      </div>
    );
  }

  if (punch.status === "in_progress") {
    return (
      <div className="rounded-[14px] border border-brand-line/70 bg-white px-3.5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Corrective work</p>
        <p className="mt-1 text-[14px] font-semibold text-brand-navy">Continue correction</p>
      </div>
    );
  }

  return null;
}

export function PunchCorrectiveActions({
  punch,
  role,
  offline,
  authorName,
}: {
  punch: ProjectPunch;
  role: MockRole;
  offline: boolean;
  authorName: string;
}) {
  const [notice, setNotice] = useState<string | null>(null);

  if (canStartPunchWork(punch, role)) {
    return (
      <div className={`${mobileElevatedCard} px-4 py-4`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Corrective work</p>
        <p className="mt-1 text-[13px] leading-relaxed text-brand-muted">Start work on this punch item.</p>
        <button
          type="button"
          onClick={() => {
            const ok = startPunchWork(punch.id, offline);
            setNotice(ok ? (offline ? "Saved locally · In progress" : "Status updated · In progress") : null);
          }}
          className="m-press mt-4 flex h-12 w-full items-center justify-center rounded-[14px] bg-brand-navy text-[15px] font-semibold text-white"
        >
          Start corrective work
        </button>
        {notice ? (
          <p className="mt-2 text-[12px] font-medium text-brand-muted" role="status">
            {notice}
          </p>
        ) : null}
      </div>
    );
  }

  if (canContinuePunchWork(punch, role)) {
    return (
      <div className={`${mobileElevatedCard} px-4 py-4`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Corrective work</p>
        <p className="mt-1 text-[13px] leading-relaxed text-brand-muted">
          Document the corrected condition, then mark this punch complete.
        </p>
      </div>
    );
  }

  void authorName;
  return null;
}

export function PunchCompletionSection({
  punch,
  punchId,
  role,
  offline,
  parentContext,
  authorName,
}: {
  punch: ProjectPunch;
  punchId: string;
  role: MockRole;
  offline: boolean;
  parentContext: PhotoParentContext;
  authorName: string;
}) {
  const completionContext = useMemo(
    (): PhotoParentContext => ({
      ...parentContext,
      sectionLabel: `${punch.number} · Completion`,
    }),
    [parentContext, punch.number],
  );

  const completionPhotos = useMemo(
    () => normalizeWorkPhotos(punch.completionPhotos, completionContext),
    [punch.completionPhotos, completionContext],
  );

  const canEdit = canEditCompletionEvidence(punch, role);
  const canComplete = canMarkPunchComplete(punch, role);
  const showSection =
    punch.status === "in_progress" ||
    punch.status === "completed" ||
    punch.status === "verified" ||
    completionPhotos.length > 0 ||
    punch.completionNote;

  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setNote(punch.completionNote || readCompletionNoteDraft(punchId));
  }, [punchId, punch.completionNote]);

  useEffect(() => {
    if (canEdit) writeCompletionNoteDraft(punchId, note);
  }, [punchId, note, canEdit]);

  if (!showSection) return null;

  const completionLocked = !canEdit;

  return (
    <section className={`${mobileElevatedCard} px-4 py-4`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Completion evidence</p>
      <p className="mt-1 text-[13px] leading-relaxed text-brand-muted">Photos of the corrected / final condition.</p>
      <div className="mt-4">
        <PhotoAttachments
          mode="evidence"
          photos={completionPhotos}
          onChange={
            canEdit
              ? (next) => updatePunchCompletionPhotos(punchId, next, offline)
              : undefined
          }
          locked={completionLocked}
          parentContext={completionContext}
          addLabel="Add evidence"
          hint="Show corrected condition"
        />
      </div>

      {canEdit || punch.completionNote ? (
        <label className="mt-4 block">
          <span className={fieldLabel}>Completion note</span>
          <textarea
            value={canEdit ? note : punch.completionNote}
            onChange={(event) => setNote(event.target.value)}
            disabled={!canEdit}
            placeholder="Handrail connection tightened and inspected."
            rows={3}
            className={`${fieldInput} mt-1.5 resize-none py-2.5`}
          />
        </label>
      ) : null}

      {canComplete ? (
        <>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="m-press mt-4 flex h-12 w-full items-center justify-center rounded-[14px] bg-brand-blue text-[15px] font-semibold text-white"
          >
            Mark complete
          </button>
          {actionError ? (
            <p className="mt-2 text-[13px] font-semibold text-[#8A4B3A]" role="alert">
              {actionError}
            </p>
          ) : null}
        </>
      ) : null}

      {!canEdit && punch.completionNote ? (
        <div className="mt-4 border-t border-brand-line/60 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Completion note</p>
          <p className="mt-1 text-[14px] leading-relaxed text-brand-navy">{punch.completionNote}</p>
        </div>
      ) : null}

      {confirmOpen ? (
        <ConfirmCompleteSheet
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            const ok = markPunchComplete(
              punchId,
              { note, completionPhotos, completedBy: authorName },
              offline,
            );
            if (!ok) {
              setActionError("Unable to mark complete. Refresh and try again.");
              setConfirmOpen(false);
              return;
            }
            setConfirmOpen(false);
            setActionError(null);
          }}
        />
      ) : null}
    </section>
  );
}

export function PunchVerificationPanel({
  punch,
  punchId,
  role,
  offline,
  verifierName,
}: {
  punch: ProjectPunch;
  punchId: string;
  role: MockRole;
  offline: boolean;
  verifierName: string;
}) {
  const canReview = canReviewVerification(punch, role);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isPendingVerification(punch)) return null;

  return (
    <section className={`${mobileElevatedCard} px-4 py-4`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A6232]">Supervisor review</p>
      <p className="mt-1 text-[13px] leading-relaxed text-brand-muted">
        Review completion evidence before closing this punch item.
      </p>

      {canReview ? (
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => {
              const ok = verifyPunch(punchId, verifierName, offline);
              if (!ok) setError("Unable to verify this punch item.");
            }}
            className="m-press flex h-12 w-full items-center justify-center rounded-[14px] bg-brand-navy text-[15px] font-semibold text-white"
          >
            Verify &amp; close
          </button>
          <button
            type="button"
            onClick={() => {
              setRejectReason("");
              setRejectOpen(true);
            }}
            className="m-press flex h-12 w-full items-center justify-center rounded-[14px] border border-[#D8C4BC]/90 bg-white text-[15px] font-semibold text-[#8A4B3A]"
          >
            Reject / needs correction
          </button>
          {error ? (
            <p className="text-[13px] font-semibold text-[#8A4B3A]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-[13px] font-medium text-brand-muted">Verification actions require supervisor access.</p>
      )}

      {rejectOpen ? (
        <RejectSheet
          reason={rejectReason}
          onReasonChange={setRejectReason}
          onCancel={() => setRejectOpen(false)}
          onSubmit={() => {
            const trimmed = rejectReason.trim();
            if (!trimmed) {
              setError("Enter a correction reason.");
              return;
            }
            const ok = rejectPunchVerification(punchId, { reason: trimmed, rejectedBy: verifierName }, offline);
            if (!ok) {
              setError("Unable to reopen this punch item.");
              return;
            }
            setRejectOpen(false);
            setError(null);
          }}
        />
      ) : null}
    </section>
  );
}

export function PunchSyncBar({
  punch,
  punchId,
  offline,
}: {
  punch: ProjectPunch;
  punchId: string;
  offline: boolean;
}) {
  if (punch.sync === "synced") return null;
  return (
    <div className="rounded-[12px] border border-brand-line/70 bg-white px-3.5 py-2.5">
      <p className="text-[13px] font-medium text-brand-navy" role="status">
        {punch.syncLabel}
      </p>
      {punch.sync === "failed" ? (
        <button
          type="button"
          onClick={() => retryPunchSync(punchId, offline)}
          className="mt-1 text-[13px] font-semibold text-brand-blue"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

function ConfirmCompleteSheet({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const titleId = useId();
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-brand-ink/40 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-8">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full rounded-t-[20px] border border-brand-line/70 bg-white px-4 pb-4 pt-3 shadow-sheet">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />
        <h2 id={titleId} className="text-[17px] font-bold tracking-[-0.02em] text-brand-navy">
          Mark punch complete?
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">
          This will move the punch to <span className="font-semibold text-brand-navy">Completed</span> and send it for supervisor verification.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} className="h-11 rounded-[12px] text-[14px] font-semibold text-brand-muted">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="m-press h-11 rounded-[12px] bg-brand-blue text-[14px] font-semibold text-white">
            Mark complete
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectSheet({
  reason,
  onReasonChange,
  onCancel,
  onSubmit,
}: {
  reason: string;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const titleId = useId();
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-brand-ink/40 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-8">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full rounded-t-[20px] border border-brand-line/70 bg-white px-4 pb-4 pt-3 shadow-sheet">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />
        <h2 id={titleId} className="text-[17px] font-bold tracking-[-0.02em] text-brand-navy">
          Correction needed
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">Explain what still needs to be corrected.</p>
        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Handrail is still loose at the east connection."
          rows={4}
          className={`${fieldInput} mt-3 resize-none py-2.5`}
          autoFocus
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} className="h-11 rounded-[12px] text-[14px] font-semibold text-brand-muted">
            Cancel
          </button>
          <button type="button" onClick={onSubmit} className="m-press h-11 rounded-[12px] bg-brand-navy text-[14px] font-semibold text-white">
            Reopen punch
          </button>
        </div>
      </div>
    </div>
  );
}
