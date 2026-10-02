"use client";

import Link from "next/link";
import { useMemo } from "react";
import { projectSubtitle } from "@/lib/mobile/mockData";
import { filterMenuForRole, type MoreMenuItem } from "@/lib/mobile/roleConfig";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { MoreMenuIcon } from "../moreMenuIcons";
import { IconBack, IconBuildingProject, IconChevronRight } from "../icons";

function MoreMenuRow({
  item,
  unreadCount,
}: {
  item: MoreMenuItem;
  unreadCount: number;
}) {
  const isAi = item.id === "ai";
  const isNotifications = item.id === "notifications";
  const showBadge = isNotifications && unreadCount > 0;

  return (
    <Link
      href={item.href}
      className={`group m-press flex min-h-[52px] items-center gap-3.5 px-4 py-3 transition-colors active:scale-[0.995] ${
        isAi ? "bg-brand-softblue/20 active:bg-brand-softblue/35" : "active:bg-brand-soft/80"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border transition-colors ${
          isAi
            ? "border-brand-blue/15 bg-brand-softblue/50 text-brand-blue group-active:border-brand-blue/25"
            : "border-brand-line/70 bg-[#F4F7FA] text-brand-navy group-active:border-brand-blue/20 group-active:bg-brand-soft"
        }`}
      >
        <MoreMenuIcon id={item.id} className={isAi ? "text-brand-blue" : "text-brand-navy"} />
      </span>

      <span
        className={`min-w-0 flex-1 truncate ${isAi ? "text-[15px] font-semibold text-brand-navy" : "text-[15px] font-medium text-brand-navy"}`}
      >
        {item.label}
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {showBadge ? (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-pill bg-brand-blue px-1.5 text-[11px] font-bold tabular-nums text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
        <IconChevronRight
          strokeWidth={1.75}
          className="h-[18px] w-[18px] text-brand-mist transition-transform group-active:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

export function MoreScreen() {
  const { user, currentProject, accessibleProjects, unreadCount, openProjectSelector } =
    useMobileApp();

  const accessibleProjectIds = useMemo(
    () => accessibleProjects.map((p) => p.id),
    [accessibleProjects],
  );

  const sections = useMemo(
    () => filterMenuForRole(user.role, accessibleProjectIds, currentProject.id),
    [user.role, accessibleProjectIds, currentProject.id],
  );

  return (
    <div className="min-h-full bg-[#EEF3F8]">
      <header className="sticky top-0 z-10 border-b border-brand-line/50 bg-[#EEF3F8]/95 px-4 pb-3 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="relative flex items-center justify-center py-1">
          <Link
            href="/mobile-preview"
            className="m-press absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border border-brand-line/60 bg-white/90 text-brand-navy shadow-[0_1px_2px_rgba(8,35,63,0.06)] active:bg-brand-soft"
            aria-label="Back to Home"
          >
            <IconBack />
          </Link>
          <h1 className="text-[17px] font-bold tracking-[-0.02em] text-brand-navy">Menu</h1>
        </div>
      </header>

      <main className="space-y-6 px-4 pb-8 pt-4">
        <section className="overflow-hidden rounded-[18px] border border-brand-line/60 bg-white shadow-[0_2px_12px_rgba(8,35,63,0.06)]">
          <div className="flex gap-3.5 p-4">
            <div className="relative shrink-0">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px] bg-brand-navy text-[15px] font-bold tracking-wide text-white shadow-[0_2px_8px_rgba(8,35,63,0.18)]">
                {user.initials}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="truncate text-[17px] font-bold tracking-[-0.02em] text-brand-navy">
                {user.firstName} {user.lastName}
              </p>
              <span className="mt-1.5 inline-flex rounded-pill border border-brand-line/70 bg-[#F4F7FA] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-brand-muted">
                {user.roleLabel}
              </span>
            </div>
          </div>

          <div className="mx-4 border-t border-brand-line/60" />

          <button
            type="button"
            onClick={openProjectSelector}
            className="m-press flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-brand-soft/50"
            aria-label="Change active project"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-brand-line/60 bg-brand-softblue/30 text-brand-blue">
              <IconBuildingProject />
            </span>
            <span className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-mist">
                Active project
              </p>
              <p className="mt-0.5 truncate text-[14px] font-semibold text-brand-navy">
                {currentProject.name}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-brand-muted">
                {projectSubtitle(currentProject)}
              </p>
            </span>
            <IconChevronRight strokeWidth={1.75} className="mt-2 shrink-0 text-brand-mist" />
          </button>
        </section>

        {sections.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-brand-line/80 bg-white/80 px-4 py-10 text-center shadow-[0_1px_4px_rgba(8,35,63,0.04)]">
            <p className="text-[15px] font-bold text-brand-navy">No workflows available</p>
            <p className="mt-2 text-[13px] leading-relaxed text-brand-muted">
              Your role or project access does not include any More menu items right now.
            </p>
          </div>
        ) : null}

        {sections.map((section) => (
          <section key={section.id}>
            <h2 className="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-mist">
              {section.title}
            </h2>
            <ul className="overflow-hidden rounded-[18px] border border-brand-line/60 bg-white shadow-[0_2px_12px_rgba(8,35,63,0.06)]">
              {section.items.map((item, index) => (
                <li
                  key={item.id}
                  className={
                    index > 0 ? "border-t border-brand-line/50" : undefined
                  }
                >
                  <MoreMenuRow item={item} unreadCount={unreadCount} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
