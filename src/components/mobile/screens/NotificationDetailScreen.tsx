"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getProjectById, projectSubtitle } from "@/lib/mobile/mockData";
import {
  NOTIFICATION_MODULE_LABELS,
  notificationContextLine,
} from "@/lib/mobile/notifications";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import type { NotificationPriority } from "@/lib/mobile/types";
import { IconBack } from "../icons";

const priorityLabel: Record<NotificationPriority, string> = {
  urgent: "Urgent",
  attention: "Attention",
  review: "Review",
  normal: "Standard",
  info: "Info",
};

export function NotificationDetailScreen({ notificationId }: { notificationId: string }) {
  const {
    roleNotifications,
    currentProject,
    markNotificationRead,
    markNotificationUnread,
  } = useMobileApp();
  const notification = roleNotifications.find((n) => n.id === notificationId);
  const project =
    notification && notification.projectId !== "current"
      ? getProjectById(notification.projectId)
      : notification?.projectId === "current"
        ? currentProject
        : undefined;

  useEffect(() => {
    if (notification && !notification.read) {
      markNotificationRead(notification.id);
    }
  }, [notification, markNotificationRead]);

  if (!notification) {
    return (
      <>
        <DetailHeader title="Notification" />
        <main className="px-4 py-8 text-center">
          <p className="text-[15px] font-semibold text-brand-navy">Notification not found</p>
          <p className="mt-2 text-[13px] text-brand-muted">
            It may have been deleted or is hidden for your role.
          </p>
          <Link
            href="/mobile-preview/notifications"
            className="mt-4 inline-block text-[14px] font-semibold text-brand-blue"
          >
            Back to notifications
          </Link>
        </main>
      </>
    );
  }

  const contextLine = notificationContextLine(notification, currentProject, getProjectById);

  return (
    <>
      <DetailHeader
        title={NOTIFICATION_MODULE_LABELS[notification.module]}
        backHref="/mobile-preview/notifications"
      />
      <main className="px-4 py-4">
        <section className="rounded-mobile-lg border border-brand-line/70 bg-white p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-brand-mist">
            {NOTIFICATION_MODULE_LABELS[notification.module]}
          </p>
          <h1 className="mt-2 text-[20px] font-bold leading-snug tracking-[-0.02em] text-brand-navy">
            {notification.title}
          </h1>

          <div className="mt-3 rounded-mobile bg-brand-soft px-3 py-2.5">
            <p className="text-[14px] font-semibold text-brand-navy">{contextLine}</p>
            {project ? (
              <p className="mt-0.5 text-[12px] text-brand-muted">{projectSubtitle(project)}</p>
            ) : null}
          </div>

          {notification.recordId ? (
            <div className="mt-3">
              <p className="text-[12px] font-semibold text-brand-mist">Related record</p>
              <p className="mt-1 text-[14px] font-semibold text-brand-navy">
                {notification.recordId}
              </p>
              {notification.recordLabel ? (
                <p className="mt-0.5 text-[13px] text-brand-muted">{notification.recordLabel}</p>
              ) : null}
            </div>
          ) : null}

          <p className="mt-4 text-[15px] leading-relaxed text-brand-navy/90">
            {notification.description}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-brand-line pt-3 text-[13px]">
            <div>
              <dt className="text-brand-mist">Severity</dt>
              <dd className="mt-0.5 font-semibold text-brand-navy">
                {priorityLabel[notification.priority]}
              </dd>
            </div>
            <div>
              <dt className="text-brand-mist">Status</dt>
              <dd className="mt-0.5 font-semibold text-brand-navy">
                {notification.read ? "Read" : "Unread"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-brand-mist">Received</dt>
              <dd className="mt-0.5 font-semibold text-brand-navy">
                {notification.absoluteTime}
              </dd>
              <dd className="text-[12px] text-brand-muted">{notification.timeLabel}</dd>
            </div>
          </dl>
        </section>

        <div className="mt-4 space-y-2">
          <Link
            href={`/mobile-preview/notifications/deeplink/${notification.id}`}
            className="m-press flex w-full items-center justify-center rounded-mobile bg-brand-blue py-3.5 text-[15px] font-semibold text-white"
          >
            {notification.destinationLabel}
          </Link>
          <button
            type="button"
            onClick={() =>
              notification.read
                ? markNotificationUnread(notification.id)
                : markNotificationRead(notification.id)
            }
            className="m-press w-full rounded-mobile border border-brand-line py-3 text-[14px] font-semibold text-brand-navy"
          >
            {notification.read ? "Mark as unread" : "Mark as read"}
          </button>
        </div>
      </main>
    </>
  );
}

function DetailHeader({
  title,
  backHref = "/mobile-preview/notifications",
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <header className="flex items-center gap-2 border-b border-brand-line/80 bg-white px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
      <Link
        href={backHref}
        className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
        aria-label="Back"
      >
        <IconBack />
      </Link>
      <h1 className="truncate text-[17px] font-semibold text-brand-navy">{title}</h1>
    </header>
  );
}
