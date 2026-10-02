"use client";

import Link from "next/link";
import { NOTIFICATION_MODULE_LABELS } from "@/lib/mobile/notifications";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import type { NotificationModule } from "@/lib/mobile/types";
import { IconBack } from "../icons";

const PREFERENCE_SECTIONS: NotificationModule[] = [
  "rfi",
  "submittal",
  "safety",
  "daily_log",
  "document",
  "schedule",
  "time",
];

export function NotificationPreferencesScreen() {
  const {
    preferences,
    setPushEnabled,
    setSmsEnabled,
    togglePreferenceLabel,
  } = useMobileApp();

  return (
    <>
      <header className="flex items-center gap-2 border-b border-brand-line/80 bg-white px-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <Link
          href="/mobile-preview/notifications"
          className="m-press flex h-10 w-10 items-center justify-center rounded-full text-brand-navy active:bg-brand-soft"
          aria-label="Back to notifications"
        >
          <IconBack />
        </Link>
        <div className="min-w-0">
          <h1 className="text-[17px] font-semibold text-brand-navy">Notification preferences</h1>
          <p className="text-[12px] text-brand-muted">Local prototype settings only</p>
        </div>
      </header>

      <main className="space-y-5 px-4 py-4">
        <section className="rounded-mobile-lg border border-brand-line/70 bg-white p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-brand-mist">
            Delivery
          </p>
          <ToggleRow
            label="Push Notifications"
            description={preferences.pushEnabled ? "Push enabled" : "Push disabled"}
            checked={preferences.pushEnabled}
            onChange={setPushEnabled}
          />
          <ToggleRow
            label="SMS Notifications"
            description="Optional delivery channel"
            checked={preferences.smsEnabled}
            onChange={setSmsEnabled}
          />
        </section>

        {PREFERENCE_SECTIONS.map((module) => {
          const section = preferences.modules[module];
          return (
            <section
              key={module}
              className="rounded-mobile-lg border border-brand-line/70 bg-white p-4 shadow-soft"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-brand-mist">
                {NOTIFICATION_MODULE_LABELS[module]}
              </p>
              <ul className="mt-1 divide-y divide-brand-line/70">
                {section.labels.map((item) => (
                  <li key={item.key} className="py-1">
                    <ToggleRow
                      label={item.label}
                      checked={item.enabled}
                      onChange={() => togglePreferenceLabel(module, item.key)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
    </>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-brand-navy">{label}</p>
        {description ? <p className="mt-0.5 text-[12px] text-brand-muted">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand-blue" : "bg-brand-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
