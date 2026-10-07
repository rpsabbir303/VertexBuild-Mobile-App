import type { SubmittalStatus } from "@/lib/mobile/submittals";
import { submittalStatusLabel } from "@/lib/mobile/submittals";

const TONE: Record<SubmittalStatus, { text: string; dot: string }> = {
  draft: { text: "text-[#6B6258]", dot: "bg-[#C4B8A8]" },
  pending: { text: "text-[#8A6232]", dot: "bg-[#C9957A]" },
  approved: { text: "text-[#1B6B45]", dot: "bg-status-success" },
  rejected: { text: "text-[#8A4B3A]", dot: "bg-[#B8745E]" },
  returned: { text: "text-[#8A6232]", dot: "bg-[#C9957A]" },
  closed: { text: "text-brand-muted", dot: "bg-brand-mist" },
};

export function SubmittalStatusMark({ status }: { status: SubmittalStatus }) {
  const tone = TONE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${tone.text}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
      {submittalStatusLabel(status)}
    </span>
  );
}
