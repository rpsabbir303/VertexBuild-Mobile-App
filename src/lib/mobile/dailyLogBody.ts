import { markDailyLogSaved, patchDailyLog } from "./dailyLogs";
import { isFieldPhoto, normalizeWorkPhotos, type FieldPhoto } from "./photoEvidence";

export type WeatherCondition = "sunny" | "cloudy" | "rain" | "wind" | "snow";

export type CrewEntry = { id: string; name: string; workers: number; hours: number };

export type WorkEntry = {
  id: string;
  activity: string;
  location: string;
  description: string;
  photos: FieldPhoto[];
};

export type DeliveryEntry = {
  id: string;
  material: string;
  supplier: string;
  quantity: string;
  receivedLabel: string;
  notes: string;
};

export type EquipmentEntry = {
  id: string;
  name: string;
  hours: string;
  usage: string;
  notes: string;
};

export type IssueImpact = "low" | "medium" | "high";

export type IssueEntry = {
  id: string;
  type: string;
  impact: IssueImpact;
  notes: string;
  context: string;
  timeLabel: string;
  photos: string[];
};

export type DailyLogBody = {
  weather: {
    condition: WeatherCondition | null;
    high: string;
    low: string;
    notes: string;
  };
  crews: CrewEntry[];
  work: WorkEntry[];
  deliveries: DeliveryEntry[];
  equipment: EquipmentEntry[];
  issues: IssueEntry[];
};

export const WEATHER_CONDITIONS: { id: WeatherCondition; label: string }[] = [
  { id: "sunny", label: "Sunny" },
  { id: "cloudy", label: "Cloudy" },
  { id: "rain", label: "Rain" },
  { id: "wind", label: "Wind" },
  { id: "snow", label: "Snow" },
];

export const ISSUE_TYPES = ["Weather", "Material", "Labor", "Equipment", "Access", "Other"] as const;

export const LOG_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "weather", label: "Weather & Workforce" },
  { id: "work", label: "Work Performed" },
  { id: "materials", label: "Deliveries & Equipment" },
  { id: "issues", label: "Issues & Delays" },
  { id: "review", label: "Review" },
] as const;

export type LogSectionId = (typeof LOG_SECTIONS)[number]["id"];

const EMPTY_WEATHER: DailyLogBody["weather"] = { condition: null, high: "", low: "", notes: "" };

function normalizeWorkEntry(entry: WorkEntry): WorkEntry {
  const raw = entry.photos as unknown as (string | FieldPhoto)[];
  const photos = raw.every(isFieldPhoto) ? (raw as FieldPhoto[]).map((p) => ({ ...p })) : normalizeWorkPhotos(raw);
  return { ...entry, photos };
}

export function normalizeDailyLogBody(body: DailyLogBody): DailyLogBody {
  return {
    ...body,
    work: body.work.map(normalizeWorkEntry),
  };
}

export function cloneDailyLogBody(body: DailyLogBody): DailyLogBody {
  const normalized = normalizeDailyLogBody(body);
  return {
    weather: { ...normalized.weather },
    crews: normalized.crews.map((crew) => ({ ...crew })),
    work: normalized.work.map((entry) => ({ ...entry, photos: entry.photos.map((photo) => ({ ...photo })) })),
    deliveries: body.deliveries.map((entry) => ({ ...entry })),
    equipment: body.equipment.map((entry) => ({ ...entry })),
    issues: normalized.issues.map((entry) => ({ ...entry, photos: [...entry.photos] })),
  };
}

export function emptyDailyLogBody(): DailyLogBody {
  return {
    weather: { ...EMPTY_WEATHER },
    crews: [],
    work: [],
    deliveries: [],
    equipment: [],
    issues: [],
  };
}

type BodySeed = { projectId: string; dayOffset: number; body: DailyLogBody };

const BODY_SEEDS: BodySeed[] = [
  {
    projectId: "proj-lakeshore",
    dayOffset: 0,
    body: {
      weather: { condition: "cloudy", high: "68", low: "54", notes: "Light wind. Deck is dry." },
      crews: [{ id: "crew-concrete", name: "Concrete", workers: 12, hours: 8 }],
      work: [
        {
          id: "work-pour",
          activity: "Concrete placement",
          location: "Level 2 · East Wing",
          description: "Placement underway on the east bay.",
          photos: [],
        },
      ],
      deliveries: [],
      equipment: [
        { id: "eq-pump", name: "Concrete pump", hours: "6", usage: "Used today", notes: "" },
      ],
      issues: [],
    },
  },
  {
    projectId: "proj-lakeshore",
    dayOffset: -1,
    body: {
      weather: { condition: "sunny", high: "71", low: "52", notes: "" },
      crews: [
        { id: "crew-concrete-y", name: "Concrete", workers: 12, hours: 8 },
        { id: "crew-labor-y", name: "Labor", workers: 7, hours: 6 },
      ],
      work: [
        {
          id: "work-pour-y",
          activity: "Concrete placement",
          location: "Level 2",
          description: "Completed the east bay placement.",
          photos: [
            {
              id: "work-pour-y-photo",
              src: "",
              capturedAt: new Date().toISOString(),
              locationLabel: null,
              gpsState: "unavailable",
              uploadStatus: "uploaded",
              legacyLabel: "Placement photo",
            },
          ],
        },
      ],
      deliveries: [
        {
          id: "del-mix",
          material: "Concrete mix",
          supplier: "ABC Materials",
          quantity: "48 cy",
          receivedLabel: "Received 7:40 AM",
          notes: "",
        },
      ],
      equipment: [
        { id: "eq-pump-y", name: "Concrete pump", hours: "7", usage: "Used today", notes: "" },
      ],
      issues: [
        {
          id: "iss-rain",
          type: "Weather",
          impact: "medium",
          notes: "Rain stopped exterior work.",
          context: "East elevation",
          timeLabel: "2:30 PM",
          photos: [],
        },
      ],
    },
  },
  {
    projectId: "proj-lakeshore",
    dayOffset: -2,
    body: {
      weather: { condition: "cloudy", high: "64", low: "50", notes: "" },
      crews: [{ id: "crew-mep", name: "MEP", workers: 9, hours: 8 }],
      work: [
        {
          id: "work-mep",
          activity: "MEP rough-in",
          location: "East Wing",
          description: "Overhead rough-in continued on level 2.",
          photos: [],
        },
      ],
      deliveries: [],
      equipment: [],
      issues: [],
    },
  },
];

let bodies: Record<string, DailyLogBody> = {};
const listeners = new Set<() => void>();
const EMPTY_BODIES: Record<string, DailyLogBody> = {};

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeDailyLogBodies(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDailyLogBodies(): Record<string, DailyLogBody> {
  return bodies;
}

export function getServerDailyLogBodies(): Record<string, DailyLogBody> {
  return EMPTY_BODIES;
}

export function nextEntryId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function resolveDailyLogBody(
  logId: string,
  projectId: string,
  dayOffset: number | null,
): DailyLogBody {
  const stored = bodies[logId];
  if (stored) return normalizeDailyLogBody(stored);
  if (dayOffset == null) return emptyDailyLogBody();
  const seed = BODY_SEEDS.find((item) => item.projectId === projectId && item.dayOffset === dayOffset);
  return seed ? normalizeDailyLogBody(seed.body) : emptyDailyLogBody();
}

export function saveDailyLogBody(logId: string, body: DailyLogBody, offline: boolean) {
  const normalized = normalizeDailyLogBody(body);
  bodies = { ...bodies, [logId]: normalized };
  const first = normalized.work[0];
  if (first?.activity) {
    const location = first.location.trim();
    patchDailyLog(logId, {
      summary: location ? `${first.activity} · ${location}` : first.activity,
    });
  }
  markDailyLogSaved(logId, offline);
  emit();
}

export function weatherLabel(condition: WeatherCondition | null): string {
  return WEATHER_CONDITIONS.find((item) => item.id === condition)?.label ?? "Not recorded";
}

export function weatherSummary(body: DailyLogBody): string {
  if (!body.weather.condition) return "Not recorded";
  const temps = [body.weather.high, body.weather.low].filter(Boolean);
  const temp = temps.length === 2 ? `${temps[0]}° / ${temps[1]}°` : temps[0] ? `${temps[0]}°` : "";
  return [weatherLabel(body.weather.condition), temp].filter(Boolean).join(" · ");
}

export function workforceSummary(body: DailyLogBody): string {
  if (body.crews.length === 0) return "Not recorded";
  const workers = body.crews.reduce((sum, crew) => sum + crew.workers, 0);
  const crews = body.crews.length === 1 ? "1 crew" : `${body.crews.length} crews`;
  return `${workers} workers · ${crews}`;
}

export function countSummary(count: number, singular: string, plural: string): string {
  if (count === 0) return "None yet";
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

export function sectionSummary(section: LogSectionId, body: DailyLogBody): string {
  if (section === "weather") return `${weatherSummary(body)} · ${workforceSummary(body)}`;
  if (section === "work") return countSummary(body.work.length, "activity", "activities");
  if (section === "materials") {
    if (body.deliveries.length === 0 && body.equipment.length === 0) return "Not recorded";
    const parts = [
      body.deliveries.length
        ? countSummary(body.deliveries.length, "received", "received")
        : "",
      body.equipment.length ? countSummary(body.equipment.length, "active", "active") : "",
    ].filter(Boolean);
    return parts.join(" · ");
  }
  if (section === "issues") return countSummary(body.issues.length, "issue", "issues");
  if (section === "review") return "Field report";
  return "This date";
}
