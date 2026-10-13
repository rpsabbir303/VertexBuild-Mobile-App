"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getSafetyHomeForProject,
  overviewLevelLabel,
  projectHasSafetyMock,
  SAFETY_ROUTES,
  type SafetyOverviewLevel,
  type SafetyPendingItem,
} from "@/lib/mobile/safety";
import { mobileElevatedCard, mobileIconTile, mobilePageBg } from "@/lib/mobile/mobileUi";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import {
  IconChevronDown,
  IconChevronRight,
  IconSafetyIncident,
  IconSafetyInspection,
  IconSafetyJha,
  IconSafetyToolbox,
} from "../icons";

type Phase = "loading" | "ready" | "error";

const OVERVIEW_STYLES: Record<
  SafetyOverviewLevel,
  { ring: string; pill: string; dot: string }
> = {
  normal: {
    ring: "border-[#1B6B45]/25 bg-[#F4FAF7]",
    pill: "bg-[#E8F5EE] text-[#1B6B45]",
    dot: "bg-status-success",
  },
  attention: {
    ring: "border-[#C9957A]/35 bg-[#FDF8F4]",
    pill: "bg-[#F5EBE3] text-[#8A6232]",
    dot: "bg-[#C9957A]",
  },
  critical: {
    ring: "border-status-danger/25 bg-[#FEF6F5]",
    pill: "bg-red-50 text-status-danger",
    dot: "bg-status-danger",
  },
};

const STATUS_TONE: Record<SafetyPendingItem["statusTone"], string> = {
  neutral: "text-brand-muted",
  attention: "text-[#8A6232]",
  critical: "text-status-danger",
};

function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-4 pt-4">
      <div className={`h-28 rounded-[18px] border border-brand-line/40 bg-white`} />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[88px] rounded-[16px] bg-brand-soft/80" />
        ))}
      </div>
      <div className="h-32 rounded-[16px] bg-brand-soft/60" />
    </div>
  );
}

function PendingRow({ item }: { item: SafetyPendingItem }) {
  return (
    <Link href={item.href} className="m-press flex items-center gap-3 border-t border-brand-line/45 px-4 py-3.5 first:border-t-0 active:bg-brand-soft/60">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-brand-navy">{item.title}</span>
        <span className="mt-0.5 block truncate text-[12px] text-brand-muted">{item.subtitle}</span>
      </span>
      <span className={`shrink-0 text-[11px] font-bold uppercase tracking-wide ${STATUS_TONE[item.statusTone]}`}>
        {item.statusLabel}
      </span>
      <IconChevronRight className="h-[18px] w-[18px] shrink-0 text-brand-mist" strokeWidth={1.75} />
    </Link>
  );
}

export function SafetyHomeScreen() {
  const { currentProject, openProjectSelector, isOffline } = useMobileApp();
  const [phase, setPhase] = useState<Phase>("loading");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setPhase("loading");
    const timer = window.setTimeout(() => {
      if (isOffline && !projectHasSafetyMock(currentProject.id)) {
        setPhase("error");
        return;
      }
      setPhase("ready");
    }, 300);
    return () => window.clearTimeout(timer);
  }, [currentProject.id, isOffline, retry]);

  const data = getSafetyHomeForProject(currentProject.id);
  const overviewStyle = OVERVIEW_STYLES[data.overviewLevel];
  const inspectionLabel = data.activeInspectionId ? "Continue inspection" : "Start inspection";

  return (
    <div className={`${mobilePageBg} overflow-x-hidden`}>
      <div className="mx-auto max-w-lg px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-[max(12px,env(safe-area-inset-top))]">
        <header className="border-b border-brand-line/45 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-mist">Field safety</p>
              <h1 className="mt-1 text-[26px] font-bold leading-none tracking-[-0.04em] text-brand-navy">Safety</h1>
            </div>
            <Link
              href="/mobile-preview/more"
              className="m-press mt-1 shrink-0 rounded-full border border-brand-line/70 bg-white/80 px-3 py-1.5 text-[12px] font-semibold text-brand-muted transition active:scale-[0.98]"
            >
              More
            </Link>
          </div>

          <button
            type="button"
            onClick={openProjectSelector}
            className="m-press group mt-4 flex w-full items-start gap-2 text-left transition active:opacity-90"
            aria-label={`Active project, ${currentProject.name}. Change project.`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[18px] font-semibold leading-tight tracking-[-0.025em] text-brand-navy">
                {currentProject.name}
              </span>
              <span className="mt-0.5 block text-[13px] text-brand-muted">
                {currentProject.city}, {currentProject.state}
              </span>
            </span>
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-line/60 bg-white text-brand-mist transition group-active:border-brand-line">
              <IconChevronDown className="h-4 w-4" />
            </span>
          </button>

          {phase === "ready" && isOffline ? (
            <p className="mt-2 text-[12px] font-medium text-brand-muted" role="status">
              Offline — showing saved safety summary for this project
            </p>
          ) : null}
        </header>

        {phase === "loading" ? <OverviewSkeleton /> : null}

        {phase === "error" ? (
          <div className="pt-10">
            <h2 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">Unable to load Safety</h2>
            <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
              Connect to load the safety hub for this project.
            </p>
            <button
              type="button"
              onClick={() => setRetry((n) => n + 1)}
              className="m-press mt-5 rounded-mobile bg-brand-blue px-5 py-3 text-[15px] font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : null}

        {phase === "ready" ? (
          <div className="space-y-5 pt-4">
            <section
              className={`rounded-[18px] border p-4 ${overviewStyle.ring}`}
              aria-labelledby="safety-overview-heading"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p id="safety-overview-heading" className="text-[12px] font-semibold uppercase tracking-wide text-brand-muted">
                    Site status
                  </p>
                  <h2 className="mt-1 text-[18px] font-bold tracking-[-0.02em] text-brand-navy">
                    {data.overviewHeadline}
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-brand-muted">{data.overviewDetail}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${overviewStyle.pill}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${overviewStyle.dot}`} aria-hidden="true" />
                  {overviewLevelLabel(data.overviewLevel)}
                </span>
              </div>
              {data.openItemsCount > 0 ? (
                <p className="mt-3 text-[13px] font-medium text-brand-navy">
                  {data.openItemsCount} open field {data.openItemsCount === 1 ? "item" : "items"}
                </p>
              ) : null}
            </section>

            <section aria-labelledby="safety-actions-heading">
              <h2 id="safety-actions-heading" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
                Priority actions
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link
                  href={SAFETY_ROUTES.incident}
                  className="m-press flex flex-col gap-2 rounded-[16px] border border-brand-line/60 bg-white p-3.5 shadow-[0_2px_12px_rgba(8,35,63,0.05)] active:scale-[0.99]"
                >
                  <span className={mobileIconTile}>
                    <IconSafetyIncident className="text-brand-blue" />
                  </span>
                  <span className="text-[14px] font-semibold leading-snug text-brand-navy">Report incident</span>
                </Link>
                <Link
                  href={SAFETY_ROUTES.inspection}
                  className="m-press flex flex-col gap-2 rounded-[16px] border border-brand-line/60 bg-white p-3.5 shadow-[0_2px_12px_rgba(8,35,63,0.05)] active:scale-[0.99]"
                >
                  <span className={mobileIconTile}>
                    <IconSafetyInspection className="text-brand-blue" />
                  </span>
                  <span className="text-[14px] font-semibold leading-snug text-brand-navy">{inspectionLabel}</span>
                </Link>
                <Link
                  href={SAFETY_ROUTES.toolbox}
                  className="m-press flex flex-col gap-2 rounded-[16px] border border-brand-line/60 bg-white p-3.5 shadow-[0_2px_12px_rgba(8,35,63,0.05)] active:scale-[0.99]"
                >
                  <span className={mobileIconTile}>
                    <IconSafetyToolbox className="text-brand-blue" />
                  </span>
                  <span className="text-[14px] font-semibold leading-snug text-brand-navy">Toolbox talks</span>
                </Link>
                <Link
                  href={SAFETY_ROUTES.jha}
                  className="m-press flex flex-col gap-2 rounded-[16px] border border-brand-line/60 bg-white p-3.5 shadow-[0_2px_12px_rgba(8,35,63,0.05)] active:scale-[0.99]"
                >
                  <span className={mobileIconTile}>
                    <IconSafetyJha className="text-brand-blue" />
                  </span>
                  <span className="text-[14px] font-semibold leading-snug text-brand-navy">Review JHA/JSA</span>
                </Link>
              </div>
            </section>

            <section aria-labelledby="safety-pending-heading">
              <h2 id="safety-pending-heading" className="text-[13px] font-semibold uppercase tracking-wide text-brand-muted">
                Needs attention
              </h2>
              {data.pending.length === 0 ? (
                <div className="mt-3 rounded-[16px] border border-brand-line/50 bg-white px-4 py-8 text-center">
                  <p className="text-[15px] font-semibold text-brand-navy">Nothing pending</p>
                  <p className="mt-1 text-[13px] text-brand-muted">
                    No inspections, acknowledgements, or follow-ups require action right now.
                  </p>
                </div>
              ) : (
                <div className={`mt-3 overflow-hidden ${mobileElevatedCard}`}>
                  {data.pending.map((item) => (
                    <PendingRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
