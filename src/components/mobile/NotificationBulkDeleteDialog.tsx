"use client";

import { useMobileApp } from "@/lib/mobile/MobileAppContext";

export function NotificationBulkDeleteDialog() {
  const {
    bulkDeleteConfirmOpen,
    selectedNotificationIds,
    closeBulkDeleteConfirm,
    confirmBulkDelete,
  } = useMobileApp();

  if (!bulkDeleteConfirmOpen) return null;

  const count = selectedNotificationIds.length;
  const message =
    count === 1
      ? "Delete this notification?"
      : `Delete ${count} notifications?`;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center px-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-brand-ink/35"
        aria-label="Dismiss"
        onClick={closeBulkDeleteConfirm}
      />
      <div
        className="relative w-full max-w-[320px] rounded-mobile-lg border border-brand-line bg-white p-4 shadow-float"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bulk-delete-title"
      >
        <p id="bulk-delete-title" className="text-[16px] font-bold text-brand-navy">
          {message}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={closeBulkDeleteConfirm}
            className="m-press flex-1 rounded-mobile border border-brand-line py-2.5 text-[14px] font-semibold text-brand-navy"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmBulkDelete}
            className="m-press flex-1 rounded-mobile bg-status-danger py-2.5 text-[14px] font-semibold text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
