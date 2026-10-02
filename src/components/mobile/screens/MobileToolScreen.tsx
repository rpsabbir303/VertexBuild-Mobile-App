"use client";

import { canAccessToolSlug } from "@/lib/mobile/roleConfig";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { PermissionDeniedScreen } from "./PermissionDeniedScreen";
import { ProfileScreen } from "./ProfileScreen";
import { ToolPlaceholderScreen } from "./ToolPlaceholderScreen";

export function MobileToolScreen({ slug }: { slug: string }) {
  const { user, currentProject, accessibleProjects } = useMobileApp();
  const accessibleProjectIds = accessibleProjects.map((p) => p.id);
  const allowed = canAccessToolSlug(
    slug,
    user.role,
    accessibleProjectIds,
    currentProject.id,
  );

  if (!allowed) {
    return <PermissionDeniedScreen />;
  }

  if (slug === "profile") {
    return <ProfileScreen />;
  }

  return <ToolPlaceholderScreen slug={slug} />;
}
