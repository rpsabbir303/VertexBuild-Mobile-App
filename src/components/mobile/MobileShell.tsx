"use client";

import { BottomNavigation } from "./BottomNavigation";
import { ProjectSelectorSheet } from "./ProjectSelectorSheet";

export function MobileShell({
  children,
  hideBottomNav = false,
}: {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}) {
  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-soft-sky text-brand-navy">
      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
          hideBottomNav ? "pb-4" : "pb-nav-safe"
        }`}
      >
        {children}
      </div>
      {!hideBottomNav ? <BottomNavigation /> : null}
      <ProjectSelectorSheet />
    </div>
  );
}
