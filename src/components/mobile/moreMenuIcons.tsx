import type { ComponentType } from "react";
import type { MoreMenuItemId } from "@/lib/mobile/roleConfig";
import {
  IconBell,
  IconMenuAi,
  IconMenuDocuments,
  IconMenuDrawings,
  IconMenuMeetings,
  IconMenuProfile,
  IconMenuPunch,
  IconMenuSafety,
} from "./icons";

const ICONS: Record<MoreMenuItemId, ComponentType<{ className?: string }>> = {
  punch: IconMenuPunch,
  safety: IconMenuSafety,
  drawings: IconMenuDrawings,
  documents: IconMenuDocuments,
  meetings: IconMenuMeetings,
  ai: IconMenuAi,
  notifications: IconBell,
  profile: IconMenuProfile,
};

export function MoreMenuIcon({ id, className }: { id: MoreMenuItemId; className?: string }) {
  const Icon = ICONS[id];
  return <Icon className={className} />;
}
