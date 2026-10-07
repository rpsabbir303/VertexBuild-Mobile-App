"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ConstructionSheetPreview } from "@/components/mobile/drawing/ConstructionSheetPreview";
import { DrawingMarkupOverlay } from "@/components/mobile/drawing/DrawingMarkupOverlay";
import { DrawingMarkupTextSheet } from "@/components/mobile/drawing/DrawingMarkupTextSheet";
import { DrawingMarkupToolbar } from "@/components/mobile/drawing/DrawingMarkupToolbar";
import { DrawingMarkupUnsavedSheet } from "@/components/mobile/drawing/DrawingMarkupUnsavedSheet";
import { useDrawingMarkupSession } from "@/components/mobile/drawing/useDrawingMarkupSession";
import { DrawingOfflineBar } from "@/components/mobile/drawing/DrawingOfflineBar";
import { DrawingOfflineViewerBar } from "@/components/mobile/drawing/DrawingOfflineViewerBar";
import { DrawingViewport } from "@/components/mobile/drawing/DrawingViewport";
import {
  getDrawingOfflineCopy,
  getDrawingOfflineStoreVersion,
  getOfflineDrawingSnapshot,
  isDrawingOfflineAvailable,
  offlineCopyIsStale,
  offlineCopyIsStaleKnown,
  retryDrawingDownload,
  startDrawingDownload,
  subscribeDrawingOffline,
  syncOfflineLatestKnownRevision,
} from "@/lib/mobile/drawingOffline";
import { todayIso } from "@/lib/mobile/dailyLogs";
import {
  currentRevisionLine,
  currentRevisionRecord,
  disciplineLabel,
  formatDrawingUpdated,
  getDrawingById,
  relatedRecordsForDrawing,
  revisionByNumber,
} from "@/lib/mobile/drawings";
import { getProjectById } from "@/lib/mobile/mockData";
import { useMobileApp } from "@/lib/mobile/MobileAppContext";
import { IconBack, IconChevronRight } from "../icons";

type LoadPhase = "loading" | "ready" | "error" | "missing" | "not_offline";

export function DrawingViewerScreen({ drawingId }: { drawingId: string }) {
  const router = useRouter();
  const { accessibleProjects, isOffline } = useMobileApp();
  const offlineStoreVersion = useSyncExternalStore(
    subscribeDrawingOffline,
    getDrawingOfflineStoreVersion,
    () => 0,
  );
  const [today, setToday] = useState<string | null>(null);
  const [phase, setPhase] = useState<LoadPhase>("loading");
  const [retry, setRetry] = useState(0);
  const [viewRevision, setViewRevision] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [connectionNotice, setConnectionNotice] = useState(false);
  const [viewingOfflineCopy, setViewingOfflineCopy] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setToday(todayIso());
  }, [drawingId]);

  useEffect(() => {
    setPhase("loading");
    const offlineSnap = getOfflineDrawingSnapshot(drawingId);
    const delay = isOffline && offlineSnap ? 140 : 420;

    const timer = window.setTimeout(() => {
      if (isOffline) {
        if (offlineSnap) {
          setViewingOfflineCopy(true);
          setViewRevision(offlineSnap.offlineRevision);
          setPhase("ready");
          return;
        }
        setPhase("not_offline");
        return;
      }

      const record = getDrawingById(drawingId, today ?? todayIso());
      if (!record) {
        setPhase("missing");
        return;
      }
      syncOfflineLatestKnownRevision(drawingId, today ?? todayIso());
      setViewingOfflineCopy(false);
      setViewRevision((prev) => {
        const snap = getOfflineDrawingSnapshot(drawingId);
        if (prev !== null && snap && prev === snap.offlineRevision) return prev;
        return record.currentRevision;
      });
      setPhase("ready");
    }, delay);

    return () => window.clearTimeout(timer);
  }, [drawingId, today, retry, isOffline]);

  const drawing = today && phase === "ready" && viewRevision !== null ? getDrawingById(drawingId, today) : undefined;
  const project = drawing ? getProjectById(drawing.projectId) : undefined;
  const allowed = drawing ? accessibleProjects.some((item) => item.id === drawing.projectId) : true;

  const related = useMemo(() => {
    if (!drawing || !today || isOffline) return [];
    return relatedRecordsForDrawing(drawing, today);
  }, [drawing, today, isOffline]);

  void offlineStoreVersion;
  const offlineCopy = getDrawingOfflineCopy(drawingId);
  const offlineSnap = getOfflineDrawingSnapshot(drawingId);
  const offlineStale =
    offlineCopy?.status === "available"
      ? offlineCopyIsStaleKnown(offlineCopy)
      : drawing
        ? offlineCopyIsStale(drawingId, drawing.currentRevision)
        : false;

  const markup = useDrawingMarkupSession({
    drawingId,
    revision: viewRevision ?? 0,
    projectId: drawing?.projectId ?? "",
    sheetNumber: drawing?.sheetNumber ?? "",
    online: !isOffline,
    enabled: phase === "ready" && viewRevision !== null && Boolean(drawing),
  });

  if (!today) {
    return (
      <div className="flex h-[min(100dvh,720px)] flex-col bg-[#E8EDF2]" aria-hidden="true">
        <div className="h-14 animate-pulse bg-brand-line/40" />
        <div className="flex-1 animate-pulse bg-brand-line/25" />
      </div>
    );
  }

  if (phase === "not_offline") {
    return (
      <div className="flex min-h-[50vh] flex-col px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <Link href="/mobile-preview/tools/drawings" className="m-press inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted">
          <IconBack />
          Drawings
        </Link>
        <h1 className="mt-8 text-[20px] font-bold text-brand-navy">Not available offline</h1>
        <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-brand-muted">
          This drawing has not been downloaded for offline use. Connect to the internet to access it.
        </p>
      </div>
    );
  }

  if (phase === "missing" || (drawing && !allowed)) {
    return (
      <div className="px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <Link href="/mobile-preview/tools/drawings" className="m-press inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted">
          <IconBack />
          Drawings
        </Link>
        <h1 className="mt-6 text-[20px] font-bold text-brand-navy">Drawing unavailable</h1>
        <p className="mt-2 text-[14px] text-brand-muted">This sheet isn&apos;t available on this device.</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-[50vh] flex-col px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <Link href="/mobile-preview/tools/drawings" className="m-press inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted">
          <IconBack />
          Drawings
        </Link>
        <h1 className="mt-8 text-[20px] font-bold text-brand-navy">Unable to load drawing</h1>
        <p className="mt-2 text-[14px] text-brand-muted">Try again to open this sheet.</p>
        <button
          type="button"
          onClick={() => setRetry((value) => value + 1)}
          className="m-press mt-5 w-fit rounded-full border border-brand-line/70 bg-white px-4 py-2 text-[13px] font-semibold text-brand-navy"
        >
          Retry
        </button>
      </div>
    );
  }

  if (phase === "loading" || !drawing || !project || viewRevision === null) {
    return (
      <div className="flex h-[min(100dvh,720px)] flex-col bg-[#E8EDF2]" aria-hidden="true">
        <div className="border-b border-brand-line/45 bg-white/90 px-4 py-3">
          <div className="h-3 w-12 animate-pulse rounded bg-brand-line/60" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-brand-line/70" />
        </div>
        <div className="flex-1 animate-pulse bg-[#DDE4EA]" />
      </div>
    );
  }

  const revisionMeta = revisionByNumber(drawing, viewRevision);
  const currentMeta = currentRevisionRecord(drawing);
  const updated = revisionMeta ? formatDrawingUpdated(revisionMeta.updatedIso) : null;
  const sheetId = drawing.id;
  const revision = viewRevision;
  const liveCurrentRevision = drawing.currentRevision;
  const viewingDownloadedCopy =
    offlineCopy?.status === "available" && viewRevision === offlineCopy.revision;
  const showOfflineViewerBar = isOffline
    ? viewingDownloadedCopy
    : viewingDownloadedCopy && (viewingOfflineCopy || offlineStale);

  function requestDownload() {
    if (isOffline) {
      setConnectionNotice(true);
      return;
    }
    setConnectionNotice(false);
    startDrawingDownload({ drawingId: sheetId, revision, online: true });
  }

  function requestRetry() {
    if (isOffline) {
      setConnectionNotice(true);
      return;
    }
    setConnectionNotice(false);
    retryDrawingDownload({ drawingId: sheetId, revision, online: true });
  }

  function viewLatestRevision() {
    guardNavigation(() => {
      setViewingOfflineCopy(false);
      setViewRevision(liveCurrentRevision);
    });
  }

  const selectedAnnotation = markup.draft.find((item) => item.id === markup.selectedId);

  function guardNavigation(action: () => void) {
    if (markup.markupMode && markup.isDirty) {
      setPendingNav(() => action);
      setUnsavedOpen(true);
      return;
    }
    action();
  }

  function requestExitMarkup() {
    if (markup.isDirty) {
      setPendingNav(() => () => markup.exitMarkupMode());
      setUnsavedOpen(true);
      return;
    }
    markup.exitMarkupMode();
  }

  async function saveMarkupFromUnsaved() {
    const ok = await markup.save();
    if (!ok) return;
    setUnsavedOpen(false);
    pendingNav?.();
    setPendingNav(null);
  }

  function discardMarkupFromUnsaved() {
    markup.discardDraft();
    setUnsavedOpen(false);
    pendingNav?.();
    setPendingNav(null);
  }

  function changeRevision(nextRevision: number) {
    guardNavigation(() => {
      setViewRevision(nextRevision);
      setViewingOfflineCopy(false);
      setInfoOpen(false);
    });
  }

  return (
    <div className="relative flex h-[min(100dvh,720px)] min-h-0 flex-col overflow-hidden bg-[#E8EDF2]">
      <header className="shrink-0 border-b border-brand-line/45 bg-white/95 px-3 pb-2.5 pt-[max(8px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => guardNavigation(() => router.push("/mobile-preview/tools/drawings"))}
            className="m-press mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-muted"
            aria-label="Back to drawings"
          >
            <IconBack />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[17px] font-semibold tracking-[0.04em] text-brand-navy">{drawing.sheetNumber}</p>
            <p className="truncate text-[13px] font-medium leading-snug text-brand-navy/85">{drawing.title}</p>
            <p className="mt-1 truncate text-[11px] text-brand-muted">{project.name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {!markup.markupMode ? (
              <button
                type="button"
                onClick={() => markup.enterMarkupMode()}
                disabled={markup.loadPhase !== "ready"}
                className="m-press rounded-full border border-brand-line/60 px-3 py-1.5 text-[12px] font-semibold text-brand-navy disabled:opacity-45"
              >
                Markup
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="m-press rounded-full border border-brand-line/60 px-3 py-1.5 text-[12px] font-semibold text-brand-navy"
            >
              Info
            </button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 pl-12">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy">
            {currentRevisionLine(viewRevision)}
            {showOfflineViewerBar ? " · Offline copy" : ""}
          </span>
          {!isOffline && viewRevision !== drawing.currentRevision && !showOfflineViewerBar ? (
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A6232]">
              Latest · {currentRevisionLine(drawing.currentRevision)}
            </span>
          ) : null}
          {markup.markupMode ? (
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-blue">· Markup mode</span>
          ) : null}
        </div>
      </header>

      {markup.markupMode ? (
        <DrawingMarkupToolbar
          tool={markup.tool}
          onToolChange={markup.setTool}
          canUndo={markup.canUndo}
          canRedo={markup.canRedo}
          onUndo={markup.undo}
          onRedo={markup.redo}
          deleteEnabled={Boolean(markup.selectedId)}
          onDelete={() => setDeleteConfirmOpen(true)}
          onSave={() => void markup.save()}
          saveState={markup.saveState}
          onDone={requestExitMarkup}
          isDirty={markup.isDirty}
        />
      ) : null}

      {markup.markupMode && markup.draft.length === 0 ? (
        <p className="shrink-0 border-b border-brand-line/40 bg-[#FAFCFE] px-4 py-1.5 text-[11px] text-brand-muted">
          No markups yet · Choose a tool to annotate this sheet
        </p>
      ) : null}

      {markup.loadPhase === "error" ? (
        <p className="shrink-0 border-b border-brand-line/40 bg-[#FBF6F1] px-4 py-2 text-[12px] text-[#8A6232]" role="status">
          Markup could not be loaded for this sheet.
        </p>
      ) : null}

      {showOfflineViewerBar && offlineCopy?.status === "available" ? (
        <DrawingOfflineViewerBar
          copy={offlineCopy}
          stale={offlineStale}
          online={!isOffline}
          onViewLatest={!isOffline ? viewLatestRevision : undefined}
        />
      ) : (
        <DrawingOfflineBar
          copy={offlineCopy}
          sheetNumber={drawing.sheetNumber}
          title={drawing.title}
          viewRevision={viewRevision}
          currentRevision={drawing.currentRevision}
          stale={offlineStale}
          online={!isOffline}
          connectionNotice={connectionNotice}
          onDownload={requestDownload}
          onRetry={requestRetry}
          onDismissConnectionNotice={() => setConnectionNotice(false)}
        />
      )}

      <DrawingViewport
        key={`${drawing.id}-${viewRevision}-${viewingOfflineCopy ? "local" : "live"}`}
        navigationEnabled={!markup.markupMode}
      >
        <div className="relative h-full w-full">
          <ConstructionSheetPreview
            sheetNumber={drawing.sheetNumber}
            title={drawing.title}
            discipline={drawing.discipline}
            revision={viewRevision}
            superseded={viewRevision < drawing.currentRevision}
          />
          {markup.loadPhase === "ready" ? (
            <DrawingMarkupOverlay
              annotations={markup.displayAnnotations}
              selectedId={markup.markupMode ? markup.selectedId : null}
              tool={markup.tool}
              editable={markup.markupMode}
              onAnnotationsChange={markup.applyDraft}
              onSelect={markup.setSelectedId}
              onRequestText={(point) => markup.setTextSheet({ x: point.x, y: point.y })}
            />
          ) : null}
          {markup.loadPhase === "loading" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#E8EDF2]/60">
              <p className="text-[12px] font-medium text-brand-muted">Loading markup…</p>
            </div>
          ) : null}
        </div>
      </DrawingViewport>

      {infoOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-brand-navy/35" role="dialog" aria-modal="true">
          <button type="button" className="flex-1" aria-label="Close information" onClick={() => setInfoOpen(false)} />
          <div className="max-h-[min(70vh,520px)] overflow-y-auto rounded-t-[18px] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />
            <h2 className="text-[15px] font-bold text-brand-navy">Sheet information</h2>
            <dl className="mt-4 space-y-3 text-[14px]">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Sheet</dt>
                <dd className="mt-0.5 font-mono font-semibold text-brand-navy">{drawing.sheetNumber}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Title</dt>
                <dd className="mt-0.5 font-medium text-brand-navy">{drawing.title}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Discipline</dt>
                <dd className="mt-0.5 text-brand-navy">{disciplineLabel(drawing.discipline)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Revision</dt>
                <dd className="mt-0.5 text-brand-navy">
                  {currentRevisionLine(viewRevision)}
                  {showOfflineViewerBar ? " · Offline copy" : ""}
                </dd>
              </div>
              {offlineCopy?.status === "available" ? (
                <>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Availability</dt>
                    <dd className="mt-0.5 text-[#1B6B45] font-semibold">Available offline</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Status</dt>
                    <dd className="mt-0.5 text-brand-navy">
                      {offlineStale
                        ? `Older revision · Latest known ${currentRevisionLine(offlineCopy.latestKnownRevision)}`
                        : "Current when downloaded"}
                    </dd>
                  </div>
                </>
              ) : null}
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-mist">Project</dt>
                <dd className="mt-0.5 text-brand-navy">
                  {project.name}
                  <span className="block text-[13px] text-brand-muted">
                    {project.city}, {project.state}
                  </span>
                </dd>
              </div>
            </dl>

            {!isOffline ? (
              <>
                <h3 className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-mist">Revisions</h3>
                <ul className="mt-2 divide-y divide-brand-line/45">
                  {drawing.revisions
                    .slice()
                    .sort((a, b) => b.revision - a.revision)
                    .map((rev) => {
                      const active = rev.revision === viewRevision;
                      const isCurrent = rev.revision === drawing.currentRevision;
                      const offlineOnly = isOffline && rev.revision !== offlineSnap?.offlineRevision;
                      return (
                        <li key={rev.revision}>
                          <button
                            type="button"
                            disabled={offlineOnly}
                            onClick={() => changeRevision(rev.revision)}
                            className={`m-press flex w-full items-center justify-between py-3 text-left disabled:opacity-40 ${active ? "bg-brand-soft/30" : ""}`}
                          >
                            <span>
                              <span className="block text-[14px] font-semibold text-brand-navy">Rev {rev.revision}</span>
                              <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-mist">
                                {isCurrent ? "Latest on project" : "Superseded"}
                              </span>
                              {formatDrawingUpdated(rev.updatedIso) ? (
                                <span className="mt-0.5 block text-[11px] text-brand-muted">{formatDrawingUpdated(rev.updatedIso)}</span>
                              ) : null}
                            </span>
                            {active ? <span className="text-[11px] font-semibold text-brand-navy">Viewing</span> : null}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </>
            ) : null}

            {currentMeta && !showOfflineViewerBar && updated ? (
              <p className="mt-3 text-[12px] text-brand-muted">{updated}</p>
            ) : null}

            {related.length > 0 ? (
              <>
                <h3 className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-mist">Related records</h3>
                <ul className="mt-2 space-y-1">
                  {related.map((item) => (
                    <li key={`${item.kind}-${item.id}`}>
                      <Link
                        href={item.href}
                        className="m-press flex items-center justify-between rounded-[12px] border border-brand-line/50 px-3 py-2.5"
                        onClick={() => setInfoOpen(false)}
                      >
                        <span>
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-mist">{item.kind}</span>
                          <span className="text-[14px] font-semibold text-brand-navy">{item.label}</span>
                        </span>
                        <IconChevronRight className="h-4 w-4 text-brand-mist" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              className="m-press mt-6 w-full rounded-full border border-brand-line/60 py-2.5 text-[14px] font-semibold text-brand-navy"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <DrawingMarkupTextSheet
        open={Boolean(markup.textSheet)}
        initialText={
          markup.textSheet?.editId
            ? markup.draft.find((item) => item.id === markup.textSheet?.editId)?.text ?? ""
            : ""
        }
        onCancel={() => markup.setTextSheet(null)}
        onSubmit={markup.placeText}
      />

      <DrawingMarkupUnsavedSheet
        open={unsavedOpen}
        onContinue={() => {
          setUnsavedOpen(false);
          setPendingNav(null);
        }}
        onSave={() => void saveMarkupFromUnsaved()}
        onDiscard={discardMarkupFromUnsaved}
      />

      {deleteConfirmOpen ? (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-brand-navy/40" role="alertdialog" aria-modal="true">
          <button type="button" className="flex-1" aria-label="Cancel delete" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="rounded-t-[18px] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />
            <h2 className="text-[17px] font-bold text-brand-navy">Delete annotation?</h2>
            <p className="mt-2 text-[14px] text-brand-muted">This removes the selected markup from this sheet. The drawing file is not changed.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  markup.deleteSelected();
                  setDeleteConfirmOpen(false);
                }}
                className="m-press w-full rounded-full bg-[#8A4B3A] py-3 text-[14px] font-semibold text-white"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="m-press w-full rounded-full border border-brand-line/60 py-3 text-[14px] font-semibold text-brand-navy"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {markup.markupMode && selectedAnnotation?.type === "text" ? (
        <div className="pointer-events-none absolute bottom-24 left-3 z-10">
          <button
            type="button"
            onClick={() =>
              markup.setTextSheet({
                x: selectedAnnotation.x ?? 0,
                y: selectedAnnotation.y ?? 0,
                editId: selectedAnnotation.id,
              })
            }
            className="pointer-events-auto m-press rounded-full border border-brand-line/60 bg-white/95 px-3 py-2 text-[12px] font-semibold text-brand-navy shadow-[0_2px_12px_rgba(8,35,63,0.08)]"
          >
            Edit text
          </button>
        </div>
      ) : null}
    </div>
  );
}
