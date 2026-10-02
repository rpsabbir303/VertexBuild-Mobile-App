"use client";

import {
  MOCK_PROJECTS,
  projectLocation,
  projectSubtitle,
} from "@/lib/mobile/mockData";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { ProjectContextBar } from "../ProjectContextBar";
import { StatusBadge } from "../ui/StatusBadge";

export function ProjectsScreen() {
  const { currentProject, setCurrentProjectId, openProjectSelector } = useMobileApp();

  return (
    <>
      <header className="border-b border-brand-line bg-brand-surface px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <h1 className="text-[20px] font-semibold tracking-tight text-brand-navy">Projects</h1>
        <p className="mt-1 text-[13px] text-brand-muted">Active jobs you can switch into field context.</p>
        <div className="mt-3 rounded-mobile-lg border border-brand-line bg-brand-soft/60 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
            Current project
          </p>
          <ProjectContextBar compact />
        </div>
      </header>

      <main className="px-4 py-4">
        <ul className="space-y-2">
          {MOCK_PROJECTS.map((project) => {
            const selected = project.id === currentProject.id;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => setCurrentProjectId(project.id)}
                  className={`flex w-full items-start gap-3 rounded-mobile-lg border px-3.5 py-3.5 text-left shadow-card transition active:scale-[0.99] ${
                    selected
                      ? "border-brand-blue/35 bg-brand-blue/[0.04]"
                      : "border-brand-line bg-brand-surface"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-brand-navy">{project.name}</p>
                    <p className="mt-0.5 text-[13px] text-brand-muted">{projectLocation(project)}</p>
                    <p className="mt-1 text-[12px] text-brand-muted">{projectSubtitle(project)}</p>
                  </div>
                  {selected ? (
                    <StatusBadge label="Selected" tone="info" />
                  ) : (
                    <StatusBadge label="Switch" tone="neutral" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={openProjectSelector}
          className="mt-4 w-full rounded-mobile-lg border border-dashed border-brand-line py-3 text-[14px] font-semibold text-brand-blue active:bg-brand-soft"
        >
          Open project selector sheet
        </button>
      </main>
    </>
  );
}
