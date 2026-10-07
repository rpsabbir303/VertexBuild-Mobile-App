import type { MockProject } from "./types";
import type {
  MockNotification,
  MockRole,
  NotificationFilterCategory,
  NotificationModule,
  NotificationPreferences,
  NotificationTimeGroup,
} from "./types";

export const NOTIFICATION_MODULE_LABELS: Record<NotificationModule, string> = {
  rfi: "RFI",
  submittal: "Submittals",
  punch: "Punch",
  safety: "Safety",
  daily_log: "Daily Logs",
  time: "Time",
  assignment: "Assignments",
  document: "Documents",
  drawing: "Drawings",
  meeting: "Meetings",
  approval: "Approvals",
  schedule: "Schedule",
  change_order: "Change Orders",
};

export const NOTIFICATION_FILTER_OPTIONS: {
  id: NotificationFilterCategory | "all";
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "assignments", label: "Assignments" },
  { id: "approvals", label: "Approvals" },
  { id: "mentions", label: "Mentions" },
  { id: "rfi", label: "RFI" },
  { id: "submittals", label: "Submittals" },
  { id: "safety", label: "Safety" },
  { id: "punch", label: "Punch" },
  { id: "schedule", label: "Schedule" },
  { id: "daily_log", label: "Daily Logs" },
  { id: "time", label: "Time" },
];

export const TIME_GROUP_LABELS: Record<NotificationTimeGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  earlier: "Earlier",
};

export const MOCK_ROLE_OPTIONS: { id: MockRole; label: string }[] = [
  { id: "project_manager", label: "Project Manager" },
  { id: "superintendent", label: "Superintendent" },
  { id: "foreman", label: "Foreman / Crew Lead" },
  { id: "field_worker", label: "Field Worker" },
  { id: "safety_user", label: "Safety User" },
];

export const ROLE_LABELS: Record<MockRole, string> = {
  project_manager: "Project Manager",
  superintendent: "Superintendent",
  foreman: "Foreman / Crew Lead",
  field_worker: "Field Worker",
  safety_user: "Safety User",
  field_user: "Field Worker",
};

const ALL_ROLES: MockRole[] = [
  "project_manager",
  "superintendent",
  "foreman",
  "field_worker",
  "field_user",
  "safety_user",
];

/** Exactly 10 representative notification cards for the prototype. */
export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "n-01-rfi-response",
    module: "rfi",
    type: "response",
    filterCategory: "rfi",
    title: "RFI Response Received",
    projectId: "proj-lakeshore",
    description: "Response received for RFI #022.",
    timeLabel: "2 hours ago",
    absoluteTime: "October 2, 2026 · 10:15 AM",
    timeGroup: "today",
    priority: "normal",
    statusLabel: "View RFI",
    read: false,
    roles: ALL_ROLES,
    destination: "/mobile-preview/tools/rfis/rfi-022",
    destinationLabel: "View RFI",
    recordId: "RFI #022",
    recordLabel: "Structural connection detail",
  },
  {
    id: "n-02-safety-action",
    module: "safety",
    type: "corrective",
    filterCategory: "safety",
    title: "Safety Action Required",
    projectId: "proj-lakeshore",
    description: "Corrective action has been assigned for an incident.",
    timeLabel: "45 min ago",
    absoluteTime: "October 2, 2026 · 11:30 AM",
    timeGroup: "today",
    priority: "attention",
    statusLabel: "Attention",
    read: false,
    roles: ALL_ROLES,
    destination: "/mobile-preview/tools/safety",
    destinationLabel: "View safety item",
    recordId: "INC-118",
  },
  {
    id: "n-03-submittal-review",
    module: "submittal",
    type: "review",
    filterCategory: "submittals",
    title: "Submittal Requires Review",
    projectId: "proj-lakeshore",
    description: "Submittal #022 is waiting for your review.",
    timeLabel: "3 hours ago",
    absoluteTime: "October 2, 2026 · 9:00 AM",
    timeGroup: "today",
    priority: "review",
    statusLabel: "Review",
    read: false,
    roles: ALL_ROLES,
    destination: "/mobile-preview/tools/submittals/submittal-022",
    destinationLabel: "View Submittal",
    recordId: "Submittal #022",
  },
  {
    id: "n-04-submittal-approved",
    module: "submittal",
    type: "approved",
    filterCategory: "submittals",
    title: "Submittal Approved",
    projectId: "proj-westbridge",
    description: "Submittal #018 has been approved by the design team.",
    timeLabel: "Yesterday",
    absoluteTime: "October 1, 2026 · 3:45 PM",
    timeGroup: "yesterday",
    priority: "info",
    statusLabel: "Info",
    read: true,
    roles: ALL_ROLES,
    destination: "/mobile-preview/tools/submittals/submittal-018",
    destinationLabel: "View Submittal",
    recordId: "Submittal #018",
  },
  {
    id: "n-05-daily-log-missing",
    module: "daily_log",
    type: "missing",
    filterCategory: "daily_log",
    title: "Daily Log Missing",
    projectId: "proj-westbridge",
    description: "Today's daily log has not been submitted.",
    timeLabel: "Yesterday",
    absoluteTime: "October 1, 2026 · 5:00 PM",
    timeGroup: "yesterday",
    priority: "attention",
    statusLabel: "Attention",
    read: false,
    roles: ALL_ROLES,
    destination: "/mobile-preview/logs",
    destinationLabel: "View Daily Log",
  },
  {
    id: "n-06-task-assigned",
    module: "assignment",
    type: "assigned",
    filterCategory: "assignments",
    title: "Task Assigned",
    projectId: "current",
    contextModuleLabel: "Assigned Work",
    description: "A new field task has been assigned to you.",
    timeLabel: "Yesterday",
    absoluteTime: "October 1, 2026 · 2:10 PM",
    timeGroup: "yesterday",
    priority: "normal",
    statusLabel: "Assigned",
    read: false,
    roles: ALL_ROLES,
    destination: "/mobile-preview/tools/assigned-work",
    destinationLabel: "View Assigned Work",
  },
  {
    id: "n-07-timesheet-approval",
    module: "time",
    type: "approval",
    filterCategory: "time",
    title: "Timesheet Requires Approval",
    projectId: "current",
    description: "Timesheet #104 requires your review.",
    timeLabel: "2 days ago",
    absoluteTime: "September 30, 2026 · 4:20 PM",
    timeGroup: "earlier",
    priority: "review",
    statusLabel: "Review",
    read: false,
    roles: ALL_ROLES,
    destination: "/mobile-preview/time",
    destinationLabel: "View Timesheet",
    recordId: "Timesheet #104",
  },
  {
    id: "n-08-punch-assigned",
    module: "punch",
    type: "assigned",
    filterCategory: "punch",
    title: "Punch Item Assigned",
    projectId: "current",
    description: "Punch item #P-184 has been assigned to you.",
    timeLabel: "2 days ago",
    absoluteTime: "September 30, 2026 · 11:00 AM",
    timeGroup: "earlier",
    priority: "normal",
    statusLabel: "Assigned",
    read: false,
    roles: ALL_ROLES,
    destination: "/mobile-preview/tools/punch/punch-009",
    destinationLabel: "View Punch Item",
    recordId: "Punch #P-184",
    deepLinkState: "offline",
  },
  {
    id: "n-09-schedule-milestone",
    module: "schedule",
    type: "milestone",
    filterCategory: "schedule",
    title: "Schedule Milestone",
    projectId: "current",
    description: "Level 3 inspection is scheduled for tomorrow.",
    timeLabel: "Last week",
    absoluteTime: "September 25, 2026 · 8:00 AM",
    timeGroup: "earlier",
    priority: "attention",
    statusLabel: "Attention",
    read: true,
    roles: ALL_ROLES,
    destination: "/mobile-preview/tools/schedule",
    destinationLabel: "View Schedule",
  },
  {
    id: "n-10-mentioned",
    module: "rfi",
    type: "mention",
    filterCategory: "mentions",
    title: "You Were Mentioned",
    projectId: "proj-lakeshore",
    description: "Sarah mentioned you in RFI #022.",
    timeLabel: "Last week",
    absoluteTime: "September 24, 2026 · 1:15 PM",
    timeGroup: "earlier",
    priority: "normal",
    statusLabel: "Mention",
    read: false,
    roles: ALL_ROLES,
    destination: "/mobile-preview/tools/rfis/rfi-022",
    destinationLabel: "View RFI",
    recordId: "RFI #022",
  },
];

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  smsEnabled: false,
  modules: {
    rfi: {
      enabled: true,
      labels: [
        { key: "response", label: "Response received", enabled: true },
        { key: "due", label: "Due reminders", enabled: true },
      ],
    },
    submittal: {
      enabled: true,
      labels: [
        { key: "approval", label: "Approval updates", enabled: true },
        { key: "review", label: "Review requests", enabled: true },
      ],
    },
    safety: {
      enabled: true,
      labels: [
        { key: "incidents", label: "Incidents", enabled: true },
        { key: "corrective", label: "Corrective actions", enabled: true },
      ],
    },
    daily_log: {
      enabled: true,
      labels: [{ key: "submission", label: "Submission updates", enabled: true }],
    },
    document: {
      enabled: true,
      labels: [{ key: "updates", label: "Document updates", enabled: false }],
    },
    schedule: {
      enabled: true,
      labels: [{ key: "milestone", label: "Milestone reminders", enabled: true }],
    },
    time: {
      enabled: true,
      labels: [{ key: "timesheet", label: "Timesheet updates", enabled: true }],
    },
    punch: { enabled: true, labels: [{ key: "assigned", label: "Assignments", enabled: true }] },
    assignment: { enabled: true, labels: [{ key: "task", label: "Task updates", enabled: true }] },
    drawing: { enabled: true, labels: [{ key: "revision", label: "Revisions", enabled: true }] },
    meeting: { enabled: true, labels: [{ key: "reminder", label: "Reminders", enabled: true }] },
    approval: { enabled: true, labels: [{ key: "required", label: "Approval requests", enabled: true }] },
    change_order: { enabled: true, labels: [{ key: "review", label: "Review requests", enabled: true }] },
  },
};

export function notificationVisibleToRole(
  notification: MockNotification,
  role: MockRole,
): boolean {
  const normalized = role === "field_user" ? "field_worker" : role;
  return notification.roles.some((r) => {
    const nr = r === "field_user" ? "field_worker" : r;
    return nr === normalized || r === role;
  });
}

export function filterNotificationsForRole(
  notifications: MockNotification[],
  role: MockRole,
): MockNotification[] {
  return notifications.filter((n) => notificationVisibleToRole(n, role));
}

export function notificationMatchesCategory(
  notification: MockNotification,
  category: NotificationFilterCategory | "all",
): boolean {
  if (category === "all") return true;
  if (notification.filterCategory === category) return true;
  if (
    category === "approvals" &&
    (notification.type === "review" || notification.type === "approval")
  ) {
    return (
      notification.filterCategory === "submittals" || notification.filterCategory === "time"
    );
  }
  return false;
}

export function resolveNotificationProjectId(
  notification: MockNotification,
  activeProjectId: string,
): string {
  return notification.projectId === "current" ? activeProjectId : notification.projectId;
}

export function notificationMatchesProjectFilter(
  notification: MockNotification,
  filterProjectId: "all" | string,
  activeProjectId: string,
): boolean {
  if (filterProjectId === "all") return true;
  return resolveNotificationProjectId(notification, activeProjectId) === filterProjectId;
}

export function notificationWithinAccessibleProjects(
  notification: MockNotification,
  activeProjectId: string,
  accessibleProjectIds: readonly string[],
): boolean {
  const id = resolveNotificationProjectId(notification, activeProjectId);
  return accessibleProjectIds.includes(id);
}

export function resolveNotificationProjectName(
  notification: MockNotification,
  currentProject: MockProject,
  getProjectById: (id: string) => MockProject | undefined,
): string {
  const id = resolveNotificationProjectId(notification, currentProject.id);
  return getProjectById(id)?.name ?? currentProject.name;
}

export function notificationContextLine(
  notification: MockNotification,
  currentProject: MockProject,
  getProjectById: (id: string) => MockProject | undefined,
): string {
  const moduleLabel =
    notification.contextModuleLabel ?? NOTIFICATION_MODULE_LABELS[notification.module];
  const projectName = resolveNotificationProjectName(
    notification,
    currentProject,
    getProjectById,
  );
  return `${moduleLabel} · ${projectName}`;
}
