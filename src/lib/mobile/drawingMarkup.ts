/** Non-destructive drawing markup — persisted per sheet + revision (overlay JSON). */

export type MarkupAnnotationType = "pen" | "line" | "arrow" | "rect" | "circle" | "text";

export type MarkupPoint = { x: number; y: number };

export type DrawingMarkupAnnotation = {
  id: string;
  type: MarkupAnnotationType;
  strokeWidth: number;
  /** Normalized sheet coordinates (viewBox 0 0 800 × 1100). */
  points?: MarkupPoint[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  r?: number;
  text?: string;
  fontSize?: number;
};

export type DrawingMarkupSyncStatus = "synced" | "local_only";

export type DrawingMarkupPage = {
  drawingId: string;
  revision: number;
  projectId: string;
  sheetNumber: string;
  annotations: DrawingMarkupAnnotation[];
  updatedAt: string;
  syncStatus: DrawingMarkupSyncStatus;
};

const STORAGE_KEY = "vertex-mobile-drawing-markup-v1";

let cache: Record<string, DrawingMarkupPage> | null = null;
const listeners = new Set<() => void>();
let storeVersion = 0;

function emit() {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
}

export function markupPageKey(drawingId: string, revision: number): string {
  return `${drawingId}::rev${revision}`;
}

function readStore(): Record<string, DrawingMarkupPage> {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = {};
    return cache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, DrawingMarkupPage>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function writeStore(next: Record<string, DrawingMarkupPage>) {
  cache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  emit();
}

export function subscribeDrawingMarkup(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDrawingMarkupStoreVersion(): number {
  return storeVersion;
}

export function getDrawingMarkupPage(drawingId: string, revision: number): DrawingMarkupPage | null {
  const key = markupPageKey(drawingId, revision);
  return readStore()[key] ?? null;
}

export function cloneAnnotations(annotations: DrawingMarkupAnnotation[]): DrawingMarkupAnnotation[] {
  return JSON.parse(JSON.stringify(annotations)) as DrawingMarkupAnnotation[];
}

export function newAnnotationId(): string {
  return `mk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SAVE_DELAY_MS = 280;

export function saveDrawingMarkupPage(input: {
  drawingId: string;
  revision: number;
  projectId: string;
  sheetNumber: string;
  annotations: DrawingMarkupAnnotation[];
  online: boolean;
}): Promise<{ ok: true; syncStatus: DrawingMarkupSyncStatus } | { ok: false }> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      try {
        const key = markupPageKey(input.drawingId, input.revision);
        const syncStatus: DrawingMarkupSyncStatus = input.online ? "synced" : "local_only";
        const page: DrawingMarkupPage = {
          drawingId: input.drawingId,
          revision: input.revision,
          projectId: input.projectId,
          sheetNumber: input.sheetNumber,
          annotations: cloneAnnotations(input.annotations),
          updatedAt: new Date().toISOString(),
          syncStatus,
        };
        const store = { ...readStore(), [key]: page };
        writeStore(store);
        resolve({ ok: true, syncStatus });
      } catch {
        resolve({ ok: false });
      }
    }, SAVE_DELAY_MS);
  });
}

/** Demo: first save for A-102 fails once when online. */
const failOnceKeys = new Set<string>();

export function markMarkupSaveFailOnceForDemo(drawingId: string, revision: number) {
  failOnceKeys.add(markupPageKey(drawingId, revision));
}

export function saveDrawingMarkupPageWithDemo(input: Parameters<typeof saveDrawingMarkupPage>[0]) {
  const key = markupPageKey(input.drawingId, input.revision);
  if (input.online && failOnceKeys.has(key)) {
    failOnceKeys.delete(key);
    return new Promise<{ ok: false } | { ok: true; syncStatus: DrawingMarkupSyncStatus }>((resolve) => {
      window.setTimeout(() => resolve({ ok: false }), SAVE_DELAY_MS);
    });
  }
  return saveDrawingMarkupPage(input);
}

markMarkupSaveFailOnceForDemo("draw-a102", 3);
