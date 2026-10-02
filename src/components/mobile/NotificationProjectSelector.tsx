"use client";

import { getProjectById } from "@/lib/mobile/mockData";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconChevronDown } from "./icons";

export function NotificationProjectSelector() {
  const {
    currentProject,
    hasMultiProjectAccess,
    notificationProjectFilterId,
    openNotificationProjectSelector,
  } = useMobileApp();

  const label =
    notificationProjectFilterId === "all"
      ? "All Projects"
      : (getProjectById(notificationProjectFilterId)?.name ?? currentProject.name);

  if (!hasMultiProjectAccess) {
    return (
      <p className="mt-2 truncate text-[14px] font-semibold text-brand-navy">{currentProject.name}</p>
    );
  }

  return (
    <button
      type="button"
      onClick={openNotificationProjectSelector}
      className="m-press mt-2 inline-flex max-w-full items-center gap-1.5 rounded-pill border border-brand-line/80 bg-brand-soft px-3 py-1.5 text-left active:bg-brand-line/40"
      aria-label={`Project filter: ${label}`}
      aria-haspopup="dialog"
    >
      <span className="truncate text-[14px] font-semibold text-brand-navy">{label}</span>
      <IconChevronDown className="shrink-0 text-brand-blue" />
    </button>
  );
}
