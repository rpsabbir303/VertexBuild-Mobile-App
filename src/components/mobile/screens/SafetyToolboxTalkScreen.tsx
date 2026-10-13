"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FieldText } from "@/components/mobile/daily-log/FieldBits";
import {
  acknowledgeToolboxParticipation,
  canAccessToolboxTalks,
  getUserParticipation,
  joinToolboxSession,
  loadToolboxSessionState,
  loadToolboxSignature,
  participantStatusLabel,
  resolveToolboxSessionsForProject,
  sessionStatusLabel,
  startToolboxSession,
  type ToolboxSessionState,
  type ToolboxTalkSession,
} from "@/lib/mobile/toolboxTalks";
import { mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { SAFETY_ROUTES, toolboxSignHref } from "@/lib/mobile/safety";
import { IconBack } from "../icons";
import { PermissionDeniedScreen } from "./PermissionDeniedScreen";
import { StatusBadge } from "../ui/StatusBadge";

type LoadPhase = "loading" | "empty" | "ready" | "success";

const PARTICIPANT_TONE: Record<string, "neutral" | "warning" | "success"> = {
  invited: "neutral",
  joined: "warning",
  acknowledged: "success",
};

const SESSION_TONE: Record<string, "neutral" | "warning" | "success"> = {
  scheduled: "neutral",
  in_progress: "warning",
  completed: "success",
};

export function SafetyToolboxTalkScreen() {
  const { user, currentProject, accessibleProjects, isOffline } = useMobileApp();
  const { session } = useMobileAuth();
  const allowed = canAccessToolboxTalks(
    user.role,
    accessibleProjects.map((p) => p.id),
    currentProject.id,
  );

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;
  const reporterEmail = session?.email ?? "demo@summitconstruction.com";
  const defaultName = `${user.firstName} ${user.lastName}`;

  const [loadPhase, setLoadPhase] = useState<LoadPhase>("loading");
  const [sessions, setSessions] = useState<ToolboxTalkSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<ToolboxSessionState | null>(null);
  const [participantName, setParticipantName] = useState(defaultName);
  const [crew, setCrew] = useState("");
  const [notes, setNotes] = useState("");
  const [understandingConfirmed, setUnderstandingConfirmed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [successReference, setSuccessReference] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId],
  );

  const myParticipation = sessionState ? getUserParticipation(sessionState, userKey) : null;
  const alreadyAcknowledged = Boolean(myParticipation?.acknowledgedAt);
  const existingSignature = activeId ? loadToolboxSignature(activeId, userKey) : null;

  const refreshState = useCallback((sessionId: string) => {
    const next = loadToolboxSessionState(sessionId);
    setSessionState(next);
    return next;
  }, []);

  useEffect(() => {
    setLoadPhase("loading");
    const timer = window.setTimeout(() => {
      const list = resolveToolboxSessionsForProject(currentProject.id);
      if (list.length === 0) {
        setSessions([]);
        setActiveId(null);
        setSessionState(null);
        setLoadPhase("empty");
        return;
      }
      setSessions(list);
      const firstId = list[0].id;
      setActiveId(firstId);
      const state = loadToolboxSessionState(firstId);
      setSessionState(state);
      setCrew(list[0].crewLabel);
      if (state && getUserParticipation(state, userKey)?.acknowledgedAt) {
        setLoadPhase("success");
        setSuccessReference(state.demoReference ?? "TB-0000");
        setSuccessNotice("You already acknowledged this toolbox talk.");
      } else {
        setLoadPhase("ready");
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [currentProject.id, userKey]);

  useEffect(() => {
    if (!activeId) return;
    const tmpl = sessions.find((s) => s.id === activeId);
    if (tmpl) setCrew(tmpl.crewLabel);
    refreshState(activeId);
  }, [activeId, refreshState, sessions]);

  function selectSession(id: string) {
    setActiveId(id);
    setFormError(null);
    setUnderstandingConfirmed(false);
    setSuccessReference(null);
    setLoadPhase("ready");
  }

  function handleStartSession() {
    if (!activeId) return;
    const next = startToolboxSession(activeId);
    setSessionState(next);
  }

  async function handleJoin() {
    if (!activeId || joining || alreadyAcknowledged) return;
    setJoining(true);
    setFormError(null);
    const result = joinToolboxSession(activeId, userKey, participantName, crew);
    setJoining(false);
    if (!result.ok) {
      if (result.code === "already_acknowledged") {
        setFormError("You have already acknowledged this session.");
      } else if (result.code === "completed") {
        setFormError("This toolbox talk is closed.");
      } else {
        setFormError("Unable to join this session.");
      }
      return;
    }
    setSessionState(result.state);
  }

  async function handleAcknowledge() {
    if (!activeId || submitting || alreadyAcknowledged) return;
    setFormError(null);
    setSubmitting(true);
    const result = await acknowledgeToolboxParticipation({
      sessionId: activeId,
      userKey,
      participantName,
      crew,
      understandingConfirmed,
      notes,
      reporterEmail,
      offline: isOffline,
    });
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setSessionState(result.state);
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
          <div className="h-6 w-48 animate-pulse rounded bg-brand-soft" />
        </header>
        <main className="space-y-3 px-4 py-4">
          <div className="h-40 animate-pulse rounded-[16px] bg-brand-soft/80" />
          <div className="h-24 animate-pulse rounded-[16px] bg-brand-soft/60" />
        </main>
      </div>
    );
  }

  if (loadPhase === "empty") {
    return (
      <div className={mobilePageBg}>
        <header className="border-b border-brand-line/50 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <Link
              href={SAFETY_ROUTES.home}
              className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
              aria-label="Back to Safety"
            >
              <IconBack />
            </Link>
            <h1 className="text-[17px] font-semibold text-brand-navy">Toolbox talks</h1>
          </div>
        </header>
        <main className="px-4 py-8 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))]">
          <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">No toolbox talks</h2>
          <p className="mt-2 max-w-[36ch] text-[14px] leading-relaxed text-brand-muted">
            No scheduled or active toolbox talks are available for {currentProject.name}.
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

  if (loadPhase === "success" && successReference && activeSession) {
    return (
      <div className={mobilePageBg}>
        <main className="px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(24px,env(safe-area-inset-top))]">
          <div className={`${mobileInsetCard} p-5`}>
            <StatusBadge tone="success" label="Participation recorded" />
            <h1 className="mt-3 text-[22px] font-bold tracking-[-0.03em] text-brand-navy">Acknowledgement saved</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">{successNotice}</p>
            <p className="mt-1 text-[13px] font-medium text-brand-navy">{activeSession.title}</p>
            <div className="mt-4 rounded-[12px] bg-brand-soft px-3.5 py-3">
              <p className="text-[12px] font-medium text-brand-muted">Reference</p>
              <p className="mt-0.5 font-mono text-[16px] font-semibold text-brand-navy">{successReference}</p>
            </div>
            {activeId ? (
              <Link
                href={toolboxSignHref(activeId)}
                className="m-press mt-4 flex h-11 w-full items-center justify-center rounded-full border border-brand-line text-[14px] font-semibold text-brand-navy"
              >
                {existingSignature ? "View signature" : "Add your signature"}
              </Link>
            ) : null}
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

  if (!activeSession || !sessionState) return null;

  const canJoin = sessionState.status === "in_progress" && !myParticipation?.joinedAt && !alreadyAcknowledged;
  const canAcknowledge = sessionState.status === "in_progress" && !alreadyAcknowledged;

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
              <h1 className="truncate text-[17px] font-semibold text-brand-navy">Toolbox talk</h1>
              <StatusBadge
                tone={SESSION_TONE[sessionState.status] ?? "neutral"}
                label={sessionStatusLabel(sessionState.status)}
              />
            </div>
            <p className="truncate text-[13px] font-medium text-brand-navy">{activeSession.title}</p>
            <p className="truncate text-[12px] text-brand-muted">
              {currentProject.name} · {activeSession.locationLabel}
            </p>
          </div>
        </div>

        {sessions.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto px-2 pb-1">
            {sessions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectSession(item.id)}
                className={`m-press shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                  item.id === activeId ? "bg-brand-navy text-white" : "border border-brand-line bg-white text-brand-navy"
                }`}
              >
                {item.topic}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <main className="space-y-5 px-4 py-4 pb-[max(10rem,calc(env(safe-area-inset-bottom)+9rem))]">
        <section className={`${mobileInsetCard} p-4`} aria-labelledby="tb-overview">
          <h2 id="tb-overview" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
            Session
          </h2>
          <dl className="mt-3 space-y-2.5 text-[14px]">
            <div>
              <dt className="text-[12px] text-brand-muted">Topic</dt>
              <dd className="font-semibold text-brand-navy">{activeSession.topic}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-brand-muted">When</dt>
              <dd className="font-medium text-brand-navy">{activeSession.scheduledLabel}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-brand-muted">Presenter</dt>
              <dd className="font-medium text-brand-navy">{activeSession.presenterName}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-brand-muted">Crew</dt>
              <dd className="font-medium text-brand-navy">{activeSession.crewLabel}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[14px] leading-relaxed text-brand-navy">{activeSession.description}</p>
        </section>

        <section aria-labelledby="tb-key-points">
          <h2 id="tb-key-points" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
            Key points
          </h2>
          <ol className={`mt-3 ${mobileInsetCard} list-decimal space-y-0 px-4 py-3 pl-8 text-[14px] leading-relaxed text-brand-navy`}>
            {activeSession.keyPoints.map((point) => (
              <li key={point} className="py-1.5">
                {point}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="tb-attendees">
          <h2 id="tb-attendees" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
            Participants
          </h2>
          <ul className={`mt-3 ${mobileInsetCard} divide-y divide-brand-line/60`}>
            {sessionState.roster.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-brand-navy">{person.name}</p>
                  <p className="text-[12px] text-brand-muted">{person.crew}</p>
                </div>
                <StatusBadge tone={PARTICIPANT_TONE[person.status] ?? "neutral"} label={participantStatusLabel(person.status)} />
              </li>
            ))}
          </ul>
          {myParticipation?.joinedAt && !alreadyAcknowledged ? (
            <p className="mt-2 text-[12px] font-medium text-brand-muted" role="status">
              You joined this session · {new Date(myParticipation.joinedAt).toLocaleTimeString()}
            </p>
          ) : null}
        </section>

        {sessionState.status === "scheduled" ? (
          <div className={`${mobileInsetCard} p-4`}>
            <p className="text-[14px] font-semibold text-brand-navy">Session not started</p>
            <p className="mt-1 text-[13px] text-brand-muted">
              Start the toolbox talk when the crew is assembled. Participation opens after the session is in progress.
            </p>
            <button
              type="button"
              onClick={handleStartSession}
              className="m-press mt-4 flex h-11 w-full items-center justify-center rounded-full bg-brand-navy text-[14px] font-semibold text-white"
            >
              Start session
            </button>
          </div>
        ) : null}

        {sessionState.status === "completed" ? (
          <p className="rounded-[12px] border border-brand-line/60 bg-brand-soft/50 px-3 py-2.5 text-[13px] text-brand-muted">
            This toolbox talk is closed. New acknowledgements are not accepted.
          </p>
        ) : null}

        {canJoin ? (
          <button
            type="button"
            disabled={joining}
            onClick={() => void handleJoin()}
            className="m-press flex h-11 w-full items-center justify-center rounded-full border border-brand-line bg-white text-[14px] font-semibold text-brand-navy disabled:opacity-50"
          >
            {joining ? "Joining…" : "Join session"}
          </button>
        ) : null}

        {alreadyAcknowledged && activeId ? (
          <div className={`${mobileInsetCard} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold text-brand-navy">Attendance signature</p>
                <p className="mt-0.5 text-[12px] text-brand-muted">
                  {existingSignature ? "Signed on this device" : "Add your signature to complete the record"}
                </p>
              </div>
              {existingSignature ? <StatusBadge tone="success" label="Signed" /> : <StatusBadge tone="warning" label="Pending" />}
            </div>
            <Link
              href={toolboxSignHref(activeId)}
              className="m-press mt-3 flex h-11 w-full items-center justify-center rounded-full bg-brand-navy text-[14px] font-semibold text-white"
            >
              {existingSignature ? "View signature" : "Sign attendance sheet"}
            </Link>
          </div>
        ) : null}

        {canAcknowledge ? (
          <section className={`${mobileInsetCard} space-y-4 p-4`} aria-labelledby="tb-participation">
            <h2 id="tb-participation" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
              Your participation
            </h2>
            <FieldText
              id="tb-name"
              label="Your name"
              required
              value={participantName}
              onChange={setParticipantName}
              error={formError && (formError.includes("name") || formError.includes("Enter your")) ? formError : null}
            />
            <FieldText id="tb-crew" label="Crew / company" value={crew} onChange={setCrew} />
            <FieldText
              id="tb-notes"
              label="Questions or notes (optional)"
              value={notes}
              onChange={setNotes}
              multiline
              placeholder="Anything to follow up with the presenter"
            />
            <label className="flex items-start gap-3 rounded-[12px] border border-brand-line/70 bg-brand-soft/40 px-3 py-3">
              <input
                type="checkbox"
                checked={understandingConfirmed}
                onChange={(event) => setUnderstandingConfirmed(event.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 rounded border-brand-line"
              />
              <span className="text-[14px] leading-snug text-brand-navy">
                I participated in this toolbox talk and understand the key safety points covered. *
              </span>
            </label>
            {formError && !formError.includes("name") ? (
              <p className="text-[13px] font-medium text-status-danger" role="alert">
                {formError}
              </p>
            ) : null}
          </section>
        ) : null}

      </main>

      {canAcknowledge ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line/60 bg-brand-canvas/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleAcknowledge()}
            className="m-press mx-auto flex h-12 w-full max-w-lg items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Acknowledge participation"}
          </button>
          {isOffline ? (
            <p className="mx-auto mt-2 max-w-lg text-center text-[12px] text-brand-muted">
              Offline — acknowledgement queues on this device.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
