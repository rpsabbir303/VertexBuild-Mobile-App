"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PhotoAttachments } from "@/components/mobile/daily-log/PhotoAttachments";
import { ChoiceRow, FieldText } from "@/components/mobile/daily-log/FieldBits";
import { fieldInput, fieldLabel, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { canAuthorRfi, createRfi, formatShortDate, impactLine, rfiPriorityLabel, type RfiPriority } from "@/lib/mobile/rfis";
import { IconBack } from "../icons";

const STEPS = [
  { id: "question", label: "Question" },
  { id: "priority", label: "Priority" },
  { id: "context", label: "Context" },
  { id: "evidence", label: "Evidence" },
  { id: "review", label: "Review" },
] as const;

export function RfiCreateScreen() {
  const router = useRouter();
  const { user, currentProject, isOffline } = useMobileApp();
  const allowed = canAuthorRfi(user.role);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [priority, setPriority] = useState<RfiPriority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [specSection, setSpecSection] = useState("");
  const [drawingNumber, setDrawingNumber] = useState("");
  const [location, setLocation] = useState("");
  const [costImpact, setCostImpact] = useState(false);
  const [scheduleImpact, setScheduleImpact] = useState(false);
  const [costNote, setCostNote] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [denied, setDenied] = useState(false);

  const canContinue = step !== 0 || Boolean(title.trim() && question.trim());
  const last = STEPS.length - 1;

  function save(submit: boolean) {
    const rfi = createRfi(
      {
        projectId: currentProject.id,
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
        author: `${user.firstName} ${user.lastName}`,
        offline: isOffline,
        submit,
      },
      user.role,
    );
    if (!rfi) {
      setDenied(true);
      return;
    }
    router.replace(`/mobile-preview/tools/rfis/${rfi.id}`);
  }

  if (!allowed || denied) {
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
          <h1 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">
            You don&apos;t have permission to create an RFI.
          </h1>
          <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
            Creating an RFI isn&apos;t available for your role.
          </p>
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

  return (
    <div className={mobilePageBg}>
      <header className="px-4 pb-2 pt-[max(12px,env(safe-area-inset-top))]">
        {step === 0 ? (
          <Link
            href="/mobile-preview/tools/rfis"
            className="m-press inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted"
          >
            <IconBack />
            RFI
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setStep((value) => value - 1)}
            className="m-press inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted"
          >
            <IconBack />
            Back
          </button>
        )}
        <h1 className="mt-2 text-[22px] font-bold tracking-[-0.03em] text-brand-navy">New RFI</h1>
        <p className="mt-1 text-[15px] font-semibold text-brand-navy">{currentProject.name}</p>
        <p className="mt-0.5 text-[13px] text-brand-muted">
          {currentProject.city}, {currentProject.state}
        </p>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">{STEPS[step].label}</p>
      </header>

      <main className="px-4 pb-16 pt-4">
        {step === 0 ? (
          <div className="space-y-4">
            <FieldText id="rfi-subject" label="Subject" value={title} onChange={setTitle} placeholder="Mechanical room clearance" />
            <FieldText
              id="rfi-question"
              label="Question"
              value={question}
              onChange={setQuestion}
              placeholder="What needs to be confirmed in the field?"
              multiline
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
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
            <label className="block" htmlFor="rfi-due">
              <span className={fieldLabel}>Due date</span>
              <input
                id="rfi-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={fieldInput}
              />
            </label>
            <p className="text-[13px] leading-relaxed text-brand-muted">Leave the date blank if this question has no due date yet.</p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <FieldText id="rfi-assigned" label="Assigned to" value={assignedTo} onChange={setAssignedTo} placeholder="Architect" />
            <FieldText id="rfi-spec" label="Spec section" value={specSection} onChange={setSpecSection} placeholder="23 05 00" />
            <FieldText id="rfi-drawing" label="Drawing" value={drawingNumber} onChange={setDrawingNumber} placeholder="M-204" />
            <FieldText id="rfi-location" label="Location" value={location} onChange={setLocation} placeholder="Mechanical room" />
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
              <FieldText id="rfi-cost" label="Amount, if known" value={costNote} onChange={setCostNote} placeholder="No calculation" />
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
              <FieldText
                id="rfi-schedule"
                label="Days, if known"
                value={scheduleNote}
                onChange={setScheduleNote}
                placeholder="2 days"
              />
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <PhotoAttachments
            photos={attachments}
            onChange={setAttachments}
            addLabel="Add evidence"
            hint="Drawing, photo, or site condition"
          />
        ) : null}

        {step === 4 ? (
          <div className="overflow-hidden rounded-[16px] border border-brand-line/60 bg-white">
            <ReviewRow label="Subject" value={title} />
            <ReviewRow label="Question" value={question} />
            <ReviewRow label="Priority" value={rfiPriorityLabel(priority)} />
            <ReviewRow label="Due" value={dueDate ? formatShortDate(dueDate) : ""} />
            <ReviewRow label="Assigned to" value={assignedTo} />
            <ReviewRow label="Spec section" value={specSection} />
            <ReviewRow label="Drawing" value={drawingNumber} />
            <ReviewRow label="Location" value={location} />
            <ReviewRow label="Cost impact" value={impactLine(costImpact, costNote)} />
            <ReviewRow label="Schedule impact" value={impactLine(scheduleImpact, scheduleNote)} />
            <ReviewRow label="Evidence" value={attachments.length > 0 ? `${attachments.length}` : ""} />
          </div>
        ) : null}

        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.12em] text-brand-mist">
          {step + 1} of {STEPS.length}
        </p>
        <div className={`mt-6 flex items-center gap-3 ${step === last ? "justify-between" : "justify-end"}`}>
          {step === last ? (
            <button
              type="button"
              disabled={!title.trim() || !question.trim()}
              onClick={() => save(false)}
              className="h-12 text-[14px] font-semibold text-brand-navy disabled:opacity-40"
            >
              Save draft
            </button>
          ) : null}
          {step < last ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep((value) => value + 1)}
              className="m-press h-12 min-w-[148px] rounded-full bg-brand-navy px-5 text-[15px] font-semibold text-white disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={!title.trim() || !question.trim()}
              onClick={() => save(true)}
              className="m-press h-12 min-w-[148px] rounded-full bg-brand-navy px-5 text-[15px] font-semibold text-white disabled:opacity-40"
            >
              Submit
            </button>
          )}
        </div>
        {isOffline ? (
          <p className="mt-4 text-[12px] leading-relaxed text-brand-muted">
            Saved on this device until the connection returns.
          </p>
        ) : null}
      </main>
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
