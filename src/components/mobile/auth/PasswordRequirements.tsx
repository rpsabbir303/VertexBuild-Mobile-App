"use client";

import { evaluatePasswordRequirements } from "@/lib/mobile/auth";
import { IconCheck } from "../icons";

export function PasswordRequirements({ password }: { password: string }) {
  const items = evaluatePasswordRequirements(password);

  return (
    <div className="rounded-mobile border border-brand-line/80 bg-white/90 px-3.5 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-brand-muted">
        Password must contain
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-[13px]">
            <span
              className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
                item.met
                  ? "bg-emerald-50 text-emerald-600"
                  : "border border-brand-line bg-white text-brand-mist"
              }`}
              aria-hidden="true"
            >
              {item.met ? <IconCheck strokeWidth={3} className="h-3 w-3" /> : null}
            </span>
            <span className={item.met ? "text-brand-navy" : "text-brand-muted"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
