"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  canAuthorDailyLog,
  canEditDailyLog,
  formatLogDate,
  getDailyLogById,
  getServerSessionLogs,
  getSessionLogs,
  parseIso,
  submitDailyLog,
  subscribeDailyLogs,
  syncQueuedDailyLog,
  todayIso,
} from "@/lib/mobile/dailyLogs";
import {
  cloneDailyLogBody,
  countSummary,
  getDailyLogBodies,
  getServerDailyLogBodies,
  ISSUE_TYPES,
  LOG_SECTIONS,
  nextEntryId,
  resolveDailyLogBody,
  saveDailyLogBody,
  sectionSummary,
  subscribeDailyLogBodies,
  type CrewEntry,
  type DailyLogBody,
  type DeliveryEntry,
  type EquipmentEntry,
  type IssueEntry,
  type IssueImpact,
  type LogSectionId,
  type WeatherCondition,
  type WorkEntry,
  WEATHER_CONDITIONS,
  weatherSummary,
  workforceSummary,
} from "@/lib/mobile/dailyLogBody";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { getProjectById } from "@/lib/mobile/mockData";
import { mobileElevatedCard, mobilePageBg } from "@/lib/mobile/mobileUi";
import type { DailyLogStatus } from "@/lib/mobile/types";
import { DailyLogStatusMark } from "../DailyLogStatusMark";
import { IconBack, IconChevronRight } from "../icons";
import { AddLine, ChoiceRow, EmptyRecord, EntryPanel, FieldText, PanelActions, RecordList, RecordRow } from "./FieldBits";
import { normalizeWorkPhotos, type FieldPhoto } from "@/lib/mobile/photoEvidence";
import { PhotoAttachments } from "./PhotoAttachments";
import type { PhotoParentContext } from "@/lib/mobile/photoEvidence";

function offsetFor(date: string, today: string): number {
  return Math.round((parseIso(date).getTime() - parseIso(today).getTime()) / 86400000);
}

function nextSection(current: LogSectionId): LogSectionId {
  const index = LOG_SECTIONS.findIndex((section) => section.id === current);
  return LOG_SECTIONS[Math.min(index + 1, LOG_SECTIONS.length - 1)]?.id ?? "review";
}

function logStateLine(status: DailyLogStatus, savedLabel: string, viewOnly: boolean): string {
  if (status === "submitted") return viewOnly ? "View only · submitted and locked" : "Submitted and locked";
  if (status === "synced") return viewOnly ? "View only · synced and locked" : "Synced and locked";
  return viewOnly ? `View only · ${savedLabel}` : savedLabel;
}

export function DailyLogWorkflow({ logId }: { logId: string }) {
  const { user, isOffline } = useMobileApp();
  const sessionLogs = useSyncExternalStore(subscribeDailyLogs, getSessionLogs, getServerSessionLogs);
  const storedBodies = useSyncExternalStore(
    subscribeDailyLogBodies,
    getDailyLogBodies,
    getServerDailyLogBodies,
  );
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<LogSectionId>("overview");
  const [syncError, setSyncError] = useState<string | null>(null);
  const sectionRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const rail = sectionRailRef.current;
    if (!rail) return;
    const active = rail.querySelector<HTMLElement>("[aria-current='step']");
    if (!active) return;
    const target = active.offsetLeft - (rail.clientWidth - active.offsetWidth) / 2;
    rail.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [section, ready]);

  const today = ready ? todayIso() : null;
  const log = useMemo(
    () => (today ? getDailyLogById(logId, today) : undefined),
    [today, logId, sessionLogs],
  );
  const project = log ? getProjectById(log.projectId) : undefined;
  const canEdit = Boolean(log && canEditDailyLog(user.role, log.status));
  const storedBody = log ? storedBodies[log.id] : undefined;
  const body = useMemo(() => {
    if (!log || !today) return null;
    if (storedBody) return storedBody;
    return resolveDailyLogBody(log.id, log.projectId, offsetFor(log.date, today));
  }, [log, today, storedBody]);

  function commit(next: DailyLogBody) {
    if (!log || !canEdit) return;
    saveDailyLogBody(log.id, next, isOffline);
  }

  function update(recipe: (draft: DailyLogBody) => void) {
    if (!body) return;
    const draft = cloneDailyLogBody(body);
    recipe(draft);
    commit(draft);
  }

  function trySync() {
    if (!log) return;
    if (isOffline) {
      setSyncError("Unable to sync your log. Your changes are still saved locally.");
      return;
    }
    setSyncError(null);
    if (log.status === "queued") syncQueuedDailyLog(log.id);
    else submitDailyLog(log.id, false);
  }

  if (!ready) {
    return (
      <div className={`${mobilePageBg} px-4 pt-6`} aria-hidden="true">
        <div className="h-4 w-24 animate-pulse rounded bg-brand-line/80" />
        <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-brand-line/70" />
        <div className="mt-6 h-24 animate-pulse rounded-[16px] bg-white" />
        <div className="mt-3 h-24 animate-pulse rounded-[16px] bg-white" />
      </div>
    );
  }

  if (!log || !project || !body) {
    return (
      <div className={mobilePageBg}>
        <header className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
          <Link href="/mobile-preview/logs" className="m-press inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted">
            <IconBack />
            Daily Logs
          </Link>
        </header>
        <main className="px-4 pt-6">
          <h1 className="text-[20px] font-bold tracking-[-0.03em] text-brand-navy">Daily Log unavailable</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">
            This log couldn&apos;t be opened from the project records.
          </p>
        </main>
      </div>
    );
  }

  const stepIndex = LOG_SECTIONS.findIndex((item) => item.id === section);

  return (
    <div className="min-h-full bg-brand-canvas">
      <header className="sticky top-0 z-10 border-b border-brand-line/50 bg-brand-canvas/95 px-4 pb-3 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-sm">
        <Link href="/mobile-preview/logs" className="m-press inline-flex h-9 items-center gap-1 text-[13px] font-semibold text-brand-muted">
          <IconBack />
          Daily Logs
        </Link>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold tracking-[-0.03em] text-brand-navy">Daily Log</h1>
            <p className="mt-1 truncate text-[15px] font-semibold text-brand-navy">{project.name}</p>
            <p className="mt-0.5 text-[13px] text-brand-muted">{formatLogDate(log.date)}</p>
          </div>
          <DailyLogStatusMark status={log.status} />
        </div>
        <p className="mt-2 text-[12px] font-medium text-brand-muted" role="status">
          {logStateLine(log.status, log.savedLabel, !canAuthorDailyLog(user.role))}
        </p>
        <div
          ref={sectionRailRef}
          className="mt-3 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Daily log sections"
        >
          <div className="flex min-w-max gap-1.5 pr-4">
            {LOG_SECTIONS.map((item, index) => {
              const active = item.id === section;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`m-press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold ${
                    active
                      ? "border-brand-navy bg-brand-navy text-white"
                      : "border-brand-line/80 bg-white text-brand-navy"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  <span className={`tabular-nums ${active ? "text-white/70" : "text-brand-mist"}`}>
                    {index + 1}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="px-4 pb-16 pt-4">
        {section === "overview" ? (
          <Overview
            body={body}
            locked={log.status === "submitted" || log.status === "synced"}
            onOpen={setSection}
          />
        ) : null}
        {section === "weather" ? (
          <WeatherSection body={body} canEdit={canEdit} update={update} />
        ) : null}
        {section === "work" ? (
          <WorkSection
            body={body}
            canEdit={canEdit}
            update={update}
            logId={log.id}
            projectId={project.id}
            projectName={project.name}
          />
        ) : null}
        {section === "materials" ? (
          <MaterialsSection body={body} canEdit={canEdit} update={update} />
        ) : null}
        {section === "issues" ? <IssuesSection body={body} canEdit={canEdit} update={update} /> : null}
        {section === "review" ? (
          <ReviewSection body={body} status={log.status} canEdit={canEdit} onEdit={setSection} />
        ) : null}
        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.12em] text-brand-mist">
          {stepIndex + 1} of {LOG_SECTIONS.length}
        </p>
        <div className="mt-6">
          {section === "review" ? (
            <ReviewActions
              canEdit={canEdit}
              status={log.status}
              offline={isOffline}
              syncError={syncError}
              onSubmit={() => {
                setSyncError(null);
                submitDailyLog(log.id, isOffline);
              }}
              onSync={trySync}
            />
          ) : (
            <div className="flex items-center justify-between gap-3">
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => commit(cloneDailyLogBody(body))}
                  className="h-12 px-1 text-[14px] font-semibold text-brand-muted"
                >
                  Save draft
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => {
                  if (canEdit) commit(cloneDailyLogBody(body));
                  setSection(nextSection(section));
                }}
                className="m-press h-12 min-w-[148px] rounded-full bg-brand-navy px-5 text-[14px] font-semibold text-white"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ReviewActions({
  canEdit,
  status,
  offline,
  syncError,
  onSubmit,
  onSync,
}: {
  canEdit: boolean;
  status: DailyLogStatus;
  offline: boolean;
  syncError: string | null;
  onSubmit: () => void;
  onSync: () => void;
}) {
  if (!canEdit) {
    return (
      <Link
        href="/mobile-preview/logs"
        className="m-press flex h-12 w-full items-center justify-center rounded-full bg-brand-navy text-[15px] font-semibold text-white"
      >
        Back to Logs
      </Link>
    );
  }

  return (
    <div>
      {syncError ? (
        <p className="mb-2 text-[13px] leading-snug text-[#5C5348]" role="alert">
          {syncError}
        </p>
      ) : offline ? (
        <p className="mb-2 text-[12px] leading-snug text-brand-muted">Saved on this device until the connection returns.</p>
      ) : null}
      {status === "queued" ? (
        <button type="button" onClick={onSync} className="m-press h-12 w-full rounded-full bg-brand-navy text-[15px] font-semibold text-white">
          {offline ? "Try again" : "Sync now"}
        </button>
      ) : (
        <button type="button" onClick={onSubmit} className="m-press h-12 w-full rounded-full bg-brand-navy text-[15px] font-semibold text-white">
          Submit Log
        </button>
      )}
    </div>
  );
}

function Overview({
  body,
  locked,
  onOpen,
}: {
  body: DailyLogBody;
  locked: boolean;
  onOpen: (section: LogSectionId) => void;
}) {
  const rows = LOG_SECTIONS.filter((item) => item.id !== "overview");

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Overview</p>
      <h2 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-brand-navy">This field log</h2>
      <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
        {locked
          ? "This log is locked. Review each section, then return to the list."
          : "Record the day in sections. One log is kept for this project and date."}
      </p>
      <div className={`mt-5 ${mobileElevatedCard}`}>
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onOpen(row.id)}
            className="m-press flex min-h-[64px] w-full items-center justify-between gap-3 border-b border-brand-line/70 px-4 py-3.5 text-left last:border-b-0 active:bg-brand-soft/80"
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold tracking-[-0.02em] text-brand-navy">{row.label}</span>
              <span className="mt-0.5 block text-[12px] text-brand-muted">{sectionSummary(row.id, body)}</span>
            </span>
            <IconChevronRight className="text-brand-mist" />
          </button>
        ))}
      </div>
    </section>
  );
}

function WeatherSection({
  body,
  canEdit,
  update,
}: {
  body: DailyLogBody;
  canEdit: boolean;
  update: (recipe: (draft: DailyLogBody) => void) => void;
}) {
  const [editing, setEditing] = useState<CrewEntry | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Weather</p>
        <h2 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-brand-navy">Site conditions</h2>
      </div>
      <ChoiceRow
        label="Condition"
        value={body.weather.condition}
        options={WEATHER_CONDITIONS}
        disabled={!canEdit}
        onChange={(condition: WeatherCondition) => update((draft) => { draft.weather.condition = condition; })}
      />
      <div className="grid grid-cols-2 gap-3">
        <FieldText
          id="temp-high"
          label="High °F"
          value={body.weather.high}
          disabled={!canEdit}
          placeholder="68"
          onChange={(high) => update((draft) => { draft.weather.high = high.replace(/[^\d.-]/g, ""); })}
        />
        <FieldText
          id="temp-low"
          label="Low °F"
          value={body.weather.low}
          disabled={!canEdit}
          placeholder="54"
          onChange={(low) => update((draft) => { draft.weather.low = low.replace(/[^\d.-]/g, ""); })}
        />
      </div>
      <FieldText
        id="weather-notes"
        label="Notes"
        value={body.weather.notes}
        disabled={!canEdit}
        placeholder="Wind, precipitation, deck conditions"
        onChange={(notes) => update((draft) => { draft.weather.notes = notes; })}
      />

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Workforce</p>
        <h2 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-brand-navy">Crews on site</h2>
        <p className="mt-1 text-[13px] text-brand-muted">
          {body.crews.length === 0 ? "Headcount and hours for each crew." : workforceSummary(body)}
        </p>
        <div className="mt-3">
          <RecordList>
            {canEdit && !adding && !editing ? <AddLine label="Add crew" onClick={() => setAdding(true)} /> : null}
            {body.crews.length === 0 && !adding ? (
              <EmptyRecord title="No crews yet" detail="Add the crews on site today." />
            ) : null}
            {body.crews.map((crew) => (
              <RecordRow
                key={crew.id}
                title={crew.name}
                meta={`${crew.workers} workers · ${crew.hours} hrs`}
                locked={!canEdit}
                onEdit={() => { setAdding(false); setEditing(crew); }}
                onRemove={() => update((draft) => { draft.crews = draft.crews.filter((item) => item.id !== crew.id); })}
              />
            ))}
            {editing ? (
              <CrewEditor
                initial={editing}
                onCancel={() => setEditing(null)}
                onSave={(crew) => {
                  update((draft) => {
                    draft.crews = draft.crews.map((item) => (item.id === crew.id ? crew : item));
                  });
                  setEditing(null);
                }}
              />
            ) : null}
            {adding ? (
              <CrewEditor
                onCancel={() => setAdding(false)}
                onSave={(crew) => {
                  update((draft) => { draft.crews = [...draft.crews, crew]; });
                  setAdding(false);
                }}
              />
            ) : null}
          </RecordList>
        </div>
      </div>
    </section>
  );
}

function CrewEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: CrewEntry;
  onSave: (crew: CrewEntry) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [workers, setWorkers] = useState(initial ? String(initial.workers) : "");
  const [hours, setHours] = useState(initial ? String(initial.hours) : "");
  const ready = name.trim() && workers.trim() && hours.trim();

  return (
    <EntryPanel>
      <FieldText id="crew-name" label="Crew" value={name} onChange={setName} placeholder="Concrete" />
      <div className="grid grid-cols-2 gap-3">
        <FieldText id="crew-workers" label="Workers" value={workers} onChange={(value) => setWorkers(value.replace(/\D/g, ""))} placeholder="12" />
        <FieldText id="crew-hours" label="Hours" value={hours} onChange={(value) => setHours(value.replace(/[^\d.]/g, ""))} placeholder="8" />
      </div>
      <PanelActions
        onCancel={onCancel}
        saveLabel={initial ? "Save crew" : "Add crew"}
        onSave={() => {
          if (!ready) return;
          onSave({
            id: initial?.id ?? nextEntryId("crew"),
            name: name.trim(),
            workers: Number(workers),
            hours: Number(hours),
          });
        }}
      />
    </EntryPanel>
  );
}

function WorkSection({
  body,
  canEdit,
  update,
  logId,
  projectId,
  projectName,
}: {
  body: DailyLogBody;
  canEdit: boolean;
  update: (recipe: (draft: DailyLogBody) => void) => void;
  logId: string;
  projectId: string;
  projectName: string;
}) {
  const [editing, setEditing] = useState<WorkEntry | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Work performed</p>
      <h2 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-brand-navy">What moved today</h2>
      <p className="mt-1 text-[13px] text-brand-muted">
        {body.work.length === 0 ? "Activities completed on site." : countSummary(body.work.length, "activity", "activities")}
      </p>
      <div className="mt-4">
        <RecordList>
          {canEdit && !adding && !editing ? <AddLine label="Add work activity" onClick={() => setAdding(true)} /> : null}
          {body.work.length === 0 && !adding ? (
            <EmptyRecord title="No work activities yet" detail="Add the work completed today." />
          ) : null}
          {body.work.map((entry) => {
            const photoContext: PhotoParentContext = {
              projectId,
              projectName,
              recordLabel: "Daily Log",
              sectionLabel: "Work Performed",
              dailyLogId: logId,
              workEntryId: entry.id,
            };
            return (
              <div key={entry.id}>
                <RecordRow
                  title={entry.activity}
                  meta={entry.location}
                  detail={entry.description}
                  photos={entry.photos}
                  hideInlineThumbnails={!canEdit && entry.photos.length > 0}
                  locked={!canEdit}
                  onEdit={() => { setAdding(false); setEditing(entry); }}
                  onRemove={() => update((draft) => { draft.work = draft.work.filter((item) => item.id !== entry.id); })}
                />
                {!canEdit && entry.photos.length > 0 ? (
                  <div className="border-b border-brand-line/70 px-3.5 pb-3.5">
                    <PhotoAttachments
                      mode="evidence"
                      photos={normalizeWorkPhotos(entry.photos, photoContext)}
                      locked
                      parentContext={photoContext}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
          {editing ? (
            <WorkEditor
              initial={editing}
              logId={logId}
              projectId={projectId}
              projectName={projectName}
              onCancel={() => setEditing(null)}
              onSave={(entry) => {
                update((draft) => { draft.work = draft.work.map((item) => (item.id === entry.id ? entry : item)); });
                setEditing(null);
              }}
            />
          ) : null}
          {adding ? (
            <WorkEditor
              logId={logId}
              projectId={projectId}
              projectName={projectName}
              onCancel={() => setAdding(false)}
              onSave={(entry) => {
                update((draft) => { draft.work = [...draft.work, entry]; });
                setAdding(false);
              }}
            />
          ) : null}
        </RecordList>
      </div>
    </section>
  );
}

function WorkEditor({
  initial,
  logId,
  projectId,
  projectName,
  onSave,
  onCancel,
}: {
  initial?: WorkEntry;
  logId: string;
  projectId: string;
  projectName: string;
  onSave: (entry: WorkEntry) => void;
  onCancel: () => void;
}) {
  const [activity, setActivity] = useState(initial?.activity ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [photos, setPhotos] = useState<FieldPhoto[]>(() => normalizeWorkPhotos(initial?.photos ?? []));
  const [workEntryId] = useState(() => initial?.id ?? nextEntryId("work"));

  return (
    <EntryPanel>
      <FieldText id="work-activity" label="Activity" value={activity} onChange={setActivity} placeholder="Concrete placement" />
      <FieldText id="work-location" label="Location" value={location} onChange={setLocation} placeholder="Level 2 · East Wing" />
      <FieldText id="work-notes" label="Description" value={description} onChange={setDescription} multiline placeholder="What was completed or left in progress" />
      <PhotoAttachments
        mode="evidence"
        photos={photos}
        onChange={setPhotos}
        parentContext={{
          projectId,
          projectName,
          recordLabel: "Daily Log",
          sectionLabel: "Work Performed",
          dailyLogId: logId,
          workEntryId,
        }}
        addLabel="Add site photo"
        hint="Show progress or field conditions"
      />
      <PanelActions
        onCancel={onCancel}
        saveLabel={initial ? "Save work" : "Add work"}
        onSave={() => {
          if (!activity.trim()) return;
          onSave({
            id: workEntryId,
            activity: activity.trim(),
            location: location.trim(),
            description: description.trim(),
            photos,
          });
        }}
      />
    </EntryPanel>
  );
}

function MaterialsSection({
  body,
  canEdit,
  update,
}: {
  body: DailyLogBody;
  canEdit: boolean;
  update: (recipe: (draft: DailyLogBody) => void) => void;
}) {
  return (
    <div className="space-y-8">
      <DeliveryBlock body={body} canEdit={canEdit} update={update} />
      <EquipmentBlock body={body} canEdit={canEdit} update={update} />
    </div>
  );
}

function DeliveryBlock({
  body,
  canEdit,
  update,
}: {
  body: DailyLogBody;
  canEdit: boolean;
  update: (recipe: (draft: DailyLogBody) => void) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DeliveryEntry | null>(null);
  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Deliveries</p>
      <h2 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-brand-navy">Materials received</h2>
      <div className="mt-4">
        <RecordList>
          {canEdit && !adding && !editing ? <AddLine label="Add delivery" onClick={() => setAdding(true)} /> : null}
          {body.deliveries.length === 0 && !adding ? (
            <EmptyRecord title="No deliveries yet" detail="Record materials received today." />
          ) : null}
          {body.deliveries.map((entry) => (
            <RecordRow
              key={entry.id}
              title={entry.material}
              meta={[entry.supplier, entry.quantity, entry.receivedLabel].filter(Boolean).join(" · ")}
              detail={entry.notes}
              locked={!canEdit}
              onEdit={() => { setAdding(false); setEditing(entry); }}
              onRemove={() => update((draft) => { draft.deliveries = draft.deliveries.filter((item) => item.id !== entry.id); })}
            />
          ))}
          {editing ? (
            <DeliveryEditor
              initial={editing}
              onCancel={() => setEditing(null)}
              onSave={(entry) => {
                update((draft) => { draft.deliveries = draft.deliveries.map((item) => (item.id === entry.id ? entry : item)); });
                setEditing(null);
              }}
            />
          ) : null}
          {adding ? (
            <DeliveryEditor
              onCancel={() => setAdding(false)}
              onSave={(entry) => {
                update((draft) => { draft.deliveries = [...draft.deliveries, entry]; });
                setAdding(false);
              }}
            />
          ) : null}
        </RecordList>
      </div>
    </section>
  );
}

function DeliveryEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: DeliveryEntry;
  onSave: (entry: DeliveryEntry) => void;
  onCancel: () => void;
}) {
  const [material, setMaterial] = useState(initial?.material ?? "");
  const [supplier, setSupplier] = useState(initial?.supplier ?? "");
  const [quantity, setQuantity] = useState(initial?.quantity ?? "");
  const [receivedLabel, setReceivedLabel] = useState(initial?.receivedLabel ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  return (
    <EntryPanel>
      <FieldText id="del-material" label="Material" value={material} onChange={setMaterial} placeholder="Concrete mix" />
      <FieldText id="del-supplier" label="Supplier" value={supplier} onChange={setSupplier} placeholder="ABC Materials" />
      <div className="grid grid-cols-2 gap-3">
        <FieldText id="del-qty" label="Quantity" value={quantity} onChange={setQuantity} placeholder="48 cy" />
        <FieldText id="del-when" label="Received" value={receivedLabel} onChange={setReceivedLabel} placeholder="7:40 AM" />
      </div>
      <FieldText id="del-notes" label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />
      <PanelActions
        onCancel={onCancel}
        saveLabel={initial ? "Save delivery" : "Add delivery"}
        onSave={() => {
          if (!material.trim()) return;
          onSave({
            id: initial?.id ?? nextEntryId("del"),
            material: material.trim(),
            supplier: supplier.trim(),
            quantity: quantity.trim(),
            receivedLabel: receivedLabel.trim(),
            notes: notes.trim(),
          });
        }}
      />
    </EntryPanel>
  );
}

function EquipmentBlock({
  body,
  canEdit,
  update,
}: {
  body: DailyLogBody;
  canEdit: boolean;
  update: (recipe: (draft: DailyLogBody) => void) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<EquipmentEntry | null>(null);
  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Equipment</p>
      <h2 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-brand-navy">Equipment on site</h2>
      <div className="mt-4">
        <RecordList>
          {canEdit && !adding && !editing ? <AddLine label="Add equipment" onClick={() => setAdding(true)} /> : null}
          {body.equipment.length === 0 && !adding ? (
            <EmptyRecord title="No equipment yet" detail="Record equipment used today." />
          ) : null}
          {body.equipment.map((entry) => (
            <RecordRow
              key={entry.id}
              title={entry.name}
              meta={[entry.usage, entry.hours ? `${entry.hours} hrs` : ""].filter(Boolean).join(" · ")}
              detail={entry.notes}
              locked={!canEdit}
              onEdit={() => { setAdding(false); setEditing(entry); }}
              onRemove={() => update((draft) => { draft.equipment = draft.equipment.filter((item) => item.id !== entry.id); })}
            />
          ))}
          {editing ? (
            <EquipmentEditor
              initial={editing}
              onCancel={() => setEditing(null)}
              onSave={(entry) => {
                update((draft) => { draft.equipment = draft.equipment.map((item) => (item.id === entry.id ? entry : item)); });
                setEditing(null);
              }}
            />
          ) : null}
          {adding ? (
            <EquipmentEditor
              onCancel={() => setAdding(false)}
              onSave={(entry) => {
                update((draft) => { draft.equipment = [...draft.equipment, entry]; });
                setAdding(false);
              }}
            />
          ) : null}
        </RecordList>
      </div>
    </section>
  );
}

function EquipmentEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: EquipmentEntry;
  onSave: (entry: EquipmentEntry) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [usage, setUsage] = useState(initial?.usage ?? "");
  const [hours, setHours] = useState(initial?.hours ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  return (
    <EntryPanel>
      <FieldText id="eq-name" label="Equipment" value={name} onChange={setName} placeholder="Tower crane" />
      <div className="grid grid-cols-2 gap-3">
        <FieldText id="eq-usage" label="Usage" value={usage} onChange={setUsage} placeholder="Used today" />
        <FieldText id="eq-hours" label="Hours" value={hours} onChange={setHours} placeholder="6" />
      </div>
      <FieldText id="eq-notes" label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />
      <PanelActions
        onCancel={onCancel}
        saveLabel={initial ? "Save equipment" : "Add equipment"}
        onSave={() => {
          if (!name.trim()) return;
          onSave({
            id: initial?.id ?? nextEntryId("eq"),
            name: name.trim(),
            usage: usage.trim(),
            hours: hours.trim(),
            notes: notes.trim(),
          });
        }}
      />
    </EntryPanel>
  );
}

function IssuesSection({
  body,
  canEdit,
  update,
}: {
  body: DailyLogBody;
  canEdit: boolean;
  update: (recipe: (draft: DailyLogBody) => void) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<IssueEntry | null>(null);
  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Issues & delays</p>
      <h2 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-brand-navy">What held the day</h2>
      <p className="mt-1 text-[13px] text-brand-muted">Record delays against this daily log.</p>
      <div className="mt-4">
        <RecordList>
          {canEdit && !adding && !editing ? <AddLine label="Add issue" onClick={() => setAdding(true)} /> : null}
          {body.issues.length === 0 && !adding ? (
            <EmptyRecord title="No issues or delays" detail="Add a delay only if it affected today's work." />
          ) : null}
          {body.issues.map((entry) => (
            <RecordRow
              key={entry.id}
              title={`${entry.type} delay`}
              impact={{
                label: `${entry.impact[0]?.toUpperCase()}${entry.impact.slice(1)} impact`,
                tone: entry.impact,
              }}
              meta={entry.timeLabel || undefined}
              detail={[entry.notes, entry.context].filter(Boolean).join(" · ")}
              photos={entry.photos}
              locked={!canEdit}
              onEdit={() => { setAdding(false); setEditing(entry); }}
              onRemove={() => update((draft) => { draft.issues = draft.issues.filter((item) => item.id !== entry.id); })}
            />
          ))}
          {editing ? (
            <IssueEditor
              initial={editing}
              onCancel={() => setEditing(null)}
              onSave={(entry) => {
                update((draft) => { draft.issues = draft.issues.map((item) => (item.id === entry.id ? entry : item)); });
                setEditing(null);
              }}
            />
          ) : null}
          {adding ? (
            <IssueEditor
              onCancel={() => setAdding(false)}
              onSave={(entry) => {
                update((draft) => { draft.issues = [...draft.issues, entry]; });
                setAdding(false);
              }}
            />
          ) : null}
        </RecordList>
      </div>
    </section>
  );
}

function IssueEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: IssueEntry;
  onSave: (entry: IssueEntry) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState(initial?.type ?? "Weather");
  const [impact, setImpact] = useState<IssueImpact>(initial?.impact ?? "medium");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [context, setContext] = useState(initial?.context ?? "");
  const [timeLabel, setTimeLabel] = useState(initial?.timeLabel ?? "");
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  return (
    <EntryPanel>
      <ChoiceRow
        label="Type"
        value={type}
        options={ISSUE_TYPES.map((item) => ({ id: item, label: item }))}
        onChange={setType}
      />
      <ChoiceRow
        label="Impact"
        value={impact}
        options={[
          { id: "low", label: "Low" },
          { id: "medium", label: "Medium" },
          { id: "high", label: "High" },
        ]}
        onChange={setImpact}
      />
      <FieldText id="issue-notes" label="What happened" value={notes} onChange={setNotes} multiline placeholder="Rain stopped exterior work." />
      <div className="grid grid-cols-2 gap-3">
        <FieldText id="issue-context" label="Where" value={context} onChange={setContext} placeholder="East elevation" />
        <FieldText id="issue-time" label="Time" value={timeLabel} onChange={setTimeLabel} placeholder="2:30 PM" />
      </div>
      <PhotoAttachments
        photos={photos}
        onChange={setPhotos}
        addLabel="Add site photo"
        hint="Show the delay or site condition"
      />
      <PanelActions
        onCancel={onCancel}
        saveLabel={initial ? "Save issue" : "Add issue"}
        onSave={() => {
          if (!notes.trim() && !type) return;
          onSave({
            id: initial?.id ?? nextEntryId("iss"),
            type,
            impact,
            notes: notes.trim(),
            context: context.trim(),
            timeLabel: timeLabel.trim(),
            photos,
          });
        }}
      />
    </EntryPanel>
  );
}

function tally(count: number, singular: string, plural: string, empty: string): string {
  if (count === 0) return empty;
  return countSummary(count, singular, plural);
}

function ReviewSection({
  body,
  canEdit,
  status,
  onEdit,
}: {
  body: DailyLogBody;
  canEdit: boolean;
  status: DailyLogStatus;
  onEdit: (section: LogSectionId) => void;
}) {
  const rows: { id: LogSectionId; label: string; value: string; open: boolean }[] = [
    { id: "weather", label: "Weather", value: weatherSummary(body), open: !body.weather.condition },
    { id: "weather", label: "Workforce", value: workforceSummary(body), open: body.crews.length === 0 },
    {
      id: "work",
      label: "Work performed",
      value: countSummary(body.work.length, "activity", "activities"),
      open: body.work.length === 0,
    },
    {
      id: "materials",
      label: "Deliveries",
      value: tally(body.deliveries.length, "received", "received", "None"),
      open: false,
    },
    {
      id: "materials",
      label: "Equipment",
      value: tally(body.equipment.length, "active", "active", "None"),
      open: false,
    },
    {
      id: "issues",
      label: "Issues & delays",
      value: tally(body.issues.length, "issue", "issues", "None"),
      open: false,
    },
  ];
  const openCount = rows.filter((row) => row.open).length;
  const locked = status === "submitted" || status === "synced";

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-blue">Review</p>
      <h2 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-brand-navy">Field report</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">
        {locked
          ? status === "synced"
            ? "This log is synced and can no longer be edited."
            : "This log is submitted and can no longer be edited."
          : canEdit
            ? openCount === 0
              ? "Ready to submit. You can still open a section to revise it."
              : openCount === 1
                ? "1 section is still open. You can submit when the day is complete."
                : `${openCount} sections are still open. You can submit when the day is complete.`
            : "You can review this log. Submitting isn't available for your role."}
      </p>
      <div className={`mt-4 ${mobileElevatedCard}`}>
        {rows.map((row) => (
          <button
            key={row.label}
            type="button"
            onClick={() => onEdit(row.id)}
            className="m-press flex min-h-[64px] w-full items-center justify-between gap-3 border-b border-brand-line/70 px-4 py-3 text-left last:border-b-0 active:bg-brand-soft/80"
          >
            <span className="min-w-0">
              <span className="block text-[12px] font-medium text-brand-muted">{row.label}</span>
              <span className={`mt-0.5 block truncate text-[15px] font-semibold tracking-[-0.02em] ${row.open ? "text-brand-mist" : "text-brand-navy"}`}>
                {row.value}
              </span>
            </span>
            <IconChevronRight className="text-brand-mist" />
          </button>
        ))}
      </div>
    </section>
  );
}
