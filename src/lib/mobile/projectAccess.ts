import { getProjectById, MOCK_PROJECTS } from "./mockData";
import type { MockProject, MockRole } from "./types";

/** Projects shown in the Notification Center project selector (prototype scope). */
export const NOTIFICATION_SELECTOR_PROJECT_IDS = [
  "proj-lakeshore",
  "proj-westbridge",
  "proj-north-campus",
  "proj-harbor",
] as const;

const ROLE_PROJECT_IDS: Record<MockRole, readonly string[] | "all"> = {
  project_manager: "all",
  superintendent: "all",
  foreman: ["proj-lakeshore", "proj-westbridge"],
  field_worker: ["proj-lakeshore"],
  field_user: ["proj-lakeshore"],
  safety_user: ["proj-lakeshore", "proj-westbridge", "proj-north-campus"],
};

function normalizeRole(role: MockRole): MockRole {
  return role === "field_user" ? "field_worker" : role;
}

export function getAccessibleProjectsForRole(role: MockRole): MockProject[] {
  const normalized = normalizeRole(role);
  const access = ROLE_PROJECT_IDS[role] ?? ROLE_PROJECT_IDS[normalized];
  const allowedIds =
    access === "all"
      ? NOTIFICATION_SELECTOR_PROJECT_IDS
      : access.filter((id) =>
          NOTIFICATION_SELECTOR_PROJECT_IDS.includes(
            id as (typeof NOTIFICATION_SELECTOR_PROJECT_IDS)[number],
          ),
        );

  return allowedIds
    .map((id) => getProjectById(id))
    .filter((p): p is MockProject => Boolean(p));
}

export function userHasMultiProjectAccess(role: MockRole): boolean {
  return getAccessibleProjectsForRole(role).length > 1;
}
