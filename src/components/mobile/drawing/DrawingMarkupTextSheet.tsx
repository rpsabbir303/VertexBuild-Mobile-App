"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  initialText?: string;
  onCancel: () => void;
  onSubmit: (text: string) => void;
};

export function DrawingMarkupTextSheet({ open, initialText = "", onCancel, onSubmit }: Props) {
  const [value, setValue] = useState(initialText);

  useEffect(() => {
    if (open) setValue(initialText);
  }, [open, initialText]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex flex-col justify-end bg-brand-navy/35" role="dialog" aria-modal="true">
      <button type="button" className="flex-1" aria-label="Close text entry" onClick={onCancel} />
      <div className="rounded-t-[18px] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />
        <h2 className="text-[15px] font-bold text-brand-navy">Text annotation</h2>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={120}
          placeholder="e.g. Verify wall opening"
          className="mt-3 w-full rounded-[12px] border border-brand-line/60 px-3 py-3 text-[15px] text-brand-navy outline-none focus:border-brand-blue/40"
          autoFocus
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="m-press flex-1 rounded-full border border-brand-line/60 py-2.5 text-[14px] font-semibold text-brand-navy"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!value.trim()}
            onClick={() => onSubmit(value.trim())}
            className="m-press flex-1 rounded-full bg-brand-navy py-2.5 text-[14px] font-semibold text-white disabled:opacity-45"
          >
            Place
          </button>
        </div>
      </div>
    </div>
  );
}
