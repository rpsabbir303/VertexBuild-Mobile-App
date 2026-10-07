"use client";

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  cloneAnnotations,
  newAnnotationId,
  type DrawingMarkupAnnotation,
} from "@/lib/mobile/drawingMarkup";
import {
  MARKUP_FILL_TEXT,
  MARKUP_STROKE,
  MARKUP_STROKE_SELECTED,
  SHEET_VIEW_HEIGHT,
  SHEET_VIEW_WIDTH,
  annotationBounds,
  clientToSheet,
  hitTestAnnotation,
  moveAnnotation,
  pointsToPath,
} from "./markupGeometry";

export type MarkupTool = "select" | "pen" | "line" | "arrow" | "rect" | "circle" | "text";

type Props = {
  annotations: DrawingMarkupAnnotation[];
  selectedId: string | null;
  tool: MarkupTool;
  editable: boolean;
  onAnnotationsChange: (next: DrawingMarkupAnnotation[], commitHistory: boolean) => void;
  onSelect: (id: string | null) => void;
  onRequestText: (point: { x: number; y: number }) => void;
};

type DragState =
  | { kind: "draw-pen"; id: string }
  | { kind: "draw-shape"; id: string; type: "line" | "arrow" | "rect" | "circle" }
  | { kind: "move"; id: string; last: { x: number; y: number } };

export function DrawingMarkupOverlay({
  annotations,
  selectedId,
  tool,
  editable,
  onAnnotationsChange,
  onSelect,
  onRequestText,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const annotationsRef = useRef(annotations);
  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const updateAnnotation = useCallback(
    (id: string, patch: Partial<DrawingMarkupAnnotation>, commitHistory: boolean) => {
      const next = annotations.map((item) => (item.id === id ? { ...item, ...patch } : item));
      onAnnotationsChange(next, commitHistory);
    },
    [annotations, onAnnotationsChange],
  );

  function replaceAnnotations(next: DrawingMarkupAnnotation[], commitHistory: boolean) {
    onAnnotationsChange(next, commitHistory);
  }

  function pointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (!editable || !svgRef.current) return;
    event.preventDefault();
    (event.target as Element).setPointerCapture?.(event.pointerId);
    const pt = clientToSheet(svgRef.current, event.clientX, event.clientY);

    if (tool === "text") {
      onRequestText(pt);
      return;
    }

    if (tool === "select") {
      const hit = [...annotations].reverse().find((item) => hitTestAnnotation(item, pt));
      if (hit) {
        onSelect(hit.id);
        dragRef.current = { kind: "move", id: hit.id, last: pt };
      } else {
        onSelect(null);
      }
      return;
    }

    if (tool === "pen") {
      const id = newAnnotationId();
      const strokeWidth = 3;
      replaceAnnotations(
        [...annotations, { id, type: "pen", strokeWidth, points: [pt] }],
        false,
      );
      dragRef.current = { kind: "draw-pen", id };
      onSelect(id);
      return;
    }

    const id = newAnnotationId();
    const strokeWidth = 2.5;
    if (tool === "line" || tool === "arrow") {
      replaceAnnotations(
        [
          ...annotations,
          { id, type: tool, strokeWidth, x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y },
        ],
        false,
      );
      dragRef.current = { kind: "draw-shape", id, type: tool };
      onSelect(id);
      return;
    }
    if (tool === "rect") {
      replaceAnnotations(
        [...annotations, { id, type: "rect", strokeWidth, x: pt.x, y: pt.y, width: 0, height: 0 }],
        false,
      );
      dragRef.current = { kind: "draw-shape", id, type: "rect" };
      onSelect(id);
      return;
    }
    if (tool === "circle") {
      replaceAnnotations(
        [...annotations, { id, type: "circle", strokeWidth, cx: pt.x, cy: pt.y, r: 0 }],
        false,
      );
      dragRef.current = { kind: "draw-shape", id, type: "circle" };
      onSelect(id);
    }
  }

  function pointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!editable || !svgRef.current || !dragRef.current) return;
    event.preventDefault();
    const pt = clientToSheet(svgRef.current, event.clientX, event.clientY);
    const drag = dragRef.current;

    if (drag.kind === "draw-pen") {
      const current = annotations.find((a) => a.id === drag.id);
      if (!current?.points) return;
      updateAnnotation(drag.id, { points: [...current.points, pt] }, false);
      return;
    }

    if (drag.kind === "draw-shape") {
      const current = annotations.find((a) => a.id === drag.id);
      if (!current) return;
      if (drag.type === "line" || drag.type === "arrow") {
        updateAnnotation(drag.id, { x2: pt.x, y2: pt.y }, false);
      } else if (drag.type === "rect") {
        const x0 = current.x ?? pt.x;
        const y0 = current.y ?? pt.y;
        updateAnnotation(
          drag.id,
          { x: Math.min(x0, pt.x), y: Math.min(y0, pt.y), width: Math.abs(pt.x - x0), height: Math.abs(pt.y - y0) },
          false,
        );
      } else if (drag.type === "circle") {
        const cx = current.cx ?? pt.x;
        const cy = current.cy ?? pt.y;
        updateAnnotation(drag.id, { r: Math.hypot(pt.x - cx, pt.y - cy) }, false);
      }
      return;
    }

    if (drag.kind === "move") {
      const dx = pt.x - drag.last.x;
      const dy = pt.y - drag.last.y;
      if (dx === 0 && dy === 0) return;
      const current = annotations.find((a) => a.id === drag.id);
      if (!current) return;
      const moved = moveAnnotation(current, dx, dy);
      replaceAnnotations(
        annotations.map((a) => (a.id === drag.id ? moved : a)),
        false,
      );
      dragRef.current = { ...drag, last: pt };
    }
  }

  function pointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    if (!editable) return;
    (event.target as Element).releasePointerCapture?.(event.pointerId);
    if (dragRef.current) {
      onAnnotationsChange(cloneAnnotations(annotationsRef.current), true);
    }
    dragRef.current = null;
  }

  const showPointer = editable && tool !== "select";

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SHEET_VIEW_WIDTH} ${SHEET_VIEW_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className={`absolute inset-0 h-full w-full ${editable ? "touch-none" : "pointer-events-none"} ${showPointer ? "cursor-crosshair" : ""}`}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
      aria-hidden={!editable}
    >
      <defs>
        <marker id="markup-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={MARKUP_STROKE} />
        </marker>
        <marker id="markup-arrowhead-selected" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={MARKUP_STROKE_SELECTED} />
        </marker>
      </defs>
      {annotations.map((annotation) => {
        const selected = annotation.id === selectedId;
        const stroke = selected ? MARKUP_STROKE_SELECTED : MARKUP_STROKE;
        const sw = annotation.strokeWidth;
        switch (annotation.type) {
          case "pen":
            return (
              <path
                key={annotation.id}
                d={pointsToPath(annotation.points ?? [])}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          case "line":
            return (
              <line
                key={annotation.id}
                x1={annotation.x1}
                y1={annotation.y1}
                x2={annotation.x2}
                y2={annotation.y2}
                stroke={stroke}
                strokeWidth={sw}
                strokeLinecap="round"
              />
            );
          case "arrow":
            return (
              <line
                key={annotation.id}
                x1={annotation.x1}
                y1={annotation.y1}
                x2={annotation.x2}
                y2={annotation.y2}
                stroke={stroke}
                strokeWidth={sw}
                strokeLinecap="round"
                markerEnd={selected ? "url(#markup-arrowhead-selected)" : "url(#markup-arrowhead)"}
              />
            );
          case "rect":
            return (
              <rect
                key={annotation.id}
                x={annotation.x}
                y={annotation.y}
                width={annotation.width}
                height={annotation.height}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
              />
            );
          case "circle":
            return (
              <circle
                key={annotation.id}
                cx={annotation.cx}
                cy={annotation.cy}
                r={annotation.r}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
              />
            );
          case "text":
            return (
              <text
                key={annotation.id}
                x={annotation.x}
                y={annotation.y}
                fill={selected ? MARKUP_STROKE_SELECTED : MARKUP_FILL_TEXT}
                fontSize={annotation.fontSize ?? 16}
                fontFamily="system-ui, sans-serif"
                fontWeight="600"
              >
                {annotation.text}
              </text>
            );
          default:
            return null;
        }
      })}
      {selectedId && editable
        ? (() => {
            const selected = annotations.find((a) => a.id === selectedId);
            if (!selected) return null;
            const box = annotationBounds(selected);
            return (
              <rect
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                fill="none"
                stroke={MARKUP_STROKE_SELECTED}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                pointerEvents="none"
              />
            );
          })()
        : null}
    </svg>
  );
}
