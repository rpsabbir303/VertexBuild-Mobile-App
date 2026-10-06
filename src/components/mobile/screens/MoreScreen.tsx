"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  MORE_ACCOUNT_EXTRAS,
  MORE_MENU_ROW_META,
  type MoreAccountExtra,
} from "@/lib/mobile/moreMenuPresentation";
import { mobileElevatedCard, mobileIconTile, mobileListRow, mobilePageBg } from "@/lib/mobile/mobileUi";
import { filterMenuForRole, type MoreMenuItem } from "@/lib/mobile/roleConfig";
import { useMobileAuth } from "@/lib/mobile/MobileAuthContext";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { MoreMenuIcon } from "../moreMenuIcons";
import {
  IconArrowUpRightSmall,
  IconBack,
  IconChevronRight,
  IconDailyLog,
  IconMenuPunch,
  IconRfi,
  IconSignOut,
  IconSubmittal,
  IconSwitchVertical,
  IconOfflineSync,
  IconSettings,
} from "../icons";

const QUICK_ACTIONS = [
  { id: "logs", label: "New Logs", href: "/mobile-preview/logs", Icon: IconDailyLog },
  { id: "rfi", label: "RFI", href: "/mobile-preview/tools/rfis", Icon: IconRfi },
  { id: "punch", label: "New Punch", href: "/mobile-preview/tools/punch", Icon: IconMenuPunch },
  {
    id: "submittal",
    label: "Submittal",
    href: "/mobile-preview/tools/submittals",
    Icon: IconSubmittal,
  },
] as const;

function AccountExtraIcon({ id }: { id: MoreAccountExtra["id"] }) {
  if (id === "settings") return <IconSettings className="h-5 w-5" />;
  return <IconOfflineSync className="h-5 w-5" />;
}

function MoreMenuRow({
  item,
  unreadCount,
}: {
  item: MoreMenuItem;
  unreadCount: number;
}) {
  const meta = MORE_MENU_ROW_META[item.id];
  const title = meta?.title ?? item.label;
  const subtitle = meta?.subtitle;
  const isNotifications = item.id === "notifications";
  const showUnread = isNotifications && unreadCount > 0;
  const pill = meta?.pill;

  return (
    <Link href={item.href} className={mobileListRow}>
      <span className={mobileIconTile}>
        <MoreMenuIcon id={item.id} className="h-5 w-5 text-brand-blue" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-brand-navy">{title}</span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-[12px] text-brand-muted">{subtitle}</span>
        ) : null}
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {pill ? (
          <span className="rounded-pill bg-brand-softblue px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-blue">
            {pill}
          </span>
        ) : null}
        {showUnread ? (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-status-danger px-1.5 text-[11px] font-bold tabular-nums text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
        <IconChevronRight strokeWidth={1.75} className="h-[18px] w-[18px] text-brand-mist" />
      </span>
    </Link>
  );
}

function AccountExtraRow({ extra }: { extra: MoreAccountExtra }) {
  return (
    <Link href={extra.href} className={mobileListRow}>
      <span className={mobileIconTile}>
        <AccountExtraIcon id={extra.id} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-brand-navy">{extra.label}</span>
        <span className="mt-0.5 block truncate text-[12px] text-brand-muted">{extra.subtitle}</span>
      </span>
      <IconChevronRight strokeWidth={1.75} className="h-[18px] w-[18px] shrink-0 text-brand-mist" />
    </Link>
  );
}

export function MoreScreen() {
  const { user, currentProject, accessibleProjects, unreadCount, openProjectSelector } =
    useMobileApp();
  const { logout } = useMobileAuth();

  const accessibleProjectIds = useMemo(
    () => accessibleProjects.map((p) => p.id),
    [accessibleProjects],
  );

  const sections = useMemo(() => {
    const raw = filterMenuForRole(user.role, accessibleProjectIds, currentProject.id).map(
      (section) => ({
        ...section,
        items: section.items.filter((item) => item.id !== "profile"),
      }),
    );
    if (!raw.some((section) => section.id === "account")) {
      raw.push({
        id: "account",
        title: "Account",
        itemIds: ["notifications"],
        items: [],
      });
    }
    return raw;
  }, [user.role, accessibleProjectIds, currentProject.id]);

  const roleLine = `${user.roleLabel} • ${user.company}`;

  return (
    <div className={mobilePageBg}>
      <header className="sticky top-0 z-10 border-b border-brand-line/40 bg-brand-canvas/95 px-4 pb-3 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="relative flex items-center justify-center py-1">
          <Link
            href="/mobile-preview"
            className="m-press absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border border-brand-line/60 bg-white text-brand-navy shadow-[0_1px_2px_rgba(8,35,63,0.06)] active:bg-brand-soft"
            aria-label="Back to Home"
          >
            <IconBack />
          </Link>
          <h1 className="text-[17px] font-bold tracking-[-0.02em] text-brand-navy">Menu</h1>
        </div>
      </header>

      <main className="space-y-6 px-4 pb-8 pt-4">
        <section className={`${mobileElevatedCard} overflow-hidden border-0 shadow-[0_4px_20px_rgba(8,35,63,0.12)]`}>
          <div className="bg-gradient-to-br from-[#3FA7E3] via-brand-blue to-[#2B8FC7] px-4 pb-4 pt-4 text-white">
            <div className="flex items-start gap-3.5">
              <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 border-white/30 bg-white/15 text-[15px] font-bold tracking-wide shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                {user.initials}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="truncate text-[18px] font-bold tracking-[-0.02em]">
                  {user.firstName} {user.lastName}
                </p>
                <p className="mt-1 truncate text-[13px] font-medium text-white/85">{roleLine}</p>
              </div>
              <Link
                href="/mobile-preview/tools/profile"
                className="m-press inline-flex shrink-0 items-center gap-1 rounded-pill border border-white/35 bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm active:bg-white/25"
              >
                Profile
                <IconArrowUpRightSmall className="text-white" strokeWidth={2} />
              </Link>
            </div>

            <div className="mt-4 rounded-[14px] bg-[#1E7BB5]/45 px-3.5 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/70">
                Current project
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-[14px] font-semibold">{currentProject.name}</p>
                <button
                  type="button"
                  onClick={openProjectSelector}
                  className="m-press inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 text-[12px] font-bold text-brand-blue shadow-sm active:scale-[0.98]"
                >
                  Switch
                  <IconSwitchVertical className="text-brand-blue" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_ACTIONS.map(({ id, label, href, Icon }) => (
              <Link
                key={id}
                href={href}
                className="m-press flex flex-col items-center gap-2 rounded-[16px] border border-brand-line/60 bg-white px-1 py-3.5 shadow-[0_2px_12px_rgba(8,35,63,0.06)] active:scale-[0.98]"
              >
                <span className={mobileIconTile}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-center text-[11px] font-bold leading-tight text-brand-navy">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {!sections.some((s) => s.id !== "account" && s.items.length > 0) ? (
          <div className={`${mobileElevatedCard} border-dashed px-4 py-10 text-center`}>
            <p className="text-[15px] font-bold text-brand-navy">No workflows available</p>
            <p className="mt-2 text-[13px] leading-relaxed text-brand-muted">
              Your role or project access does not include any More menu items right now.
            </p>
          </div>
        ) : null}

        {sections.map((section) => {
          const menuItems = section.items;
          const accountExtras = section.id === "account" ? MORE_ACCOUNT_EXTRAS : [];
          if (menuItems.length === 0 && accountExtras.length === 0) return null;

          return (
            <section key={section.id}>
              <h2 className="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-mist">
                {section.title}
              </h2>
              <ul className={mobileElevatedCard}>
                {menuItems.map((item, index) => (
                  <li
                    key={item.id}
                    className={index > 0 ? "border-t border-brand-line/50" : undefined}
                  >
                    <MoreMenuRow item={item} unreadCount={unreadCount} />
                  </li>
                ))}
                {accountExtras.map((extra, index) => (
                  <li
                    key={extra.id}
                    className={
                      menuItems.length + index > 0 ? "border-t border-brand-line/50" : undefined
                    }
                  >
                    <AccountExtraRow extra={extra} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <button
          type="button"
          onClick={logout}
          className="m-press flex w-full items-center justify-center gap-2 rounded-[18px] border border-brand-line/60 bg-white py-3.5 text-[15px] font-semibold text-[#E35D4A] shadow-[0_2px_12px_rgba(8,35,63,0.06)] active:scale-[0.99]"
        >
          <IconSignOut className="text-[#E35D4A]" />
          Sign out
        </button>
      </main>
    </div>
  );
}
