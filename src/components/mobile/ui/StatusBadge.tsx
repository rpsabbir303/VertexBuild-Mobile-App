import type { NotificationStatus } from "@/lib/mobile/types";

const toneMap: Record<
  NotificationStatus | "danger" | "warning" | "info" | "neutral" | "success",
  string
> = {
  unread: "bg-brand-blue/10 text-brand-blue",
  needs_review: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-800",
  attention: "bg-orange-50 text-orange-800",
  informational: "bg-brand-soft text-brand-muted",
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-800",
  info: "bg-brand-blue/10 text-brand-blue",
  neutral: "bg-brand-soft text-brand-muted",
  success: "bg-emerald-50 text-emerald-800",
};

const labelMap: Record<NotificationStatus, string> = {
  unread: "Unread",
  needs_review: "Needs review",
  approved: "Approved",
  attention: "Attention",
  informational: "Info",
};

export function StatusBadge({
  label,
  tone,
}: {
  label?: string;
  tone: keyof typeof toneMap;
}) {
  const display = label ?? (tone in labelMap ? labelMap[tone as NotificationStatus] : tone);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ${toneMap[tone]}`}
    >
      {display}
    </span>
  );
}
