"use client";

import Link from "next/link";
import { IconBack } from "../icons";

export function PermissionDeniedScreen({ backHref = "/mobile-preview/more" }: { backHref?: string }) {
  return (
    <>
      <header className="flex items-center gap-2 border-b border-brand-line/80 bg-white/90 px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <Link
          href={backHref}
          className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
          aria-label="Back"
        >
          <IconBack />
        </Link>
        <h1 className="truncate text-[17px] font-semibold text-brand-navy">Access restricted</h1>
      </header>
      <main className="px-4 py-8">
        <div className="rounded-mobile-lg border border-brand-line/80 bg-white/95 px-4 py-8 text-center shadow-soft">
          <p className="text-[17px] font-bold text-brand-navy">Access restricted</p>
          <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">
            You don&apos;t have permission to access this area.
          </p>
          <Link
            href={backHref}
            className="m-press mt-6 inline-flex rounded-mobile bg-brand-blue px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            Back
          </Link>
        </div>
      </main>
    </>
  );
}
