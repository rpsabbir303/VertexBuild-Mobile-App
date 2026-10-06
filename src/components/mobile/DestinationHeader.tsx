"use client";

import { projectSubtitle } from "@/lib/mobile/mockData";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";

export function DestinationHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { currentProject, openProjectSelector } = useMobileApp();

  return (
    <header className="border-b border-brand-line/50 bg-brand-canvas/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
      <h1 className="text-[20px] font-bold tracking-[-0.02em] text-brand-navy">{title}</h1>
      {subtitle ? <p className="mt-1 text-[13px] text-brand-muted">{subtitle}</p> : null}
      <button
        type="button"
        onClick={openProjectSelector}
        className="m-press mt-3 w-full rounded-[16px] border border-brand-line/60 bg-white px-3.5 py-2.5 text-left shadow-[0_2px_12px_rgba(8,35,63,0.06)]"
        aria-label="Select project"
      >
        <p className="truncate text-[14px] font-semibold text-brand-navy">{currentProject.name}</p>
        <p className="mt-0.5 truncate text-[12px] text-brand-muted">
          {projectSubtitle(currentProject)}
        </p>
      </button>
    </header>
  );
}
