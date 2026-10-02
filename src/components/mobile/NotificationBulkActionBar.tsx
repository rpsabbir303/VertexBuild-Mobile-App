"use client";

import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconTrash } from "./icons";

export function NotificationBulkActionBar() {
  const {
    notificationSelectionMode,
    selectedNotificationIds,
    markNotificationsReadByIds,
    openBulkDeleteConfirm,
  } = useMobileApp();

  if (!notificationSelectionMode || selectedNotificationIds.length === 0) {
    return null;
  }

  const count = selectedNotificationIds.length;

  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-4 border-t border-brand-line/60 bg-soft-sky/95 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 rounded-mobile-lg border border-brand-line/80 bg-white/95 px-3.5 py-3 shadow-soft">
        <p className="text-[13px] font-semibold text-brand-navy">{count} selected</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => markNotificationsReadByIds(selectedNotificationIds)}
            className="m-press rounded-pill bg-brand-soft px-3.5 py-2 text-[13px] font-semibold text-brand-navy active:bg-brand-line"
          >
            Mark as read
          </button>
          <button
            type="button"
            onClick={openBulkDeleteConfirm}
            className="m-press flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-status-danger active:bg-red-100"
            aria-label="Delete selected notifications"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
}
