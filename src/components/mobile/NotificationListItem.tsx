"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getProjectById } from "@/lib/mobile/mockData";
import { notificationContextLine } from "@/lib/mobile/notifications";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import type { MockNotification, NotificationPriority } from "@/lib/mobile/types";
import { IconCheck, IconChevronRight, IconCircle, IconOverflow } from "./icons";

const priorityClass: Record<NotificationPriority, string> = {
  urgent: "text-status-danger font-semibold",
  attention: "text-status-warning font-semibold",
  review: "text-brand-blue font-semibold",
  normal: "text-brand-muted font-medium",
  info: "text-brand-mist font-medium",
};

export function NotificationListItem({
  notification,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  notification: MockNotification;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const {
    currentProject,
    markNotificationRead,
    markNotificationUnread,
    deleteNotification,
  } = useMobileApp();
  const unread = !notification.read;
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen && !confirmDelete) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen, confirmDelete]);

  const contextLine = notificationContextLine(notification, currentProject, getProjectById);
  const severityClass = priorityClass[notification.priority];

  const cardBody = (
    <>
      <div className="flex items-start gap-2">
        {selectionMode ? (
          <button
            type="button"
            onClick={onToggleSelect}
            className="m-press mt-0.5 shrink-0 text-brand-blue"
            aria-label={selected ? "Deselect notification" : "Select notification"}
            aria-pressed={selected}
          >
            {selected ? (
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand-blue text-white">
                <IconCheck strokeWidth={3} className="h-3 w-3" />
              </span>
            ) : (
              <IconCircle className="text-brand-line" />
            )}
          </button>
        ) : null}
        {selectionMode ? (
          <button
            type="button"
            onClick={onToggleSelect}
            className="m-press min-w-0 flex-1 text-left"
          >
            {cardContent()}
          </button>
        ) : (
          <Link
            href={`/mobile-preview/notifications/${notification.id}`}
            className="m-press min-w-0 flex-1 text-left"
          >
            {cardContent()}
          </Link>
        )}

        {!selectionMode ? (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                setMenuOpen((v) => !v);
              }}
              className="m-press flex h-8 w-8 items-center justify-center rounded-full text-brand-mist active:bg-brand-soft"
              aria-label="Notification actions"
            >
              <IconOverflow />
            </button>
            {menuOpen && !confirmDelete ? (
              <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-mobile border border-brand-line bg-white shadow-float">
                {unread ? (
                  <button
                    type="button"
                    className="block w-full px-3 py-2.5 text-left text-[13px] font-medium text-brand-navy active:bg-brand-soft"
                    onClick={() => {
                      markNotificationRead(notification.id);
                      setMenuOpen(false);
                    }}
                  >
                    Mark as read
                  </button>
                ) : (
                  <button
                    type="button"
                    className="block w-full px-3 py-2.5 text-left text-[13px] font-medium text-brand-navy active:bg-brand-soft"
                    onClick={() => {
                      markNotificationUnread(notification.id);
                      setMenuOpen(false);
                    }}
                  >
                    Mark as unread
                  </button>
                )}
                <button
                  type="button"
                  className="block w-full border-t border-brand-line px-3 py-2.5 text-left text-[13px] font-medium text-status-danger active:bg-brand-soft"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </button>
              </div>
            ) : null}
            {confirmDelete ? (
              <div className="absolute right-0 top-9 z-30 w-52 rounded-mobile border border-brand-line bg-white p-3 shadow-float">
                <p className="text-[13px] font-semibold text-brand-navy">Delete this notification?</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="m-press flex-1 rounded-mobile border border-brand-line py-2 text-[12px] font-semibold text-brand-navy"
                    onClick={() => {
                      setConfirmDelete(false);
                      setMenuOpen(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="m-press flex-1 rounded-mobile bg-status-danger py-2 text-[12px] font-semibold text-white"
                    onClick={() => {
                      deleteNotification(notification.id);
                      setConfirmDelete(false);
                      setMenuOpen(false);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {!selectionMode ? (
        <div className="mt-2 flex justify-end border-t border-brand-line/60 pt-2">
          <Link
            href={`/mobile-preview/notifications/deeplink/${notification.id}`}
            className="m-press inline-flex items-center gap-1 text-[12px] font-semibold text-brand-blue"
          >
            {notification.destinationLabel}
            <IconChevronRight />
          </Link>
        </div>
      ) : null}
    </>
  );

  function cardContent() {
    return (
      <>
        <div className="flex items-start gap-2">
          <p
            className={`min-w-0 flex-1 text-[15px] leading-snug tracking-[-0.01em] text-brand-navy ${
              unread ? "font-bold" : "font-medium"
            }`}
          >
            {notification.title}
          </p>
          {!selectionMode && unread ? (
            <span
              className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-blue ring-2 ring-white"
              aria-label="Unread"
            />
          ) : null}
        </div>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-mist">
          {contextLine}
        </p>
        <p className="mt-2 text-[13px] leading-snug text-brand-navy/85">{notification.description}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
          <span className="text-brand-mist">{notification.timeLabel}</span>
          <span className="text-brand-line">·</span>
          <span className={severityClass}>{notification.statusLabel}</span>
          {unread ? (
            <>
              <span className="text-brand-line">·</span>
              <span className="font-semibold text-brand-blue">Unread</span>
            </>
          ) : (
            <>
              <span className="text-brand-line">·</span>
              <span className="text-brand-muted">Read</span>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <article
      className={`relative rounded-mobile-lg border p-3.5 shadow-soft ${
        selected
          ? "border-brand-blue/40 bg-brand-softblue/50 ring-1 ring-brand-blue/25"
          : unread
            ? "border-[#B9DDF5] border-l-[3px] border-l-[#3FA7E3] bg-[#E8F4FC]"
            : "border-[#E5ECF2] bg-[#FFFFFF]"
      }`}
    >
      {cardBody}
    </article>
  );
}
