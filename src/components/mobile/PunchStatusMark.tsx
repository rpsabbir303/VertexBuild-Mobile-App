import { punchStatusLabel, type PunchStatus } from "@/lib/mobile/punch";

const TONE: Record<PunchStatus, { text: string; dot: string }> = {
  open: { text: "text-brand-blue", dot: "bg-brand-blue" },
  in_progress: { text: "text-[#8A6232]", dot: "bg-[#C9957A]" },
  completed: { text: "text-[#1B6B45]", dot: "bg-status-success" },
  verified: { text: "text-brand-navy", dot: "bg-brand-navy" },
  void: { text: "text-brand-muted", dot: "bg-[#C5CED6]" },
};

export function PunchStatusMark({ status }: { status: PunchStatus }) {
  const tone = TONE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${tone.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
      {punchStatusLabel(status)}
    </span>
  );
}
