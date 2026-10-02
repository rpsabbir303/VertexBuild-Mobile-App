"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { canAccessNotificationDestination } from "@/lib/mobile/notificationAccess";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconBack } from "../icons";

export function NotificationDeepLinkScreen({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const {
    roleNotifications,
    user,
    currentProject,
    isOffline,
    setIsOffline,
    markNotificationRead,
  } = useMobileApp();

  const notification = roleNotifications.find((n) => n.id === notificationId);

  const blockReason = useMemo(() => {
    if (!notification) return "missing" as const;
    if (isOffline || notification.deepLinkState === "offline") return "offline" as const;
    if (notification.deepLinkState === "no_access") return "no_access" as const;
    if (
      !canAccessNotificationDestination(
        notification.destination,
        user.role,
        currentProject.id,
      )
    ) {
      return "no_access" as const;
    }
    return null;
  }, [notification, isOffline, user.role, currentProject.id]);

  useEffect(() => {
    if (!notification || blockReason) return;
    markNotificationRead(notification.id);
    router.replace(notification.destination);
  }, [notification, blockReason, markNotificationRead, router]);

  if (!notification) {
    return (
      <BlockedLayout title="Notification">
        <p className="text-[15px] font-semibold text-brand-navy">Notification not found</p>
        <p className="mt-2 text-[13px] text-brand-muted">
          This notification may have been removed.
        </p>
        <ReturnLink />
      </BlockedLayout>
    );
  }

  if (blockReason === "no_access") {
    return (
      <BlockedLayout title={notification.title}>
        <p className="text-[15px] font-semibold text-brand-navy">
          You don&apos;t have access to this record.
        </p>
        <p className="mt-2 text-[13px] text-brand-muted">
          Your role does not include permission to open this item.
        </p>
        <ReturnLink />
      </BlockedLayout>
    );
  }

  if (blockReason === "offline") {
    return (
      <BlockedLayout title={notification.title}>
        <p className="text-[15px] font-semibold text-brand-navy">You&apos;re offline</p>
        <p className="mt-2 text-[13px] text-brand-muted">
          This record isn&apos;t available offline. Connect and try again.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setIsOffline(false);
              router.refresh();
            }}
            className="m-press rounded-mobile bg-brand-blue px-4 py-2.5 text-[14px] font-semibold text-white"
          >
            Retry
          </button>
          <ReturnLink />
        </div>
      </BlockedLayout>
    );
  }

  return (
    <BlockedLayout title={notification.title}>
      <p className="text-[13px] text-brand-muted">Opening related record…</p>
    </BlockedLayout>
  );
}

function BlockedLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="flex items-center gap-2 border-b border-brand-line/80 bg-white px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <Link
          href="/mobile-preview/notifications"
          className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
          aria-label="Back to notifications"
        >
          <IconBack />
        </Link>
        <h1 className="truncate text-[17px] font-semibold text-brand-navy">{title}</h1>
      </header>
      <main className="px-4 py-10 text-center">{children}</main>
    </>
  );
}

function ReturnLink() {
  return (
    <Link
      href="/mobile-preview/notifications"
      className="mt-4 inline-block text-[14px] font-semibold text-brand-blue"
    >
      Return to notifications
    </Link>
  );
}
