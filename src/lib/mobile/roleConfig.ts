import type { MockRole } from "./types";

export type MoreMenuItemId =
  | "punch"
  | "safety"
  | "drawings"
  | "documents"
  | "meetings"
  | "ai"
  | "notifications"
  | "profile";

export type MoreMenuItem = {
  id: MoreMenuItemId;
  label: string;
  href: string;
  /** Roles allowed to see this item (normalized role keys). */
  roles: MockRole[];
  /** Requires an authorized project context. */
  requiresProject: boolean;
};

export type MoreMenuSection = {
  id: string;
  title: string;
  itemIds: MoreMenuItemId[];
};

/** Documented Mobile More Menu scope — do not add items outside this set. */
export const MORE_MENU_ITEMS: Record<MoreMenuItemId, MoreMenuItem> = {
  punch: {
    id: "punch",
    label: "Punch List",
    href: "/mobile-preview/tools/punch",
    roles: ["project_manager", "superintendent", "foreman", "field_worker", "field_user"],
    requiresProject: true,
  },
  safety: {
    id: "safety",
    label: "Safety",
    href: "/mobile-preview/tools/safety",
    roles: [
      "project_manager",
      "superintendent",
      "foreman",
      "field_worker",
      "field_user",
      "safety_user",
    ],
    requiresProject: true,
  },
  drawings: {
    id: "drawings",
    label: "Drawings",
    href: "/mobile-preview/tools/drawings",
    roles: [
      "project_manager",
      "superintendent",
      "foreman",
      "field_worker",
      "field_user",
      "safety_user",
    ],
    requiresProject: true,
  },
  documents: {
    id: "documents",
    label: "Documents",
    href: "/mobile-preview/tools/documents",
    roles: [
      "project_manager",
      "superintendent",
      "foreman",
      "field_worker",
      "field_user",
      "safety_user",
    ],
    requiresProject: true,
  },
  meetings: {
    id: "meetings",
    label: "Meetings",
    href: "/mobile-preview/tools/meetings",
    roles: ["project_manager", "superintendent", "foreman"],
    requiresProject: true,
  },
  ai: {
    id: "ai",
    label: "Vertex AI Assistant",
    href: "/mobile-preview/tools/ai",
    roles: ["project_manager", "superintendent", "foreman", "field_worker", "field_user"],
    requiresProject: true,
  },
  notifications: {
    id: "notifications",
    label: "Notifications",
    href: "/mobile-preview/notifications",
    roles: [
      "project_manager",
      "superintendent",
      "foreman",
      "field_worker",
      "field_user",
      "safety_user",
    ],
    requiresProject: true,
  },
  profile: {
    id: "profile",
    label: "Profile",
    href: "/mobile-preview/tools/profile",
    roles: [
      "project_manager",
      "superintendent",
      "foreman",
      "field_worker",
      "field_user",
      "safety_user",
    ],
    requiresProject: false,
  },
};

export const MORE_MENU_SECTIONS: MoreMenuSection[] = [
  {
    id: "field-work",
    title: "Field Work",
    itemIds: ["punch", "safety"],
  },
  {
    id: "project-information",
    title: "Project Information",
    itemIds: ["drawings", "documents", "meetings", "ai"],
  },
  {
    id: "account",
    title: "Account",
    itemIds: ["notifications", "profile"],
  },
];

export function normalizeMockRole(role: MockRole): MockRole {
  return role === "field_user" ? "field_worker" : role;
}

function roleMatches(role: MockRole, allowed: MockRole[]): boolean {
  const normalized = normalizeMockRole(role);
  return allowed.some((r) => normalizeMockRole(r) === normalized || r === role);
}

export function hasProjectAccessForRole(
  role: MockRole,
  projectId: string,
  accessibleProjectIds: string[],
): boolean {
  if (accessibleProjectIds.length === 0) return false;
  return accessibleProjectIds.includes(projectId);
}

export function canAccessMoreMenuItem(
  itemId: MoreMenuItemId,
  role: MockRole,
  accessibleProjectIds: string[],
  currentProjectId: string,
): boolean {
  const item = MORE_MENU_ITEMS[itemId];
  if (!roleMatches(role, item.roles)) return false;
  if (!item.requiresProject) return true;
  if (accessibleProjectIds.length === 0) return false;
  return hasProjectAccessForRole(role, currentProjectId, accessibleProjectIds);
}

export function filterMenuForRole(
  role: MockRole,
  accessibleProjectIds: string[],
  currentProjectId: string,
): Array<MoreMenuSection & { items: MoreMenuItem[] }> {
  return MORE_MENU_SECTIONS.map((section) => ({
    ...section,
    items: section.itemIds
      .map((id) => MORE_MENU_ITEMS[id])
      .filter((item) =>
        canAccessMoreMenuItem(item.id, role, accessibleProjectIds, currentProjectId),
      ),
  })).filter((section) => section.items.length > 0);
}

export function slugToMoreMenuItemId(slug: string): MoreMenuItemId | null {
  if (slug in MORE_MENU_ITEMS && slug !== "notifications") {
    return slug as MoreMenuItemId;
  }
  return null;
}

const OPEN_TOOL_SLUGS = new Set([
  "rfis",
  "submittals",
  "daily-logs",
  "settings",
  "offline-sync",
  "help",
]);

export function canAccessToolSlug(
  slug: string,
  role: MockRole,
  accessibleProjectIds: string[],
  currentProjectId: string,
): boolean {
  if (OPEN_TOOL_SLUGS.has(slug)) {
    if (slug === "settings" || slug === "offline-sync" || slug === "help") return true;
    if (accessibleProjectIds.length === 0) return false;
    return hasProjectAccessForRole(role, currentProjectId, accessibleProjectIds);
  }
  const itemId = slugToMoreMenuItemId(slug);
  if (!itemId) return false;
  return canAccessMoreMenuItem(itemId, role, accessibleProjectIds, currentProjectId);
}
