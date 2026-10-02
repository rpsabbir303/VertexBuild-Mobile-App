"use client";

import Link from "next/link";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconBack } from "../icons";
import { MobileCard } from "../ui/MobileCard";

const labels: Record<string, string> = {
  punch: "Punch",
  safety: "Safety",
  drawings: "Drawings",
  documents: "Documents",
  meetings: "Meetings",
  ai: "AI",
  profile: "Profile",
};

const moduleHints: Record<string, string> = {
  safety:
    "Safety Home — incident capture, inspections, toolbox talks, JHA/JSA, and signatures open from this module.",
  ai: "AI-assisted field workflows including voice-to-log.",
};

export function ToolPlaceholderScreen({ slug }: { slug: string }) {
  const { currentProject, user } = useMobileApp();
  const title = labels[slug] ?? slug.replace(/-/g, " ");

  return (
    <>
      <header className="flex items-center gap-2 border-b border-brand-line bg-brand-surface px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <Link
          href="/mobile-preview/more"
          className="flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
          aria-label="Back to More"
        >
          <IconBack />
        </Link>
        <h1 className="truncate text-[17px] font-semibold text-brand-navy">{title}</h1>
      </header>
      <main className="px-4 py-4">
        <MobileCard className="p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-muted">
            Module placeholder
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-brand-navy/90">
            {title} for <span className="font-semibold">{currentProject.name}</span> would load
            here. Mock role: {user.roleLabel}.
          </p>
          {moduleHints[slug] ? (
            <p className="mt-3 text-[13px] text-brand-muted">{moduleHints[slug]}</p>
          ) : (
            <p className="mt-3 text-[13px] text-brand-muted">
              This route connects the documented More menu to the mobile module shell.
            </p>
          )}
        </MobileCard>
      </main>
    </>
  );
}
