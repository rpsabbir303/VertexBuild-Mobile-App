import type { MoreMenuItemId } from "./roleConfig";

export type MoreMenuRowMeta = {
  title?: string;
  subtitle?: string;
  /** Small pill on the row (e.g. "New") */
  pill?: string;
};

export const MORE_MENU_ROW_META: Partial<Record<MoreMenuItemId, MoreMenuRowMeta>> = {
  punch: { title: "Punch List", subtitle: "12 open • 3 overdue" },
  safety: { title: "Safety", subtitle: "1 open inspection • toolbox due Fri" },
  drawings: { title: "Drawings", subtitle: "Sheet A-201 updated 2h ago" },
  documents: { title: "Documents", subtitle: "4 pending your review" },
  meetings: { title: "Meetings", subtitle: "OAC tomorrow · 9:00 AM" },
  ai: { title: "Vertex AI Assistant", subtitle: "Voice-to-log & field Q&A", pill: "New" },
  notifications: { title: "Notifications", subtitle: "Alerts across your projects" },
  profile: { title: "Profile", subtitle: "Account & sign-in preferences" },
};

export type MoreAccountExtraId = "offline-sync" | "settings";

export type MoreAccountExtra = {
  id: MoreAccountExtraId;
  label: string;
  subtitle: string;
  href: string;
};

export const MORE_ACCOUNT_EXTRAS: MoreAccountExtra[] = [
  {
    id: "offline-sync",
    label: "Offline & Sync",
    subtitle: "All changes synced · Wi‑Fi",
    href: "/mobile-preview/tools/offline-sync",
  },
  {
    id: "settings",
    label: "Settings",
    subtitle: "App preferences & privacy",
    href: "/mobile-preview/tools/settings",
  },
];
