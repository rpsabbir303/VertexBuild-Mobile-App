import type {
  ActivityItem,
  AttentionItem,
  MockProject,
  MockRole,
} from "./types";

export { MOCK_NOTIFICATIONS } from "./notifications";

export const MOCK_USER = {
  firstName: "Alex",
  lastName: "Morgan",
  initials: "AM",
  company: "Summit Construction Group",
  role: "project_manager" as MockRole,
  roleLabel: "Project Manager",
};

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "proj-lakeshore",
    name: "Lakeshore Outpatient Pavilion",
    city: "Milwaukee",
    state: "WI",
    sector: "Healthcare",
    status: "active",
  },
  {
    id: "proj-westbridge",
    name: "Westbridge Distribution Hall",
    city: "Chicago",
    state: "IL",
    sector: "Industrial",
    status: "active",
  },
  {
    id: "proj-north-campus",
    name: "North Campus Science Hall",
    city: "Chicago",
    state: "IL",
    sector: "Institutional",
    status: "active",
  },
  {
    id: "proj-riverside",
    name: "Riverside Office Tower",
    city: "Milwaukee",
    state: "WI",
    sector: "Commercial",
    status: "active",
  },
  {
    id: "proj-harbor",
    name: "Harbor Exchange Workplace",
    city: "Chicago",
    state: "IL",
    sector: "Commercial",
    status: "preconstruction",
  },
  {
    id: "proj-oakwood",
    name: "Oakwood Residences Phase II",
    city: "Minneapolis",
    state: "MN",
    sector: "Multifamily",
    status: "active",
  },
];

export const DEFAULT_PROJECT_ID = "proj-lakeshore";

export const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "att-1",
    reference: "RFI #024",
    statusLine: "Response due today",
    detail: "Structural steel connection",
    dueText: "Due 4:00 PM",
    statusTone: "danger",
    projectId: "proj-lakeshore",
  },
  {
    id: "att-2",
    reference: "Submittal #018",
    statusLine: "Awaiting review",
    detail: "Curtain wall system",
    dueText: "Tomorrow",
    statusTone: "warning",
    projectId: "proj-lakeshore",
  },
  {
    id: "att-3",
    reference: "Observation #112",
    statusLine: "Needs follow-up",
    detail: "Deck housekeeping",
    dueText: "Within 2 days",
    statusTone: "info",
    projectId: "proj-westbridge",
  },
  {
    id: "att-4",
    reference: "Change Order #07",
    statusLine: "Awaiting approval",
    detail: "MEP reroute allowance",
    dueText: "Since yesterday",
    statusTone: "warning",
    projectId: "proj-north-campus",
  },
];

export const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "act-1",
    title: "RFI #024 updated",
    timeLabel: "2h ago",
    projectId: "proj-lakeshore",
  },
  {
    id: "act-2",
    title: "Submittal #018 approved",
    timeLabel: "4h ago",
    projectId: "proj-lakeshore",
  },
  {
    id: "act-3",
    title: "Project document updated",
    timeLabel: "Yesterday",
    projectId: "proj-lakeshore",
  },
  {
    id: "act-4",
    title: "Daily log submitted",
    timeLabel: "Yesterday",
    projectId: "proj-westbridge",
  },
];

export function getProjectById(id: string): MockProject | undefined {
  return MOCK_PROJECTS.find((p) => p.id === id);
}

export function projectLocation(project: MockProject): string {
  return `${project.city}, ${project.state}`;
}

export function projectSubtitle(project: MockProject): string {
  return `${project.sector} · ${project.city}, ${project.state}`;
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export const MOCK_TIME_ENTRIES = [
  {
    id: "time-1",
    dayLabel: "Monday",
    rangeLabel: "8:00 AM – 4:30 PM",
    hoursLabel: "8h 30m",
  },
  {
    id: "time-2",
    dayLabel: "Sunday",
    rangeLabel: "7:55 AM – 4:10 PM",
    hoursLabel: "8h 15m",
  },
];

