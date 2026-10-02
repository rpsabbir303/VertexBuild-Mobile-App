"use client";

import { useState } from "react";
import { MOCK_TIME_ENTRIES } from "@/lib/mobile/mockData";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { DestinationHeader } from "../DestinationHeader";

export function TimeScreen() {
  const { currentProject } = useMobileApp();
  const [clockedIn, setClockedIn] = useState(false);
  const [hoursLabel, setHoursLabel] = useState("0h 00m");

  function toggleClock() {
    if (clockedIn) {
      setClockedIn(false);
      setHoursLabel("3h 42m");
      return;
    }
    setClockedIn(true);
    setHoursLabel("0h 12m");
  }

  return (
    <>
      <DestinationHeader title="Time" subtitle="Workforce time for this project" />
      <main className="px-4 py-4">
        <section className="rounded-mobile-lg border border-white/80 bg-white/90 p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-mist">
            Today&apos;s status
          </p>
          <p className="mt-2 text-[18px] font-bold tracking-[-0.02em] text-brand-navy">
            {clockedIn ? "Clocked in" : "Not clocked in"}
          </p>
          <p className="mt-1 text-[12px] text-brand-muted">{currentProject.name}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-pill bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-muted">
              Geofence: On site
            </span>
            <span className="rounded-pill bg-brand-softblue px-2.5 py-1 text-[11px] font-semibold text-brand-blue">
              Approval: Pending review
            </span>
          </div>

          <button
            type="button"
            onClick={toggleClock}
            className={`m-press mt-4 w-full rounded-mobile py-3.5 text-[15px] font-semibold text-white ${
              clockedIn ? "bg-brand-navy" : "bg-brand-blue shadow-glow"
            }`}
          >
            {clockedIn ? "Clock Out" : "Clock In"}
          </button>
        </section>

        <section className="mt-4 rounded-mobile-lg border border-white/80 bg-white/90 p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-mist">
            Today&apos;s hours
          </p>
          <p className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-brand-navy">{hoursLabel}</p>
        </section>

        <section className="mt-5">
          <h2 className="mb-2.5 text-[16px] font-bold tracking-[-0.02em] text-brand-navy">
            Recent time entries
          </h2>
          <ul className="space-y-2.5">
            {MOCK_TIME_ENTRIES.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-mobile-lg border border-white/80 bg-white/90 px-3.5 py-3.5 shadow-soft"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-brand-navy">{entry.dayLabel}</p>
                  <p className="mt-0.5 text-[12px] text-brand-muted">{entry.rangeLabel}</p>
                </div>
                <p className="shrink-0 text-[13px] font-semibold tabular-nums text-brand-navy">
                  {entry.hoursLabel}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
