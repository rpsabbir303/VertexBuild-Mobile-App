import type { DrawingMarkupAnnotation, MarkupPoint } from "@/lib/mobile/drawingMarkup";

export const SHEET_VIEW_WIDTH = 800;
export const SHEET_VIEW_HEIGHT = 1100;

export const MARKUP_STROKE = "#08233F";
export const MARKUP_STROKE_SELECTED = "#2563EB";
export const MARKUP_FILL_TEXT = "#08233F";

export function clientToSheet(svg: SVGSVGElement, clientX: number, clientY: number): MarkupPoint {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const mapped = pt.matrixTransform(matrix.inverse());
  return {
    x: Math.max(0, Math.min(SHEET_VIEW_WIDTH, mapped.x)),
    y: Math.max(0, Math.min(SHEET_VIEW_HEIGHT, mapped.y)),
  };
}

function distToSegment(p: MarkupPoint, a: MarkupPoint, b: MarkupPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.hypot(p.x - proj.x, p.y - proj.y);
}

export function annotationBounds(annotation: DrawingMarkupAnnotation): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const pad = 12;
  switch (annotation.type) {
    case "pen": {
      const pts = annotation.points ?? [];
      if (pts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
    }
    case "line":
    case "arrow":
      return {
        x: Math.min(annotation.x1 ?? 0, annotation.x2 ?? 0) - pad,
        y: Math.min(annotation.y1 ?? 0, annotation.y2 ?? 0) - pad,
        width: Math.abs((annotation.x2 ?? 0) - (annotation.x1 ?? 0)) + pad * 2,
        height: Math.abs((annotation.y2 ?? 0) - (annotation.y1 ?? 0)) + pad * 2,
      };
    case "rect":
      return {
        x: (annotation.x ?? 0) - pad,
        y: (annotation.y ?? 0) - pad,
        width: Math.abs(annotation.width ?? 0) + pad * 2,
        height: Math.abs(annotation.height ?? 0) + pad * 2,
      };
    case "circle":
      return {
        x: (annotation.cx ?? 0) - (annotation.r ?? 0) - pad,
        y: (annotation.cy ?? 0) - (annotation.r ?? 0) - pad,
        width: (annotation.r ?? 0) * 2 + pad * 2,
        height: (annotation.r ?? 0) * 2 + pad * 2,
      };
    case "text": {
      const fs = annotation.fontSize ?? 16;
      const text = annotation.text ?? "";
      const w = Math.max(40, text.length * fs * 0.55);
      return { x: (annotation.x ?? 0) - pad, y: (annotation.y ?? 0) - fs - pad, width: w + pad * 2, height: fs + pad * 2 };
    }
    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

export function hitTestAnnotation(annotation: DrawingMarkupAnnotation, point: MarkupPoint): boolean {
  const threshold = 14;
  switch (annotation.type) {
    case "pen": {
      const pts = annotation.points ?? [];
      for (let i = 1; i < pts.length; i += 1) {
        if (distToSegment(point, pts[i - 1], pts[i]) <= threshold) return true;
      }
      return false;
    }
    case "line":
    case "arrow":
      return distToSegment(point, { x: annotation.x1 ?? 0, y: annotation.y1 ?? 0 }, { x: annotation.x2 ?? 0, y: annotation.y2 ?? 0 }) <= threshold;
    case "rect": {
      const box = annotationBounds(annotation);
      return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
    }
    case "circle": {
      const d = Math.hypot(point.x - (annotation.cx ?? 0), point.y - (annotation.cy ?? 0));
      return Math.abs(d - (annotation.r ?? 0)) <= threshold || d <= (annotation.r ?? 0);
    }
    case "text": {
      const box = annotationBounds(annotation);
      return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
    }
    default:
      return false;
  }
}

export function moveAnnotation(annotation: DrawingMarkupAnnotation, dx: number, dy: number): DrawingMarkupAnnotation {
  switch (annotation.type) {
    case "pen":
      return {
        ...annotation,
        points: (annotation.points ?? []).map((p) => ({ x: p.x + dx, y: p.y + dy })),
      };
    case "line":
    case "arrow":
      return {
        ...annotation,
        x1: (annotation.x1 ?? 0) + dx,
        y1: (annotation.y1 ?? 0) + dy,
        x2: (annotation.x2 ?? 0) + dx,
        y2: (annotation.y2 ?? 0) + dy,
      };
    case "rect":
      return { ...annotation, x: (annotation.x ?? 0) + dx, y: (annotation.y ?? 0) + dy };
    case "circle":
      return { ...annotation, cx: (annotation.cx ?? 0) + dx, cy: (annotation.cy ?? 0) + dy };
    case "text":
      return { ...annotation, x: (annotation.x ?? 0) + dx, y: (annotation.y ?? 0) + dy };
    default:
      return annotation;
  }
}

export function pointsToPath(points: MarkupPoint[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ${rest.map((p) => `L ${p.x} ${p.y}`).join(" ")}`;
}
