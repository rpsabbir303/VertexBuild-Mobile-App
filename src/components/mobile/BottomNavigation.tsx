"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCapture, IconHome, IconLogs, IconMore, IconTime } from "./icons";

const tabs = [
  {
    href: "/mobile-preview",
    label: "Home",
    icon: IconHome,
    match: (p: string) => p === "/mobile-preview",
  },
  {
    href: "/mobile-preview/logs",
    label: "Logs",
    icon: IconLogs,
    match: (p: string) => p.startsWith("/mobile-preview/logs"),
  },
  {
    href: "/mobile-preview/capture",
    label: "Capture",
    icon: IconCapture,
    match: (p: string) => p.startsWith("/mobile-preview/capture"),
  },
  {
    href: "/mobile-preview/time",
    label: "Time",
    icon: IconTime,
    match: (p: string) => p.startsWith("/mobile-preview/time"),
  },
  {
    href: "/mobile-preview/more",
    label: "More",
    icon: IconMore,
    match: (p: string) =>
      p.startsWith("/mobile-preview/more") || p.startsWith("/mobile-preview/tools"),
  },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-40 border-t border-brand-line/80 bg-white/92 backdrop-blur-md"
      style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom, 0px))" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex h-[58px] w-full items-stretch justify-between px-1">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 transition-colors ${
                active ? "text-brand-blue" : "text-brand-mist"
              }`}
            >
              {active ? (
                <span
                  className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand-blue"
                  aria-hidden="true"
                />
              ) : null}
              <Icon strokeWidth={active ? 2 : 1.65} />
              <span
                className={`truncate text-[10px] leading-none tracking-[0.01em] ${
                  active ? "font-semibold" : "font-medium"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
