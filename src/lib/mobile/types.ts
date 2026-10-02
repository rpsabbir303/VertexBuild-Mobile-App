export type ProjectStatus = "active" | "preconstruction" | "closeout";

export type MockProject = {
  id: string;
  name: string;
  city: string;
  state: string;
  sector: string;
  status: ProjectStatus;
};

export type AttentionItem = {
  id: string;
  reference: string;
  statusLine: string;
  detail: string;
  dueText: string;
  statusTone: "danger" | "warning" | "info" | "neutral";
  projectId: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  timeLabel: string;
  projectId: string;
};

export type NotificationModule =
  | "rfi"
  | "submittal"
  | "punch"
  | "safety"
  | "daily_log"
  | "time"
  | "assignment"
  | "document"
  | "drawing"
  | "meeting"
  | "approval"
  | "schedule"
  | "change_order";

export type NotificationPriority = "urgent" | "attention" | "review" | "normal" | "info";

export type NotificationFilterCategory =
  | "assignments"
  | "approvals"
  | "mentions"
  | "rfi"
  | "submittals"
  | "safety"
  | "punch"
  | "schedule"
  | "daily_log"
  | "time";

export type NotificationTimeGroup = "today" | "yesterday" | "earlier";

export type NotificationDeepLinkState = "available" | "no_access" | "offline";

export type MockRole =
  | "project_manager"
  | "superintendent"
  | "foreman"
  | "field_worker"
  | "safety_user"
  | "field_user";

export type MockNotification = {
  id: string;
  module: NotificationModule;
  type: string;
  title: string;
  /** Use "current" to show the active project from the project selector */
  projectId: string | "current";
  description: string;
  timeLabel: string;
  absoluteTime: string;
  timeGroup: NotificationTimeGroup;
  priority: NotificationPriority;
  filterCategory: NotificationFilterCategory;
  /** Row status chip e.g. Review, Assigned, Mention */
  statusLabel: string;
  /** Optional override for the category segment in context line */
  contextModuleLabel?: string;
  read: boolean;
  roles: MockRole[];
  destination: string;
  destinationLabel: string;
  recordId?: string;
  recordLabel?: string;
  deepLinkState?: NotificationDeepLinkState;
};

export type NotificationReadFilter = "all" | "unread";

export type NotificationPreferences = {
  pushEnabled: boolean;
  smsEnabled: boolean;
  modules: Record<
    NotificationModule,
    {
      enabled: boolean;
      labels: { key: string; label: string; enabled: boolean }[];
    }
  >;
};

export type NotificationListStatus = "loading" | "ready" | "error";

export type QuickActionId = "new_rfi" | "upload_doc" | "daily_log" | "report_issue";

export type MobileTab = "home" | "logs" | "capture" | "time" | "more";

export type DailyLogStatus = "draft" | "saved" | "submitted";

export type MockDailyLog = {
  id: string;
  projectId: string;
  dayLabel: string;
  dateLabel: string;
  title: string;
  summary: string;
  status: DailyLogStatus;
};

export type MockTimeEntry = {
  id: string;
  dayLabel: string;
  rangeLabel: string;
  hoursLabel: string;
};

/** @deprecated legacy badge helper */
export type NotificationStatus =
  | "unread"
  | "needs_review"
  | "approved"
  | "attention"
  | "informational";
