"use client";

import { DailyLogWorkflow } from "../daily-log/DailyLogWorkflow";

export function DailyLogOpenScreen({ logId }: { logId: string }) {
  return <DailyLogWorkflow logId={logId} />;
}
