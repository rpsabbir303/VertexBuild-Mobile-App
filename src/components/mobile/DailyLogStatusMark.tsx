import type { DailyLogStatus } from "@/lib/mobile/types";

const STATUS: Record<DailyLogStatus, { label: string; text: string; dot: string }> = {
  draft: { label: "Draft", text: "text-[#6B6258]", dot: "bg-[#C4B8A8]" },
  saved_locally: { label: "Saved locally", text: "text-[#8A6232]", dot: "bg-[#D4A24C]" },
  queued: { label: "Queued", text: "text-brand-blue", dot: "bg-brand-blue" },
  synced: { label: "Synced", text: "text-[#2C7A54]", dot: "bg-[#7DCAA3]" },
  submitted: { label: "Submitted", text: "text-[#1B6B45]", dot: "bg-status-success" },
};

export function DailyLogStatusMark({ status }: { status: DailyLogStatus }) {
  const tone = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${tone.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
      {tone.label}
    </span>
  );
}
