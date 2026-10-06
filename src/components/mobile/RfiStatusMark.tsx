import type { RfiPriority, RfiStatus } from "@/lib/mobile/rfis";
import { rfiPriorityLabel, rfiStatusLabel } from "@/lib/mobile/rfis";

const TONE: Record<RfiStatus, { text: string; dot: string }> = {
  draft: { text: "text-[#6B6258]", dot: "bg-[#C4B8A8]" },
  open: { text: "text-brand-blue", dot: "bg-brand-blue" },
  answered: { text: "text-[#1B6B45]", dot: "bg-status-success" },
  closed: { text: "text-brand-muted", dot: "bg-brand-mist" },
  void: { text: "text-brand-muted", dot: "bg-[#C5CED6]" },
};

const PRIORITY: Record<RfiPriority, string> = {
  low: "text-brand-mist",
  normal: "text-brand-muted",
  high: "text-[#8A6232]",
  urgent: "text-[#8A4B3A]",
};

export function RfiStatusMark({
  status,
  responses = [],
}: {
  status: RfiStatus;
  responses?: readonly { id: string }[];
}) {
  const tone = TONE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${tone.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
      {rfiStatusLabel({ status, responses })}
    </span>
  );
}

export function RfiPriorityMark({ priority }: { priority: RfiPriority }) {
  return <span className={`text-[12px] font-semibold ${PRIORITY[priority]}`}>{rfiPriorityLabel(priority)}</span>;
}
