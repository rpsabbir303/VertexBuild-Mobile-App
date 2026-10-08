"use client";

import type { ReactNode } from "react";

type Variant = "error" | "warning";

const STYLES: Record<Variant, string> = {
  error: "border-red-200 bg-red-50 text-status-danger",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

export function AuthFormAlert({
  children,
  variant = "error",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <div
      className={`rounded-mobile border px-3.5 py-3 text-[13px] font-medium leading-relaxed ${STYLES[variant]}`}
      role="alert"
    >
      {children}
    </div>
  );
}
