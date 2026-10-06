"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PhotoAttachments } from "@/components/mobile/daily-log/PhotoAttachments";
import { ChoiceRow, FieldText } from "@/components/mobile/daily-log/FieldBits";
import { todayIso } from "@/lib/mobile/dailyLogs";
import { fieldInput, fieldLabel, mobileElevatedCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { getProjectById } from "@/lib/mobile/mockData";
import type { MockRole } from "@/lib/mobile/types";
import {
  addRfiResponse,
  canAuthorRfi,
  canEditRfi,
  canRespondToRfi,
  duePresentation,
  getRfiById,
  getRfiSession,
  getServerRfiSession,
  impactLine,
  isOverdue,
  readResponseDraft,
  rfiPriorityLabel,
  rfiResponsibility,
  rfiStatusLabel,
  saveRfiEdits,
  submitRfi,
  subscribeRfis,
  syncQueuedRfi,
  writeResponseDraft,
  type ProjectRfi,
  type RfiPriority,
} from "@/lib/mobile/rfis";
import { RfiPriorityMark, RfiStatusMark } from "../RfiStatusMark";
import { IconBack } from "../icons";

function isImageAttachment(value: string) {
  return value.startsWith("data:image") || value.startsWith("blob:");
}

export function RfiDetailScreen({ rfiId }: { rfiId: string }) {
  const { user, isOffline, accessibleProjects } = useMobileApp();
  const session = useSyncExternalStore(subscribeRfis, getRfiSession, getServerRfiSession);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const skipWrite = useRef(true);
  const authorName = `${user.firstName} ${user.lastName}`;
  const canAuthor = canAuthorRfi(user.role);

  useEffect(() => {
    setToday(todayIso());
    setReady(true);
  }, []);

  useEffect(() => {
    const saved = readResponseDraft(rfiId);
    skipWrite.current = true;
    setDraft(saved.body);
    setPhotos(saved.photos);
    setComposing(Boolean(saved.body.trim() || saved.photos.length));
    setDraftNotice(null);
    setDenied(null);
    setEditing(false);
  }, [rfiId]);

  useEffect(() => {
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    writeResponseDraft(rfiId, { body: draft, photos });
  }, [rfiId, draft, photos]);

  const rfi = ready && today ? getRfiById(rfiId, today) : undefined;
  const project = rfi ? getProjectById(rfi.projectId) : undefined;
  const allowed = rfi ? accessibleProjects.some((item) => item.id === rfi.projectId) : true;
  void session;

  if (!ready || !today) {
    return (
      <div className={`${mobilePageBg} px-4 pt-6`} aria-hidden="true">
        <div className="h-3 w-16 animate-pulse rounded bg-brand-line/80" />
        <div className="mt-3 h-7 w-4/5 animate-pulse rounded bg-brand-line/70" />
        <div className="mt-3 h-3 w-24 animate-pulse rounded bg-brand-line/60" />
        <div className="mt-6 h-28 animate-pulse rounded-[16px] bg-white" />
        <div className="mt-4 h-20 animate-pulse rounded-[16px] bg-white" />
      </div>
    );
  }

  if (!rfi || !project || !allowed) {
    return (
      <Denied
        title={rfi && !allowed ? "You don't have permission to view this RFI." : "RFI unavailable"}
        body={
          rfi && !allowed
            ? "This RFI isn't included in your project access."
            : "This RFI isn't available on this device."
        }
      />
    );
  }

  const due = duePresentation(rfi, today);
  const overdue = isOverdue(rfi, today);
  const canRespond = canRespondToRfi(rfi, user.role);
  const canEdit = canEditRfi(rfi, user.role);

  function submitResponse() {
    if (!rfi) return;
    const saved = addRfiResponse(
      rfi.id,
      { author: authorName, body: draft, photos, offline: isOffline },
      user.role,
    );
    if (!saved) {
      setDenied("You don't have permission to respond to this RFI.");
      return;
    }
    setDraft("");
    setPhotos([]);
    setComposing(false);
    setDraftNotice(null);
    setDenied(null);
    setSyncError(null);
  }

  function saveResponseDraft() {
    writeResponseDraft(rfiId, { body: draft, photos });
    setDraftNotice(isOffline ? "Saved locally · Waiting to sync" : "Response draft saved");
  }

  function retrySync() {
    if (!rfi) return;
    const synced = syncQueuedRfi(rfi.id, isOffline);
    if (!synced) {
      setSyncError("Unable to sync this RFI. It is still saved on this device.");
      return;
    }
    setSyncError(null);
  }

  return (
    <div className={mobilePageBg}>
      <header className="px-4 pb-4 pt-[max(12px,env(safe-area-inset-top))]">
        <Link
          href="/mobile-preview/tools/rfis"
          className="m-press inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted"
        >
          <IconBack />
          RFI
        </Link>
        <p className="mt-2 text-[12px] font-semibold tracking-[0.08em] text-brand-mist">{rfi.number}</p>
        <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.03em] text-brand-navy">{rfi.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <RfiStatusMark status={rfi.status} responses={rfi.responses} />
          <RfiPriorityMark priority={rfi.priority} />
        </div>
        {due ? (
          <p className={`mt-2 text-[14px] font-semibold ${overdue ? "text-[#8A4B3A]" : "text-brand-navy"}`}>{due}</p>
        ) : null}
        <p className="mt-2 text-[14px] font-semibold text-brand-navy">{project.name}</p>
        <p className="mt-0.5 text-[13px] text-brand-muted">
          {project.city}, {project.state}
        </p>
        {!canAuthor ? (
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">Read only</p>
        ) : null}
        {rfi.notice ? (
          <p className="mt-3 text-[13px] font-semibold text-[#1B6B45]" role="status">
            {rfi.notice}
          </p>
        ) : null}
        <p className="mt-1 text-[12px] font-medium text-brand-muted" role="status">
          {rfi.syncLabel}
        </p>
      </header>

      {editing && canEdit ? (
        <RfiDraftEditor
          rfi={rfi}
          offline={isOffline}
          role={user.role}
          onClose={() => setEditing(false)}
          onDenied={() => setDenied("You don't have permission to edit this RFI.")}
        />
      ) : (
        <main className="space-y-6 px-4 pb-16">
          <section className={`${mobileElevatedCard} px-4 py-4`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Question</p>
            <p className="mt-2 text-[18px] font-semibold leading-snug tracking-[-0.02em] text-brand-navy">{rfi.question}</p>
          </section>

          <Responsibility rfi={rfi} />
          <ContextBlock rfi={rfi} />
          <Attachments rfi={rfi} />

          <section>
            <p className="text-[12px] font-semibold text-brand-muted">
              {rfiStatusLabel(rfi)}
              {due ? ` · ${due}` : ""}
            </p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Response</p>
            <ResponseBody rfi={rfi} />

            {syncError ? (
              <p className="mt-3 rounded-[12px] bg-[#F6F3EE] px-3 py-2.5 text-[13px] leading-snug text-[#5C5348]" role="alert">
                {syncError}
              </p>
            ) : null}
            {denied ? (
              <div className="mt-3">
                <p className="text-[14px] font-semibold text-brand-navy">{denied}</p>
                <Link href="/mobile-preview/tools/rfis" className="mt-2 inline-flex text-[13px] font-semibold text-brand-muted">
                  Back to RFI
                </Link>
              </div>
            ) : null}
            {draftNotice ? (
              <p className="mt-3 text-[13px] font-medium text-brand-muted" role="status">
                {draftNotice}
              </p>
            ) : null}

            {rfi.sync !== "synced" ? (
              <button
                type="button"
                onClick={retrySync}
                className="m-press mt-4 h-11 rounded-full bg-brand-navy px-5 text-[14px] font-semibold text-white"
              >
                {isOffline ? "Try again" : "Sync now"}
              </button>
            ) : null}

            {canEdit ? (
              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="h-12 px-1 text-[14px] font-semibold text-brand-navy"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const saved = submitRfi(rfi.id, isOffline, user.role);
                    if (!saved) setDenied("You don't have permission to submit this RFI.");
                  }}
                  className="m-press h-12 min-w-[148px] rounded-full bg-brand-navy px-5 text-[15px] font-semibold text-white"
                >
                  Submit
                </button>
              </div>
            ) : null}

            {canRespond && !composing ? (
              <button
                type="button"
                onClick={() => setComposing(true)}
                className="m-press mt-5 h-12 rounded-full bg-brand-navy px-5 text-[15px] font-semibold text-white"
              >
                Respond
              </button>
            ) : null}

            {canRespond && composing ? (
              <div className="mt-4 space-y-4 rounded-[16px] border border-brand-line/60 bg-white p-3.5 shadow-[0_2px_12px_rgba(8,35,63,0.06)]">
                <label className="block" htmlFor="rfi-response">
                  <span className={fieldLabel}>Response</span>
                  <textarea
                    id="rfi-response"
                    value={draft}
                    rows={4}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Answer the question from the field"
                    className={`${fieldInput} resize-none text-base leading-relaxed`}
                  />
                </label>
                <PhotoAttachments
                  photos={photos}
                  onChange={setPhotos}
                  addLabel="Add evidence"
                  hint="Photo or field condition"
                />
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={saveResponseDraft}
                    className="h-12 px-1 text-[14px] font-semibold text-brand-navy"
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    disabled={!draft.trim()}
                    onClick={submitResponse}
                    className="m-press h-12 min-w-[132px] rounded-full bg-brand-navy px-5 text-[15px] font-semibold text-white disabled:opacity-40"
                  >
                    Submit
                  </button>
                </div>
                {isOffline ? (
                  <p className="text-[12px] leading-relaxed text-brand-muted">
                    Saved on this device until the connection returns.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        </main>
      )}
    </div>
  );
}

function Denied({ title, body }: { title: string; body: string }) {
  return (
    <div className={mobilePageBg}>
      <header className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <Link
          href="/mobile-preview/tools/rfis"
          className="m-press inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted"
        >
          <IconBack />
          RFI
        </Link>
      </header>
      <main className="px-4 pt-6">
        <h1 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">{title}</h1>
        <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">{body}</p>
        <Link
          href="/mobile-preview/tools/rfis"
          className="m-press mt-5 inline-flex h-11 items-center rounded-full bg-brand-navy px-5 text-[14px] font-semibold text-white"
        >
          Back to RFI
        </Link>
      </main>
    </div>
  );
}

function Responsibility({ rfi }: { rfi: ProjectRfi }) {
  const party = rfiResponsibility(rfi);
  if (!party && !rfi.assignedTo) return null;
  return (
    <section className="overflow-hidden rounded-[16px] border border-brand-line/60 bg-white">
      {party ? <Fact label={party.label} value={party.name} /> : null}
      {rfi.assignedTo && party?.name !== rfi.assignedTo ? <Fact label="Assigned to" value={rfi.assignedTo} /> : null}
    </section>
  );
}

function ContextBlock({ rfi }: { rfi: ProjectRfi }) {
  const rows = [
    rfi.specSection ? { label: "Spec section", value: rfi.specSection } : null,
    rfi.drawingNumber ? { label: "Drawing", value: rfi.drawingNumber } : null,
    rfi.location ? { label: "Location", value: rfi.location } : null,
    { label: "Cost impact", value: impactLine(rfi.costImpact, rfi.costNote) },
    { label: "Schedule impact", value: impactLine(rfi.scheduleImpact, rfi.scheduleNote) },
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  if (rows.length === 0) return null;
  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Context</p>
      <div className="mt-2 overflow-hidden rounded-[16px] border border-brand-line/60 bg-white">
        {rows.map((row) => (
          <Fact key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-brand-line/70 px-3.5 py-3 last:border-b-0">
      <p className="text-[12px] text-brand-muted">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold leading-snug text-brand-navy">{value}</p>
    </div>
  );
}

function Attachments({ rfi }: { rfi: ProjectRfi }) {
  const images = rfi.attachments.filter(isImageAttachment);
  const docs = rfi.attachments.filter((item) => !isImageAttachment(item));
  if (images.length === 0 && docs.length === 0) {
    return (
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Attachments</p>
        <p className="mt-2 text-[14px] text-brand-muted">No attachments on this RFI.</p>
      </section>
    );
  }

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Attachments</p>
      {docs.length > 0 ? (
        <ul className="mt-2 overflow-hidden rounded-[16px] border border-brand-line/60 bg-white">
          {docs.map((name) => (
            <li key={name} className="border-b border-brand-line/70 px-3.5 py-3 last:border-b-0">
              <p className="text-[14px] font-semibold text-brand-navy">{name}</p>
              <p className="mt-0.5 text-[12px] text-brand-muted">On this RFI</p>
            </li>
          ))}
        </ul>
      ) : null}
      {images.length > 0 ? (
        <div className="mt-3">
          <PhotoAttachments photos={images} locked addLabel="Add evidence" hint="Photo or field condition" />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {images.map((src, index) => (
              <a
                key={`${src.slice(0, 24)}-${index}`}
                href={src}
                download={`rfi-evidence-${index + 1}.jpg`}
                className="text-[13px] font-semibold text-brand-navy"
              >
                {images.length > 1 ? `Download ${index + 1}` : "Download"}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ResponseBody({ rfi }: { rfi: ProjectRfi }) {
  if (rfi.responses.length === 0 && rfi.status === "open") {
    return (
      <>
        <p className="mt-2 text-[15px] font-semibold text-brand-navy">Awaiting response</p>
        <p className="mt-1 text-[14px] leading-relaxed text-brand-muted">No response has been submitted yet.</p>
      </>
    );
  }
  if (rfi.responses.length === 0 && rfi.status === "draft") {
    return (
      <>
        <p className="mt-2 text-[15px] font-semibold text-brand-navy">Not submitted</p>
        <p className="mt-1 text-[14px] leading-relaxed text-brand-muted">
          Submit this RFI when the question is ready for the field.
        </p>
      </>
    );
  }
  if (rfi.responses.length === 0 && rfi.status === "void") {
    return (
      <>
        <p className="mt-2 text-[15px] font-semibold text-brand-navy">Void</p>
        <p className="mt-1 text-[14px] leading-relaxed text-brand-muted">This RFI is void and stays on the project for the record.</p>
      </>
    );
  }
  if (rfi.responses.length === 0) {
    return <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">No response was recorded.</p>;
  }

  return (
    <ol className="mt-3 space-y-4">
      {rfi.responses.map((response) => (
        <li key={response.id} className="rounded-[16px] border border-brand-line/60 bg-white px-3.5 py-3.5">
          <p className="text-[14px] font-semibold text-brand-navy">{response.author}</p>
          <p className="mt-0.5 text-[12px] text-brand-muted">{response.timeLabel}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-brand-navy">{response.body}</p>
          {response.photos.length > 0 ? (
            <div className="mt-3">
              <PhotoAttachments photos={response.photos} locked />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function RfiDraftEditor({
  rfi,
  offline,
  role,
  onClose,
  onDenied,
}: {
  rfi: ProjectRfi;
  offline: boolean;
  role: MockRole;
  onClose: () => void;
  onDenied: () => void;
}) {
  const [title, setTitle] = useState(rfi.title);
  const [question, setQuestion] = useState(rfi.question);
  const [priority, setPriority] = useState<RfiPriority>(rfi.priority);
  const [dueDate, setDueDate] = useState(rfi.dueDate ?? "");
  const [assignedTo, setAssignedTo] = useState(rfi.assignedTo);
  const [specSection, setSpecSection] = useState(rfi.specSection);
  const [drawingNumber, setDrawingNumber] = useState(rfi.drawingNumber);
  const [location, setLocation] = useState(rfi.location);
  const [costImpact, setCostImpact] = useState(rfi.costImpact);
  const [scheduleImpact, setScheduleImpact] = useState(rfi.scheduleImpact);
  const [costNote, setCostNote] = useState(rfi.costNote);
  const [scheduleNote, setScheduleNote] = useState(rfi.scheduleNote);
  const [attachments, setAttachments] = useState(rfi.attachments);
  const ready = Boolean(title.trim() && question.trim());

  function payload() {
    return {
      title,
      question,
      priority,
      dueDate: dueDate || null,
      assignedTo,
      specSection,
      drawingNumber,
      location,
      costImpact,
      scheduleImpact,
      costNote,
      scheduleNote,
      attachments,
      offline,
    };
  }

  function save() {
    const saved = saveRfiEdits(rfi.id, payload(), role);
    if (!saved) {
      onDenied();
      return;
    }
    onClose();
  }

  function submit() {
    const saved = saveRfiEdits(rfi.id, payload(), role);
    if (!saved || !submitRfi(rfi.id, offline, role)) {
      onDenied();
      return;
    }
    onClose();
  }

  return (
    <main className="space-y-4 px-4 pb-16">
      <FieldText id="edit-subject" label="Subject" value={title} onChange={setTitle} placeholder="Mechanical room clearance" />
      <FieldText
        id="edit-question"
        label="Question"
        value={question}
        onChange={setQuestion}
        placeholder="What needs to be confirmed?"
        multiline
      />
      <ChoiceRow
        label="Priority"
        value={priority}
        onChange={setPriority}
        options={[
          { id: "low", label: "Low" },
          { id: "normal", label: "Normal" },
          { id: "high", label: "High" },
          { id: "urgent", label: "Urgent" },
        ]}
      />
      <label className="block" htmlFor="edit-due">
        <span className={fieldLabel}>Due date</span>
        <input id="edit-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={fieldInput} />
      </label>
      <FieldText id="edit-assigned" label="Assigned to" value={assignedTo} onChange={setAssignedTo} placeholder="Architect" />
      <FieldText id="edit-spec" label="Spec section" value={specSection} onChange={setSpecSection} placeholder="23 05 00" />
      <FieldText id="edit-drawing" label="Drawing" value={drawingNumber} onChange={setDrawingNumber} placeholder="M-204" />
      <FieldText id="edit-location" label="Location" value={location} onChange={setLocation} placeholder="Mechanical room" />
      <ChoiceRow
        label="Cost impact"
        value={costImpact ? "yes" : "no"}
        onChange={(id) => setCostImpact(id === "yes")}
        options={[
          { id: "no", label: "No" },
          { id: "yes", label: "Yes" },
        ]}
      />
      {costImpact ? (
        <FieldText id="edit-cost" label="Amount, if known" value={costNote} onChange={setCostNote} placeholder="No calculation" />
      ) : null}
      <ChoiceRow
        label="Schedule impact"
        value={scheduleImpact ? "yes" : "no"}
        onChange={(id) => setScheduleImpact(id === "yes")}
        options={[
          { id: "no", label: "No" },
          { id: "yes", label: "Yes" },
        ]}
      />
      {scheduleImpact ? (
        <FieldText id="edit-schedule" label="Days, if known" value={scheduleNote} onChange={setScheduleNote} placeholder="2 days" />
      ) : null}
      <PhotoAttachments photos={attachments} onChange={setAttachments} addLabel="Add evidence" hint="Drawing, photo, or site condition" />
      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={onClose} className="h-12 px-1 text-[14px] font-semibold text-brand-muted">
          Cancel
        </button>
        <div className="flex items-center gap-3">
          <button type="button" disabled={!ready} onClick={save} className="h-12 text-[14px] font-semibold text-brand-navy disabled:opacity-40">
            Save draft
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={submit}
            className="m-press h-12 min-w-[120px] rounded-full bg-brand-navy px-5 text-[15px] font-semibold text-white disabled:opacity-40"
          >
            Submit
          </button>
        </div>
      </div>
    </main>
  );
}
