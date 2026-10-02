import { iconClasses } from "@/lib/iconClasses";

type IconProps = { className?: string; strokeWidth?: number };

const NAV = "h-[22px] w-[22px] shrink-0";
const MD = "h-5 w-5 shrink-0";
const SM = "h-[18px] w-[18px] shrink-0";
const LG = "h-6 w-6 shrink-0";

export function IconHome({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(NAV, className)}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconProjects({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(NAV, className)}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconBell({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(NAV, className)}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 16H6l1.2-1.6A4 4 0 0 0 8 12.5V10a4 4 0 1 1 8 0v2.5a4 4 0 0 0 .8 2.1L18 16Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconMore({ className }: IconProps) {
  return (
    <svg
      className={iconClasses(NAV, className)}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="6" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconOverflow({ className }: IconProps) {
  return (
    <svg
      className={iconClasses(MD, className)}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconLogs({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(NAV, className)}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 4h8a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M10 9h4M10 13h4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconCapture({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(NAV, className)}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2l1.2-1.6A1.5 1.5 0 0 1 10.9 4h2.2a1.5 1.5 0 0 1 1.2.4L15.5 6h2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function IconTime({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(NAV, className)}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M12 8v4.5L15 15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronDown({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      className={iconClasses(SM, className)}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronRight({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      className={iconClasses(SM, className)}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(MD, className)}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconFilter({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(MD, className)}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCheck({ className, strokeWidth = 2.25 }: IconProps) {
  return (
    <svg
      className={iconClasses(MD, className)}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="m5 12.5 4 4L19 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      className={iconClasses(MD, className)}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconBack({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      className={iconClasses(LG, className)}
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M14 6 8 12l6 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconRfi({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses("h-4 w-4 shrink-0", className)}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M7 4h10a2 2 0 0 1 2 2v12l-3-2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M10 9h4M10 13h2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconUpload({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses("h-4 w-4 shrink-0", className)}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 16V6M8 10l4-4 4 4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M5 18h14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconDailyLog({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses("h-4 w-4 shrink-0", className)}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M9 9h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconIssue({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses("h-4 w-4 shrink-0", className)}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M10.3 4.5h3.4L20 12l-6.3 7.5h-3.4L4 12l6.3-7.5Z" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function IconPlus({ className, strokeWidth = 2.25 }: IconProps) {
  return (
    <svg
      className={iconClasses("h-6 w-6 shrink-0", className)}
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconSelectList({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(MD, className)}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M8 6h12M8 12h12M8 18h12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="4" cy="6" r="1.25" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="4" cy="12" r="1.25" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="4" cy="18" r="1.25" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function IconMarkRead({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(MD, className)}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6.5 12 12l8-5.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V6.5Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconTrash({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(MD, className)}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M9 4h6M5 7h14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path
        d="M8 7v11a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M10 10v5M14 10v5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconCircle({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(SM, className)}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function IconArrowUpRight({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      className={iconClasses("h-4 w-4 shrink-0", className)}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Lucide-style outline icons for the More menu */
export function IconMenuPunch({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg className={iconClasses(MD, className)} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="m9 14 2 2 4-4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMenuSafety({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg className={iconClasses(MD, className)} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMenuDrawings({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg className={iconClasses(MD, className)} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4M10 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMenuDocuments({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg className={iconClasses(MD, className)} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M10 13H8M10 17H8M14 13h2M14 17h2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMenuMeetings({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg className={iconClasses(MD, className)} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconMenuAi({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg className={iconClasses(MD, className)} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 3v4M22 5h-4M4 17v4M2 19h4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMenuProfile({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg className={iconClasses(MD, className)} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconBuildingProject({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg className={iconClasses(SM, className)} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12h12M6 8h12M6 16h12M10 6h4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconEye({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(MD, className)}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 12C4.5 7.5 8 5 12 5s7.5 2.5 9.5 7c-2 4.5-5.5 7-9.5 7s-7.5-2.5-9.5-7Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function IconEyeOff({ className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg
      className={iconClasses(MD, className)}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18M10.5 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1M6.2 6.2C4.8 7.3 3.6 8.8 2.5 12c2 4.5 5.5 7 9.5 7 1.6 0 3-.4 4.2-1.1M9.9 5.2A10.8 10.8 0 0 1 12 5c4 0 7.5 2.5 9.5 7-1 2.3-2.6 4.2-4.5 5.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function VertexMark({ className }: { className?: string }) {
  return (
    <svg
      className={iconClasses("h-7 w-7 shrink-0", className)}
      width={28}
      height={28}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#08233F" />
      <path d="M8 22 16 8l8 14H8Z" fill="#146EF5" />
      <path d="M12 22h8l-2-3.5h-4L12 22Z" fill="#FF6A00" />
    </svg>
  );
}
