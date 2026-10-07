"use client";

type Props = {
  open: boolean;
  onContinue: () => void;
  onSave: () => void;
  onDiscard: () => void;
};

export function DrawingMarkupUnsavedSheet({ open, onContinue, onSave, onDiscard }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-brand-navy/40" role="alertdialog" aria-modal="true">
      <button type="button" className="flex-1" aria-label="Dismiss" onClick={onContinue} />
      <div className="rounded-t-[18px] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />
        <h2 className="text-[17px] font-bold text-brand-navy">Unsaved markup</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">
          You have annotations that are not saved yet. Save before leaving, or discard your changes.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onSave}
            className="m-press w-full rounded-full bg-brand-navy py-3 text-[14px] font-semibold text-white"
          >
            Save markup
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="m-press w-full rounded-full border border-brand-line/60 py-3 text-[14px] font-semibold text-brand-navy"
          >
            Continue editing
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="m-press w-full py-2 text-[13px] font-semibold text-[#8A4B3A]"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
