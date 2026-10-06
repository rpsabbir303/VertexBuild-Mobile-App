"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { getProjectById } from "@/lib/mobile/mockData";
import {
  NOTIFICATION_MODULE_LABELS,
  TIME_GROUP_LABELS,
  notificationContextLine,
  notificationMatchesCategory,
  notificationMatchesProjectFilter,
  notificationWithinAccessibleProjects,
} from "@/lib/mobile/notifications";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { canAccessMoreMenuItem } from "@/lib/mobile/roleConfig";
import type { MockNotification, NotificationTimeGroup } from "@/lib/mobile/types";
import { mobilePageBg } from "@/lib/mobile/mobileUi";
import { PermissionDeniedScreen } from "./PermissionDeniedScreen";
import { IconBack, IconFilter, IconOverflow, IconSearch } from "../icons";
import { NotificationBulkActionBar } from "../NotificationBulkActionBar";
import { NotificationBulkDeleteDialog } from "../NotificationBulkDeleteDialog";
import { NotificationFilterSheet } from "../NotificationFilterSheet";
import { NotificationListItem } from "../NotificationListItem";
import { NotificationOverflowMenu } from "../NotificationOverflowMenu";
import { NotificationProjectFilterSheet } from "../NotificationProjectFilterSheet";
import { NotificationProjectSelector } from "../NotificationProjectSelector";
import { NotificationSkeletonList } from "../NotificationSkeletonList";

const TIME_GROUP_ORDER: NotificationTimeGroup[] = ["today", "yesterday", "earlier"];

export function NotificationsScreen() {
  const {
    user,
    currentProject,
    accessibleProjects,
    notificationProjectFilterId,
    roleNotifications,
    notificationFilter,
    setNotificationFilter,
    notificationSearch,
    setNotificationSearch,
    appliedFilters,
    activeFilterCount,
    openFilterSheet,
    openOverflowMenu,
    listStatus,
    setListStatus,
    retryLoadNotifications,
    setVisibleNotificationIds,
    notificationSelectionMode,
    exitNotificationSelectionMode,
    selectedNotificationIds,
    toggleNotificationSelected,
    selectAllVisibleNotifications,
    deselectAllNotifications,
  } = useMobileApp();

  useEffect(() => {
    setListStatus("loading");
    const timer = window.setTimeout(() => setListStatus("ready"), 450);
    return () => window.clearTimeout(timer);
  }, [setListStatus]);

  const accessibleProjectIds = useMemo(
    () => accessibleProjects.map((p) => p.id),
    [accessibleProjects],
  );

  const canAccessNotifications = useMemo(
    () =>
      canAccessMoreMenuItem(
        "notifications",
        user.role,
        accessibleProjectIds,
        currentProject.id,
      ),
    [user.role, accessibleProjectIds, currentProject.id],
  );

  const projectScopedNotifications = useMemo(() => {
    return roleNotifications.filter((n) =>
      notificationWithinAccessibleProjects(n, currentProject.id, accessibleProjectIds),
    );
  }, [roleNotifications, currentProject.id, accessibleProjectIds]);

  const filtered = useMemo(() => {
    const q = notificationSearch.trim().toLowerCase();
    return projectScopedNotifications.filter((n) => {
      if (
        !notificationMatchesProjectFilter(n, notificationProjectFilterId, currentProject.id)
      ) {
        return false;
      }
      if (notificationFilter === "unread" && n.read) return false;
      if (!notificationMatchesCategory(n, appliedFilters.category)) return false;
      if (!q) return true;
      const projectName =
        n.projectId === "current"
          ? currentProject.name
          : (getProjectById(n.projectId)?.name ?? "");
      return (
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        NOTIFICATION_MODULE_LABELS[n.module].toLowerCase().includes(q) ||
        n.filterCategory.toLowerCase().includes(q) ||
        (n.recordId?.toLowerCase().includes(q) ?? false) ||
        projectName.toLowerCase().includes(q) ||
        notificationContextLine(n, currentProject, getProjectById).toLowerCase().includes(q)
      );
    });
  }, [
    projectScopedNotifications,
    notificationProjectFilterId,
    notificationFilter,
    appliedFilters,
    notificationSearch,
    currentProject,
  ]);

  useEffect(() => {
    setVisibleNotificationIds(filtered.map((n) => n.id));
  }, [filtered, setVisibleNotificationIds]);

  const scopedUnreadCount = useMemo(
    () => filtered.filter((n) => !n.read).length,
    [filtered],
  );

  const groupedByTime = useMemo(() => {
    const buckets = new Map<NotificationTimeGroup, MockNotification[]>();
    for (const group of TIME_GROUP_ORDER) {
      buckets.set(group, []);
    }
    for (const item of filtered) {
      buckets.get(item.timeGroup)?.push(item);
    }
    return TIME_GROUP_ORDER.map((key) => ({
      key,
      label: TIME_GROUP_LABELS[key],
      items: buckets.get(key) ?? [],
    })).filter((section) => section.items.length > 0);
  }, [filtered]);

  const allVisibleSelected =
    filtered.length > 0 &&
    filtered.every((n) => selectedNotificationIds.includes(n.id));

  const emptyCopy = useMemo(() => {
    if (notificationSearch.trim()) {
      return {
        title: "No notifications found",
        body: "Try another search.",
      };
    }
    if (activeFilterCount > 0 || appliedFilters.category !== "all") {
      return {
        title: "No notifications in this category",
        body: "Try another filter.",
      };
    }
    if (notificationFilter === "unread") {
      return {
        title: "You're all caught up",
        body: "No unread notifications.",
      };
    }
    if (projectScopedNotifications.length === 0) {
      return {
        title: "No notifications yet",
        body: "You're all caught up.",
      };
    }
    return {
      title: "No notifications yet",
      body: "You're all caught up.",
    };
  }, [
    notificationSearch,
    notificationFilter,
    activeFilterCount,
    appliedFilters.category,
    projectScopedNotifications.length,
  ]);

  const statusLine = useMemo(() => {
    if (scopedUnreadCount > 0) return `${user.roleLabel} · ${scopedUnreadCount} unread`;
    return `${user.roleLabel} · All caught up`;
  }, [user.roleLabel, scopedUnreadCount]);

  if (!canAccessNotifications) {
    return <PermissionDeniedScreen backHref="/mobile-preview/more" />;
  }

  return (
    <div className={mobilePageBg}>
      <header className="sticky top-0 z-20 border-b border-brand-line/50 bg-brand-canvas/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm">
        {notificationSelectionMode ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exitNotificationSelectionMode}
              className="m-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
              aria-label="Cancel selection"
            >
              <IconBack />
            </button>
            <h1 className="min-w-0 flex-1 truncate text-[18px] font-bold tracking-[-0.02em] text-brand-navy">
              Select Notifications
            </h1>
            <button
              type="button"
              onClick={() =>
                allVisibleSelected ? deselectAllNotifications() : selectAllVisibleNotifications()
              }
              className="m-press shrink-0 text-[14px] font-semibold text-brand-blue"
            >
              {allVisibleSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Link
                href="/mobile-preview"
                className="m-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
                aria-label="Back to Home"
              >
                <IconBack />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h1 className="truncate text-[20px] font-bold tracking-[-0.02em] text-brand-navy">
                    Notifications
                  </h1>
                  <button
                    type="button"
                    onClick={openOverflowMenu}
                    className="m-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-navy"
                    aria-label="Notification options"
                  >
                    <IconOverflow />
                  </button>
                </div>
                <p className="mt-0.5 truncate text-[13px] text-brand-muted">{statusLine}</p>
              </div>
            </div>

            <NotificationProjectSelector />

            <label className="relative mt-3 block">
              <span className="sr-only">Search notifications</span>
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-mist" />
              <input
                type="search"
                value={notificationSearch}
                onChange={(e) => setNotificationSearch(e.target.value)}
                placeholder="Search notifications..."
                className="w-full appearance-none rounded-pill border border-brand-line bg-brand-soft py-2.5 pl-10 pr-14 text-[14px] text-brand-navy outline-none placeholder:text-brand-mist focus:border-brand-blue/40 focus:bg-white"
              />
              {notificationSearch ? (
                <button
                  type="button"
                  onClick={() => setNotificationSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-brand-blue"
                >
                  Clear
                </button>
              ) : null}
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", "unread"] as const).map((key) => {
                const active = notificationFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNotificationFilter(key)}
                    className={`m-press rounded-pill px-3.5 py-1.5 text-[13px] font-semibold transition ${
                      active
                        ? "bg-brand-navy text-white shadow-soft"
                        : "bg-brand-soft text-brand-muted active:bg-brand-line"
                    }`}
                  >
                    {key === "all"
                      ? "All"
                      : `Unread${scopedUnreadCount ? ` ${scopedUnreadCount}` : ""}`}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={openFilterSheet}
                className={`m-press inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  activeFilterCount > 0
                    ? "bg-brand-softblue text-brand-blue"
                    : "bg-brand-soft text-brand-muted"
                }`}
              >
                <IconFilter />
                {activeFilterCount > 0 ? "Filter · 1" : "Filter"}
              </button>
            </div>
          </>
        )}
      </header>

      <main className={`px-4 py-4 ${notificationSelectionMode ? "pb-28" : ""}`}>
        {listStatus === "loading" ? <NotificationSkeletonList /> : null}

        {listStatus === "error" ? (
          <div className="rounded-mobile-lg border border-dashed border-brand-line bg-white/90 px-4 py-12 text-center shadow-soft">
            <p className="text-[15px] font-bold text-brand-navy">Couldn&apos;t load notifications</p>
            <button
              type="button"
              onClick={retryLoadNotifications}
              className="m-press mt-4 rounded-mobile bg-brand-blue px-5 py-2.5 text-[14px] font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : null}

        {listStatus === "ready" && filtered.length === 0 ? (
          <div className="rounded-mobile-lg border border-dashed border-brand-line bg-white/90 px-4 py-12 text-center shadow-soft">
            <p className="text-[15px] font-bold text-brand-navy">{emptyCopy.title}</p>
            <p className="mt-2 text-[13px] text-brand-muted">{emptyCopy.body}</p>
          </div>
        ) : null}

        {listStatus === "ready" && groupedByTime.length > 0 ? (
          <div className="space-y-5">
            {groupedByTime.map((section) => (
              <section key={section.key}>
                {!notificationSelectionMode ? (
                  <h2 className="mb-2.5 px-0.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-brand-mist">
                    {section.label}
                  </h2>
                ) : null}
                <ul className="list-none space-y-2.5 p-0">
                  {section.items.map((notification) => (
                    <li key={notification.id} className="list-none">
                      <NotificationListItem
                        notification={notification}
                        selectionMode={notificationSelectionMode}
                        selected={selectedNotificationIds.includes(notification.id)}
                        onToggleSelect={() => toggleNotificationSelected(notification.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}

        <NotificationBulkActionBar />
      </main>

      <NotificationFilterSheet />
      <NotificationProjectFilterSheet />
      <NotificationOverflowMenu />
      <NotificationBulkDeleteDialog />
    </div>
  );
}
