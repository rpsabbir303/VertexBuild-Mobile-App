import { canAccessToolSlug, slugToMoreMenuItemId } from "./roleConfig";
import { getAccessibleProjectsForRole } from "./projectAccess";
import type { MockRole } from "./types";

function slugFromToolHref(href: string): string | null {
  const match = href.match(/\/mobile-preview\/tools\/([^/?#]+)/);
  return match?.[1] ?? null;
}

/** Returns whether the user can open a notification destination (tool routes only). */
export function canAccessNotificationDestination(
  destination: string,
  role: MockRole,
  currentProjectId: string,
): boolean {
  if (destination.startsWith("/mobile-preview/logs")) return true;
  if (destination.startsWith("/mobile-preview/time")) return true;
  if (destination.startsWith("/mobile-preview/notifications")) {
    const accessible = getAccessibleProjectsForRole(role).map((p) => p.id);
    return accessible.length > 0 && accessible.includes(currentProjectId);
  }
  const slug = slugFromToolHref(destination);
  if (!slug) return true;
  const accessible = getAccessibleProjectsForRole(role).map((p) => p.id);
  if (slugToMoreMenuItemId(slug)) {
    return canAccessToolSlug(slug, role, accessible, currentProjectId);
  }
  return true;
}
