"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  cloneAnnotations,
  getDrawingMarkupPage,
  getDrawingMarkupStoreVersion,
  newAnnotationId,
  saveDrawingMarkupPageWithDemo,
  subscribeDrawingMarkup,
  type DrawingMarkupAnnotation,
} from "@/lib/mobile/drawingMarkup";
import type { MarkupTool } from "./DrawingMarkupOverlay";

function annotationsEqual(a: DrawingMarkupAnnotation[], b: DrawingMarkupAnnotation[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useDrawingMarkupSession(input: {
  drawingId: string;
  revision: number;
  projectId: string;
  sheetNumber: string;
  online: boolean;
  enabled: boolean;
}) {
  const storeVersion = useSyncExternalStore(subscribeDrawingMarkup, getDrawingMarkupStoreVersion, () => 0);
  void storeVersion;

  const [loadPhase, setLoadPhase] = useState<"loading" | "ready" | "error">("loading");
  const [saved, setSaved] = useState<DrawingMarkupAnnotation[]>([]);
  const [draft, setDraft] = useState<DrawingMarkupAnnotation[]>([]);
  const [past, setPast] = useState<DrawingMarkupAnnotation[][]>([]);
  const [future, setFuture] = useState<DrawingMarkupAnnotation[][]>([]);
  const [markupMode, setMarkupMode] = useState(false);
  const [tool, setTool] = useState<MarkupTool>("pen");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed" | "local">("idle");
  const [textSheet, setTextSheet] = useState<{ x: number; y: number; editId?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const sheetKey = `${input.drawingId}::${input.revision}`;

  useEffect(() => {
    if (!input.enabled) return;
    setLoadPhase("loading");
    setMarkupMode(false);
    setSelectedId(null);
    setSaveState("idle");
    const timer = window.setTimeout(() => {
      try {
        const page = getDrawingMarkupPage(input.drawingId, input.revision);
        const annotations = cloneAnnotations(page?.annotations ?? []);
        setSaved(annotations);
        setDraft(annotations);
        setPast([]);
        setFuture([]);
        setLoadPhase("ready");
      } catch {
        setLoadPhase("error");
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, [sheetKey, input.enabled, input.drawingId, input.revision]);

  const isDirty = useMemo(() => !annotationsEqual(saved, draft), [saved, draft]);
  const displayAnnotations = markupMode ? draft : saved;
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const applyDraft = useCallback((next: DrawingMarkupAnnotation[], commitHistory: boolean) => {
    setDraft((current) => {
      if (commitHistory) {
        setPast((p) => [...p, current]);
        setFuture([]);
      }
      return next;
    });
    setSaveState("idle");
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setDraft((current) => {
        setFuture((f) => [...f, current]);
        return cloneAnnotations(previous);
      });
      return p.slice(0, -1);
    });
    setSaveState("idle");
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[f.length - 1];
      setDraft((current) => {
        setPast((p) => [...p, current]);
        return cloneAnnotations(next);
      });
      return f.slice(0, -1);
    });
    setSaveState("idle");
  }, []);

  const enterMarkupMode = useCallback(() => {
    setDraft(cloneAnnotations(saved));
    setPast([]);
    setFuture([]);
    setMarkupMode(true);
    setTool("pen");
    setSelectedId(null);
    setSaveState("idle");
  }, [saved]);

  const exitMarkupMode = useCallback(() => {
    setMarkupMode(false);
    setSelectedId(null);
    setTextSheet(null);
    setDeleteConfirm(false);
  }, []);

  const discardDraft = useCallback(() => {
    setDraft(cloneAnnotations(saved));
    setPast([]);
    setFuture([]);
    exitMarkupMode();
  }, [saved, exitMarkupMode]);

  const save = useCallback(async () => {
    setSaveState("saving");
    const result = await saveDrawingMarkupPageWithDemo({
      drawingId: input.drawingId,
      revision: input.revision,
      projectId: input.projectId,
      sheetNumber: input.sheetNumber,
      annotations: draft,
      online: input.online,
    });
    if (!result.ok) {
      setSaveState("failed");
      return false;
    }
    setSaved(cloneAnnotations(draft));
    setSaveState(result.syncStatus === "local_only" ? "local" : "saved");
    window.setTimeout(() => setSaveState("idle"), 2400);
    return true;
  }, [draft, input]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    applyDraft(
      draft.filter((item) => item.id !== selectedId),
      true,
    );
    setSelectedId(null);
    setDeleteConfirm(false);
  }, [applyDraft, draft, selectedId]);

  const placeText = useCallback(
    (text: string) => {
      if (!textSheet) return;
      if (textSheet.editId) {
        applyDraft(
          draft.map((item) => (item.id === textSheet.editId ? { ...item, text } : item)),
          true,
        );
      } else {
        applyDraft(
          [
            ...draft,
            {
              id: newAnnotationId(),
              type: "text",
              strokeWidth: 0,
              x: textSheet.x,
              y: textSheet.y,
              text,
              fontSize: 16,
            },
          ],
          true,
        );
      }
      setTextSheet(null);
    },
    [applyDraft, draft, textSheet],
  );

  return {
    loadPhase,
    markupMode,
    enterMarkupMode,
    exitMarkupMode,
    discardDraft,
    isDirty,
    displayAnnotations,
    draft,
    tool,
    setTool,
    selectedId,
    setSelectedId,
    applyDraft,
    undo,
    redo,
    canUndo,
    canRedo,
    save,
    saveState,
    textSheet,
    setTextSheet,
    placeText,
    deleteSelected,
    deleteConfirm,
    setDeleteConfirm,
  };
}
