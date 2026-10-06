"use client";

import Link from "next/link";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconBell } from "./icons";
import { ProjectContextBar } from "./ProjectContextBar";

export function MobileTopBar({ showProject = true }: { showProject?: boolean }) {
  const { unreadCount, user } = useMobileApp();

  return (
    <header className="px-4 pb-1 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-sky to-brand-blue text-[13px] font-bold text-white shadow-soft">
            {user.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-brand-muted">
              {user.company}
            </p>
            <p className="truncate text-[13px] font-semibold text-brand-navy">{user.roleLabel}</p>
          </div>
        </div>
        <Link
          href="/mobile-preview/notifications"
          className="m-press relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-line/60 bg-white text-brand-navy shadow-[0_2px_12px_rgba(8,35,63,0.06)] active:scale-95"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        >
          <IconBell />
          {unreadCount > 0 ? (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-status-danger ring-2 ring-white" />
          ) : null}
        </Link>
      </div>

      {showProject ? (
        <div className="mt-3">
          <ProjectContextBar />
        </div>
      ) : null}
    </header>
  );
}
