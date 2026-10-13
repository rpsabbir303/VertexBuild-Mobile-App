"use client";

import Link from "next/link";
import { mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { canAccessToolSlug } from "@/lib/mobile/roleConfig";
import { SAFETY_ROUTES } from "@/lib/mobile/safety";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { PermissionDeniedScreen } from "./PermissionDeniedScreen";
import { IconBack } from "../icons";
import { MobileCard } from "../ui/MobileCard";

const TITLES: Record<string, { title: string; hint: string }> = {
  incident: {
    title: "Report an incident",
    hint: "Capture details, photos, and witnesses for field incidents.",
  },
  inspection: {
    title: "Safety inspection",
    hint: "Walk through checklists and record findings on site.",
  },
  toolbox: {
    title: "Toolbox talks",
    hint: "Review talk topics, confirm participation, and collect signatures.",
  },
  jha: {
    title: "JHA / JSA",
    hint: "Review job hazards and acknowledge controls before work starts.",
  },
};

export function SafetyWorkflowPlaceholder({ workflow }: { workflow: keyof typeof TITLES }) {
  const { currentProject, user, accessibleProjects } = useMobileApp();
  const meta = TITLES[workflow];
  const allowed = canAccessToolSlug(
    "safety",
    user.role,
    accessibleProjects.map((p) => p.id),
    currentProject.id,
  );

  if (!allowed) {
    return <PermissionDeniedScreen backHref="/mobile-preview/more" />;
  }

  return (
    <div className={mobilePageBg}>
      <header className="flex items-center gap-2 border-b border-brand-line/50 bg-brand-canvas/95 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
        <Link
          href={SAFETY_ROUTES.home}
          className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
          aria-label="Back to Safety"
        >
          <IconBack />
        </Link>
        <h1 className="truncate text-[17px] font-semibold text-brand-navy">{meta.title}</h1>
      </header>
      <main className="px-4 py-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))]">
        <MobileCard className={`p-4 ${mobileInsetCard}`}>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-muted">Coming next</p>
          <p className="mt-2 text-[15px] leading-relaxed text-brand-navy">
            {meta.title} for <span className="font-semibold">{currentProject.name}</span> will open here.
          </p>
          <p className="mt-3 text-[13px] text-brand-muted">{meta.hint}</p>
        </MobileCard>
      </main>
    </div>
  );
}
