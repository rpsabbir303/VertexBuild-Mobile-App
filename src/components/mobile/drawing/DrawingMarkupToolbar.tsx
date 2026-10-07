"use client";

import type { MarkupTool } from "./DrawingMarkupOverlay";

const TOOLS: { id: MarkupTool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "pen", label: "Pen" },
  { id: "line", label: "Line" },
  { id: "arrow", label: "Arrow" },
  { id: "rect", label: "Rect" },
  { id: "circle", label: "Circle" },
  { id: "text", label: "Text" },
];

type Props = {
  tool: MarkupTool;
  onToolChange: (tool: MarkupTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  deleteEnabled: boolean;
  onSave: () => void;
  saveState: "idle" | "saving" | "saved" | "failed" | "local";
  onDone: () => void;
  isDirty: boolean;
};

export function DrawingMarkupToolbar({
  tool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDelete,
  deleteEnabled,
  onSave,
  saveState,
  onDone,
  isDirty,
}: Props) {
  return (
    <div className="shrink-0 border-b border-brand-line/50 bg-white/98 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-navy">Markup mode</p>
        <button type="button" onClick={onDone} className="m-press text-[12px] font-semibold text-brand-muted">
          Done
        </button>
      </div>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TOOLS.map((item) => {
          const active = tool === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToolChange(item.id)}
              className={`m-press shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                active
                  ? "border-brand-navy bg-brand-navy text-white"
                  : "border-brand-line/60 bg-white text-brand-navy"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className="m-press rounded-full border border-brand-line/60 px-3 py-1.5 text-[11px] font-semibold text-brand-navy disabled:opacity-40"
        >
          Undo
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          className="m-press rounded-full border border-brand-line/60 px-3 py-1.5 text-[11px] font-semibold text-brand-navy disabled:opacity-40"
        >
          Redo
        </button>
        <button
          type="button"
          disabled={!deleteEnabled}
          onClick={onDelete}
          className="m-press rounded-full border border-brand-line/60 px-3 py-1.5 text-[11px] font-semibold text-[#8A4B3A] disabled:opacity-40"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saveState === "saving" || !isDirty}
          className="m-press ml-auto rounded-full border border-brand-navy bg-brand-navy px-3.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-45"
        >
          {saveState === "saving" ? "Saving…" : "Save markup"}
        </button>
      </div>
      {saveState === "saved" ? (
        <p className="mt-1.5 text-[11px] font-medium text-[#1B6B45]" role="status">
          Markup saved
        </p>
      ) : null}
      {saveState === "local" ? (
        <p className="mt-1.5 text-[11px] font-medium text-brand-navy/80" role="status">
          Saved on this device · Will sync when online
        </p>
      ) : null}
      {saveState === "failed" ? (
        <p className="mt-1.5 text-[11px] font-medium text-[#8A4B3A]" role="status">
          Could not save markup · Try again
        </p>
      ) : null}
    </div>
  );
}
