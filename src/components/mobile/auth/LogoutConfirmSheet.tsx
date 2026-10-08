"use client";

type LogoutConfirmSheetProps = {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LogoutConfirmSheet({
  open,
  loading,
  onCancel,
  onConfirm,
}: LogoutConfirmSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-brand-ink/30 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-6 sm:items-center">
      <div
        className="w-full max-w-[390px] rounded-mobile-lg border border-brand-line/80 bg-white p-5 shadow-float"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
      >
        <h2 id="logout-confirm-title" className="text-[18px] font-bold text-brand-navy">
          Log out of VertexBuild?
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">
          You will need to sign in again to access your projects on this device.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="m-press w-full rounded-mobile bg-[#E35D4A] py-3 text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Signing out…" : "Log out"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="m-press w-full rounded-mobile border border-brand-line py-3 text-[15px] font-semibold text-brand-navy"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
