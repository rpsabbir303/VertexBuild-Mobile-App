"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconMarkRead, IconSelectList, IconTrash } from "./icons";

const EXIT_MS = 180;

export function NotificationOverflowMenu() {
  const {
    overflowMenuOpen,
    closeOverflowMenu,
    enterNotificationSelectionMode,
    markAllVisibleNotificationsRead,
    visibleNotificationIds,
  } = useMobileApp();
  const [rendered, setRendered] = useState(false);
  const [entered, setEntered] = useState(false);

  const hasVisible = visibleNotificationIds.length > 0;

  useEffect(() => {
    if (overflowMenuOpen) {
      setRendered(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(frame);
    }
    setEntered(false);
    const timer = window.setTimeout(() => setRendered(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [overflowMenuOpen]);

  if (!rendered) return null;

  function handleSelectNotification() {
    enterNotificationSelectionMode();
  }

  function handleDeleteNotification() {
    enterNotificationSelectionMode();
  }

  return (
    <div className="absolute inset-0 z-50" role="presentation">
      <button
        type="button"
        className={`absolute inset-0 bg-brand-ink/20 transition-opacity duration-200 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Dismiss menu"
        onClick={closeOverflowMenu}
      />
      <div
        className={`absolute right-4 top-[max(72px,calc(56px+env(safe-area-inset-top,0px)))] w-[min(280px,calc(100%-32px))] origin-top-right transition-all duration-200 ${
          entered ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        role="menu"
        aria-label="Notification actions"
      >
        <div className="overflow-hidden rounded-mobile-lg border border-brand-line/80 bg-brand-softblue/30 bg-white/95 p-2 shadow-float backdrop-blur-sm">
          <MenuRow
            icon={<IconSelectList className="text-brand-blue" />}
            label="Select Notification"
            disabled={!hasVisible}
            onClick={() => {
              handleSelectNotification();
            }}
          />
          <MenuRow
            icon={<IconMarkRead className="text-brand-blue" />}
            label="Mark all as read"
            disabled={!hasVisible}
            onClick={() => {
              markAllVisibleNotificationsRead();
            }}
          />
          <MenuRow
            icon={<IconTrash className="text-status-danger" />}
            label="Delete Notification"
            disabled={!hasVisible}
            onClick={() => {
              handleDeleteNotification();
            }}
            destructive
          />
        </div>
      </div>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
  disabled,
  destructive,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`m-press flex w-full items-center gap-3 rounded-mobile px-3 py-3.5 text-left transition active:bg-brand-soft disabled:opacity-40 ${
        destructive ? "text-status-danger" : "text-brand-navy"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft">
        {icon}
      </span>
      <span className="text-[15px] font-medium">{label}</span>
    </button>
  );
}
