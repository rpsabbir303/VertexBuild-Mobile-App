"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ATTENTION_ITEMS,
  RECENT_ACTIVITY,
  greetingForHour,
} from "@/lib/mobile/mockData";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import type { AttentionItem } from "@/lib/mobile/types";
import {
  IconArrowUpRight,
  IconDailyLog,
  IconIssue,
  IconRfi,
  IconUpload,
} from "../icons";
import { mobileInsetCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import { MobileTopBar } from "../MobileTopBar";

const listCard = `${mobileInsetCard} border-white/80`;

const quickActions = [
  { id: "new_rfi", label: "New RFI", icon: IconRfi, href: "/mobile-preview/tools/rfis" },
  {
    id: "upload",
    label: "Upload Document",
    icon: IconUpload,
    href: "/mobile-preview/tools/documents",
  },
  {
    id: "daily_log",
    label: "Daily Log",
    icon: IconDailyLog,
    href: "/mobile-preview/tools/daily-logs",
  },
  { id: "issue", label: "Report Issue", icon: IconIssue, href: "/mobile-preview/tools/help" },
] as const;

const statusChip: Record<AttentionItem["statusTone"], string> = {
  danger: "bg-red-50 text-status-danger",
  warning: "bg-amber-50 text-status-warning",
  info: "bg-brand-softblue text-brand-blue",
  neutral: "bg-brand-soft text-brand-muted",
};

export function HomeScreen() {
  const { user, currentProject } = useMobileApp();

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  const attentionForProject = useMemo(() => {
    const forProject = ATTENTION_ITEMS.filter((a) => a.projectId === currentProject.id);
    return forProject.length > 0 ? forProject : ATTENTION_ITEMS.slice(0, 2);
  }, [currentProject.id]);

  const activityForProject = useMemo(() => {
    const forProject = RECENT_ACTIVITY.filter((a) => a.projectId === currentProject.id);
    return forProject.length > 0 ? forProject : RECENT_ACTIVITY.slice(0, 3);
  }, [currentProject.id]);

  const attentionCount = attentionForProject.length;
  const primaryAttention = attentionForProject[0];
  const secondaryAttention = attentionForProject.slice(1);

  return (
    <div className={mobilePageBg}>
      <MobileTopBar />
      <main className="px-4 pb-6 pt-4">
        <div className="mb-4">
          <p className="text-[22px] font-bold leading-tight tracking-[-0.03em] text-brand-navy">
            {greeting}, {user.firstName}
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-brand-muted">
            {attentionCount} {attentionCount === 1 ? "item needs" : "items need"} your attention on
            this project today.
          </p>
        </div>

        {primaryAttention ? (
          <section className="mb-5">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="m-section-title">Needs Attention</h2>
                <p className="m-section-meta">{attentionCount} items requiring review</p>
              </div>
            </div>

            <button
              type="button"
              className="m-press relative w-full overflow-hidden rounded-mobile-lg border border-white/60 bg-card-sky p-4 text-left shadow-card"
            >
              <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-brand-sky/25" />
              <div className="pointer-events-none absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-brand-blue/10" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={`inline-flex rounded-pill px-2.5 py-1 text-[11px] font-semibold ${statusChip[primaryAttention.statusTone]}`}
                  >
                    {primaryAttention.statusLine}
                  </span>
                  <p className="mt-3 text-[18px] font-bold leading-snug tracking-[-0.02em] text-brand-navy">
                    {primaryAttention.reference}
                  </p>
                  <p className="mt-1 text-[13px] text-brand-muted">{primaryAttention.detail}</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-brand-blue shadow-soft">
                  <IconArrowUpRight />
                </span>
              </div>

              <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-brand-line/70 pt-3">
                <p className="text-[12px] font-medium text-brand-muted">{primaryAttention.dueText}</p>
                <span className="inline-flex items-center gap-1 rounded-pill bg-brand-blue px-3 py-1.5 text-[12px] font-semibold text-white shadow-glow">
                  Review
                  <IconArrowUpRight className="text-white" />
                </span>
              </div>
            </button>

            {secondaryAttention.length > 0 ? (
              <ul className="mt-3 space-y-2.5">
                {secondaryAttention.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`m-press flex w-full items-center gap-3 p-3.5 text-left ${listCard}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-bold text-brand-navy">{item.reference}</p>
                          <span
                            className={`rounded-pill px-2 py-0.5 text-[10px] font-semibold ${statusChip[item.statusTone]}`}
                          >
                            {item.statusLine}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] text-brand-muted">{item.detail}</p>
                        <p className="mt-1 text-[11px] text-brand-mist">{item.dueText}</p>
                      </div>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-blue">
                        <IconArrowUpRight />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <section className="mb-5">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="m-section-title">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map(({ id, label, icon: Icon, href }) => (
              <Link
                key={id}
                href={href}
                className={`m-press flex min-h-[72px] flex-col justify-between p-3.5 ${listCard}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-softblue text-brand-blue">
                  <Icon />
                </span>
                <span className="text-[13px] font-semibold leading-tight text-brand-navy">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="m-section-title">Recent Activity</h2>
          </div>
          <ul className="space-y-2.5">
            {activityForProject.map((item) => (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-3 px-3.5 py-3.5 ${listCard}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-sky" />
                  <p className="min-w-0 truncate text-[13px] font-medium text-brand-navy">
                    {item.title}
                  </p>
                </div>
                <time className="shrink-0 text-[11px] tabular-nums text-brand-mist">
                  {item.timeLabel}
                </time>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
