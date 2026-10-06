"use client";

import { projectSubtitle } from "@/lib/mobile/mockData";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconChevronDown } from "./icons";

export function ProjectContextBar({ compact = false }: { compact?: boolean }) {
  const { currentProject, openProjectSelector } = useMobileApp();

  return (
    <button
      type="button"
      onClick={openProjectSelector}
      className="m-press flex w-full min-w-0 items-center gap-2 rounded-[16px] border border-brand-line/60 bg-white px-3.5 py-3 text-left shadow-[0_2px_12px_rgba(8,35,63,0.06)] active:scale-[0.99]"
      aria-label="Select project"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-brand-muted">Current Project</p>
        <p className="mt-0.5 truncate text-[15px] font-bold leading-snug tracking-[-0.01em] text-brand-navy">
          {currentProject.name}
        </p>
        {!compact ? (
          <p className="mt-0.5 truncate text-[12px] leading-snug text-brand-muted">
            {projectSubtitle(currentProject)}
          </p>
        ) : null}
      </div>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-softblue text-brand-blue">
        <IconChevronDown />
      </span>
    </button>
  );
}
