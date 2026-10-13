"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { projectLocation, projectSubtitle } from "@/lib/mobile/mockData";
import { projectAvailableOffline } from "@/lib/mobile/offlineAuth";
import {
  TIME_ROUTES,
  confirmWorkforceSelection,
  getWorkforceCrewsForProject,
  isWorkforceCrewValidForProject,
  loadTimeShiftState,
  resolveWorkforceReturnPath,
  syncProjectContext,
  type TimeShiftState,
  type WorkforceSelectionInput,
} from "@/lib/mobile/timeTracking";
import { mobileElevatedCard, mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import type { MockProject, ProjectStatus } from "@/lib/mobile/types";
import { IconBack, IconCheck, IconSearch } from "../icons";
import { StatusBadge } from "../ui/StatusBadge";

type LoadPhase = "loading" | "ready" | "empty" | "error";
type SavePhase = "idle" | "saving" | "success";

function projectStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case "preconstruction":
      return "Preconstruction";
    case "closeout":
      return "Closeout";
    default:
      return "Active";
  }
}

function matchesProjectQuery(project: MockProject, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    project.name.toLowerCase().includes(q) ||
    project.city.toLowerCase().includes(q) ||
    project.state.toLowerCase().includes(q) ||
    project.sector.toLowerCase().includes(q) ||
    projectSubtitle(project).toLowerCase().includes(q)
  );
}

export function ProjectCrewSelectionScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPath = resolveWorkforceReturnPath(searchParams.get("returnTo"));

  const { user, currentProject, setCurrentProjectId, accessibleProjects, isOffline } = useMobileApp();
  const { session } = useMobileAuth();

  const userKey = session?.email ?? `${user.firstName}-${user.lastName}`;

  const [loadPhase, setLoadPhase] = useState<LoadPhase>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shift, setShift] = useState<TimeShiftState | null>(null);

  const [draftProjectId, setDraftProjectId] = useState<string | null>(null);
  const [draftCrewId, setDraftCrewId] = useState<string | null>(null);
  const [projectQuery, setProjectQuery] = useState("");
  const [crewsLoading, setCrewsLoading] = useState(false);
  const [savePhase, setSavePhase] = useState<SavePhase>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const lockProjectChange = shift?.status === "on_shift";

  const draftProject = useMemo(() => {
    if (!draftProjectId) return null;
    return accessibleProjects.find((p) => p.id === draftProjectId) ?? null;
  }, [accessibleProjects, draftProjectId]);

  const availableCrews = useMemo(() => {
    if (!draftProjectId) return [];
    return getWorkforceCrewsForProject(draftProjectId);
  }, [draftProjectId]);

  const filteredProjects = useMemo(() => {
    return accessibleProjects.filter((p) => matchesProjectQuery(p, projectQuery));
  }, [accessibleProjects, projectQuery]);

  const draftCrewLabel = useMemo(() => {
    if (!draftCrewId) return null;
    return availableCrews.find((c) => c.id === draftCrewId)?.label ?? null;
  }, [availableCrews, draftCrewId]);

  const canConfirm =
    Boolean(draftProject && draftCrewId && draftCrewLabel) &&
    savePhase !== "saving" &&
    !crewsLoading &&
    loadPhase === "ready";

  const reloadShift = useCallback(() => {
    let state = loadTimeShiftState(userKey, currentProject.id, currentProject.name);
    state = syncProjectContext(userKey, state, currentProject.id, currentProject.name);
    setShift(state);
    return state;
  }, [userKey, currentProject.id, currentProject.name]);

  useEffect(() => {
    setLoadPhase("loading");
    setLoadError(null);
    const timer = window.setTimeout(() => {
      try {
        if (accessibleProjects.length === 0) {
          setLoadPhase("empty");
          return;
        }
        const state = reloadShift();
        const onShift = state.status === "on_shift";
        const initialProjectId = onShift ? state.projectId : currentProject.id;
        const projectOk = accessibleProjects.some((p) => p.id === initialProjectId);
        const projectId = projectOk ? initialProjectId : accessibleProjects[0]!.id;

        setDraftProjectId(projectId);
        const crewValid = isWorkforceCrewValidForProject(state.crewId, projectId);
        setDraftCrewId(crewValid ? state.crewId : null);
        setLoadPhase("ready");
      } catch {
        setLoadError("Could not load your project list. Try again.");
        setLoadPhase("error");
      }
    }, 320);
    return () => window.clearTimeout(timer);
  }, [accessibleProjects, currentProject.id, reloadShift]);

  useEffect(() => {
    if (!draftProjectId || loadPhase !== "ready") return;
    setCrewsLoading(true);
    const timer = window.setTimeout(() => {
      setCrewsLoading(false);
      setDraftCrewId((prev) => (isWorkforceCrewValidForProject(prev, draftProjectId) ? prev : null));
    }, 260);
    return () => window.clearTimeout(timer);
  }, [draftProjectId, loadPhase]);

  function selectProject(project: MockProject) {
    if (lockProjectChange && shift && project.id !== shift.projectId) return;
    const offlineOk = !isOffline || projectAvailableOffline(project.id);
    if (!offlineOk) return;
    setFormError(null);
    setDraftProjectId(project.id);
  }

  function selectCrew(crewId: string) {
    setFormError(null);
    setDraftCrewId(crewId);
  }

  async function handleConfirm() {
    if (!shift || !draftProject || !draftCrewId || !draftCrewLabel || !canConfirm || inFlightRef.current) return;

    const input: WorkforceSelectionInput = {
      projectId: draftProject.id,
      projectName: draftProject.name,
      crewId: draftCrewId,
      crewLabel: draftCrewLabel,
    };

    inFlightRef.current = true;
    setSavePhase("saving");
    setFormError(null);

    const result = await confirmWorkforceSelection(userKey, shift, input);
    setShift(result.state);
    inFlightRef.current = false;

    if (!result.ok) {
      setSavePhase("idle");
      setFormError(result.message);
      return;
    }

    if (!lockProjectChange) {
      setCurrentProjectId(draftProject.id);
    }

    setSavePhase("success");
    window.setTimeout(() => {
      router.replace(returnPath);
    }, 700);
  }

  function retryLoad() {
    setLoadPhase("loading");
    setLoadError(null);
    window.setTimeout(() => {
      if (accessibleProjects.length === 0) {
        setLoadPhase("empty");
        return;
      }
      reloadShift();
      setLoadPhase("ready");
    }, 320);
  }

  if (loadPhase === "loading") {
    return (
      <div className={mobilePageBg}>
        <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="h-6 w-48 animate-pulse rounded bg-brand-soft" />
          <div className="mt-6 h-56 animate-pulse rounded-[18px] bg-brand-soft/80" />
        </div>
      </div>
    );
  }

  if (loadPhase === "error") {
    return (
      <div className={mobilePageBg}>
        <header className="border-b border-brand-line/50 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <Link
              href={TIME_ROUTES.home}
              className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
              aria-label="Back to Time"
            >
              <IconBack />
            </Link>
            <h1 className="text-[17px] font-semibold text-brand-navy">Project &amp; crew</h1>
          </div>
        </header>
        <main className="px-4 py-8 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))]">
          <div className={`${mobileInsetCard} p-5`} role="alert">
            <p className="text-[15px] font-semibold text-status-danger">Could not load selection</p>
            <p className="mt-2 text-[14px] text-brand-navy">{loadError}</p>
            <button type="button" onClick={retryLoad} className="m-press mt-4 text-[14px] font-semibold text-brand-blue">
              Try again
            </button>
          </div>
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
              href={TIME_ROUTES.home}
              className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
              aria-label="Back to Time"
            >
              <IconBack />
            </Link>
            <h1 className="text-[17px] font-semibold text-brand-navy">Project &amp; crew</h1>
          </div>
        </header>
        <main className="px-4 py-8 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))]">
          <div className={`${mobileInsetCard} p-5`}>
            <StatusBadge tone="neutral" label="No projects" />
            <p className="mt-3 text-[15px] leading-relaxed text-brand-navy">
              Your account does not have access to any VertexBuild projects. Contact your administrator or
              try another role.
            </p>
            <Link
              href={TIME_ROUTES.home}
              className="m-press mt-5 flex h-12 w-full items-center justify-center rounded-full bg-brand-blue text-[15px] font-semibold text-white"
            >
              Back to Time
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (savePhase === "success") {
    return (
      <div className={mobilePageBg}>
        <main className="flex min-h-[50vh] flex-col items-center justify-center px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(24px,env(safe-area-inset-top))]">
          <StatusBadge tone="success" label="Selection saved" />
          <p className="mt-4 text-[18px] font-bold text-brand-navy">Project and crew updated</p>
          <p className="mt-2 text-[14px] text-brand-muted">Returning…</p>
        </main>
      </div>
    );
  }

  const showProjectSearch = accessibleProjects.length > 3;

  return (
    <div className={mobilePageBg}>
      <header className="border-b border-brand-line/50 bg-brand-canvas/95 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <Link
            href={returnPath}
            className="m-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
            aria-label="Back"
          >
            <IconBack />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-brand-navy">Project &amp; crew</h1>
            <p className="text-[13px] text-brand-muted">Choose where you are working and your crew for clock-in.</p>
            <p className="mt-0.5 text-[12px] text-brand-muted">
              {user.firstName} {user.lastName} · {user.roleLabel}
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-4 px-4 py-4 pb-[max(10rem,calc(env(safe-area-inset-bottom)+9rem))]">
        {lockProjectChange && shift ? (
          <div className="rounded-[12px] border border-[#E8D4A8] bg-[#FFF8EB] px-3 py-2.5" role="status">
            <p className="text-[13px] font-medium text-[#8A6232]">
              Active shift on <span className="font-semibold">{shift.projectName}</span>. Project is locked until you
              clock out; you can still update crew if eligible.
            </p>
          </div>
        ) : null}

        <section className={`${mobileElevatedCard} p-4`} aria-labelledby="project-picker-heading">
          <h2 id="project-picker-heading" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
            Project
          </h2>
          <p className="mt-1 text-[12px] text-brand-muted">
            {accessibleProjects.length} project{accessibleProjects.length === 1 ? "" : "s"} available to your role.
          </p>

          {showProjectSearch ? (
            <label className="relative mt-3 block">
              <span className="sr-only">Search projects</span>
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-mist" />
              <input
                type="search"
                value={projectQuery}
                onChange={(e) => setProjectQuery(e.target.value)}
                placeholder="Search projects…"
                className="w-full rounded-[12px] border border-brand-line bg-brand-soft py-2.5 pl-10 pr-3 text-[15px] text-brand-navy outline-none placeholder:text-brand-mist focus:border-brand-blue/40 focus:bg-white focus:ring-2 focus:ring-brand-blue/15"
                autoComplete="off"
              />
            </label>
          ) : null}

          <ul className="mt-3 space-y-2">
            {filteredProjects.length === 0 ? (
              <li className={`${mobileInsetCard} px-3 py-6 text-center`}>
                <p className="text-[14px] font-semibold text-brand-navy">No matching projects</p>
                <p className="mt-1 text-[13px] text-brand-muted">Try another search term.</p>
              </li>
            ) : (
              filteredProjects.map((project) => {
                const selected = project.id === draftProjectId;
                const offlineOk = !isOffline || projectAvailableOffline(project.id);
                const locked = lockProjectChange && shift && project.id !== shift.projectId;
                const disabled = !offlineOk || locked;

                return (
                  <li key={project.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => selectProject(project)}
                      aria-pressed={selected}
                      className={`m-press flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3.5 text-left disabled:opacity-50 ${
                        selected ? "bg-brand-softblue ring-1 ring-brand-blue/25" : "bg-brand-soft/40 active:bg-brand-soft"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-[15px] text-brand-navy ${selected ? "font-bold" : "font-semibold"}`}>
                          {project.name}
                        </p>
                        <p className="mt-0.5 text-[12px] text-brand-muted">{projectLocation(project)}</p>
                        <p className="mt-0.5 text-[11px] text-brand-mist">
                          {isOffline
                            ? offlineOk
                              ? "Available offline"
                              : "Unavailable offline"
                            : `${project.sector} · ${projectStatusLabel(project.status)}`}
                        </p>
                      </div>
                      {selected ? (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white">
                          <IconCheck strokeWidth={2.5} />
                        </span>
                      ) : (
                        <span className="h-7 w-7 shrink-0 rounded-full border border-brand-line" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        <section className={`${mobileInsetCard} p-4`} aria-labelledby="crew-picker-heading">
          <h2 id="crew-picker-heading" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
            Crew
          </h2>
          <p className="mt-1 text-[12px] text-brand-muted">
            {draftProject ? `Crews for ${draftProject.name}` : "Select a project first."}
          </p>

          {crewsLoading ? (
            <div className="mt-4 space-y-2" role="status" aria-live="polite">
              <div className="h-12 animate-pulse rounded-[12px] bg-brand-soft" />
              <div className="h-12 animate-pulse rounded-[12px] bg-brand-soft" />
              <p className="text-[13px] text-brand-muted">Loading crews…</p>
            </div>
          ) : !draftProjectId ? (
            <p className="mt-4 text-[14px] text-brand-muted">Choose a project to see crews.</p>
          ) : availableCrews.length === 0 ? (
            <div className="mt-4 rounded-[12px] bg-brand-soft/60 px-3 py-4">
              <p className="text-[14px] font-semibold text-brand-navy">No crews available</p>
              <p className="mt-1 text-[13px] text-brand-muted">
                This project has no crews assigned. Pick another project or contact your superintendent.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2" role="listbox" aria-label="Crew options">
              {availableCrews.map((crew) => {
                const selected = crew.id === draftCrewId;
                return (
                  <li key={crew.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => selectCrew(crew.id)}
                      className={`m-press flex min-h-[52px] w-full items-center justify-between gap-3 rounded-[12px] px-3.5 text-left ${
                        selected ? "bg-brand-navy text-white" : "bg-white ring-1 ring-brand-line active:bg-brand-soft"
                      }`}
                    >
                      <span className={`text-[15px] font-semibold ${selected ? "text-white" : "text-brand-navy"}`}>
                        {crew.label}
                      </span>
                      {selected ? (
                        <IconCheck className="text-white" strokeWidth={2.5} />
                      ) : (
                        <span className="h-5 w-5 rounded-full border border-brand-line" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {!draftCrewId && draftProjectId && !crewsLoading && availableCrews.length > 0 ? (
          <p className="text-[13px] font-medium text-[#8A6232]" role="status">
            Select a crew to continue — required before clock-in.
          </p>
        ) : null}

        {formError ? (
          <div className="rounded-[12px] border border-status-danger/30 bg-red-50 px-3 py-2.5" role="alert">
            <p className="text-[14px] font-semibold text-status-danger">Could not save selection</p>
            <p className="mt-0.5 text-[13px] text-brand-navy">{formError}</p>
            <button type="button" onClick={() => void handleConfirm()} className="m-press mt-2 text-[13px] font-semibold text-brand-blue">
              Retry
            </button>
          </div>
        ) : null}

        <p className="text-[11px] leading-relaxed text-brand-mist">
          Your selection is saved on this device for clock-in and time tracking.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line/60 bg-brand-canvas/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => void handleConfirm()}
          className="m-press mx-auto flex h-[52px] w-full max-w-lg items-center justify-center rounded-[14px] bg-brand-blue text-[16px] font-semibold text-white shadow-glow disabled:opacity-50"
        >
          {savePhase === "saving" ? "Saving…" : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
