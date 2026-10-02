"use client";

import { useMemo } from "react";
import { MOCK_DAILY_LOGS } from "@/lib/mobile/mockData";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import type { DailyLogStatus } from "@/lib/mobile/types";
import { IconChevronRight } from "../icons";
import { DestinationHeader } from "../DestinationHeader";

const statusStyle: Record<DailyLogStatus, string> = {
  draft: "bg-amber-50 text-status-warning",
  saved: "bg-brand-softblue text-brand-blue",
  submitted: "bg-emerald-50 text-status-success",
};

const statusLabel: Record<DailyLogStatus, string> = {
  draft: "Draft",
  saved: "Saved",
  submitted: "Submitted",
};

export function LogsScreen() {
  const { currentProject } = useMobileApp();

  const logs = useMemo(() => {
    const forProject = MOCK_DAILY_LOGS.filter((l) => l.projectId === currentProject.id);
    return forProject.length > 0 ? forProject : MOCK_DAILY_LOGS.slice(0, 3);
  }, [currentProject.id]);

  return (
    <>
      <DestinationHeader title="Daily Logs" subtitle="Field activity records for this project" />
      <main className="px-4 py-4">
        <ul className="space-y-2.5">
          {logs.map((log) => (
            <li key={log.id}>
              <button
                type="button"
                className="m-press flex w-full items-start gap-3 rounded-mobile-lg border border-white/80 bg-white/90 p-3.5 text-left shadow-soft"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-brand-mist">
                      {log.dayLabel}
                    </p>
                    <span className="text-[12px] text-brand-muted">{log.dateLabel}</span>
                  </div>
                  <p className="mt-2 text-[15px] font-bold tracking-[-0.01em] text-brand-navy">
                    {log.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-brand-muted">{log.summary}</p>
                  <span
                    className={`mt-2.5 inline-flex rounded-pill px-2.5 py-1 text-[11px] font-semibold ${statusStyle[log.status]}`}
                  >
                    {statusLabel[log.status]}
                  </span>
                </div>
                <IconChevronRight className="mt-1 text-brand-mist" />
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
