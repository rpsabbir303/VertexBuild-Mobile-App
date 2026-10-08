"use client";

export function MfaRecoveryNotice({ recoveryAvailable }: { recoveryAvailable: boolean }) {
  if (recoveryAvailable) {
    return null;
  }
  return (
    <p className="mt-6 text-center text-[13px] leading-relaxed text-brand-muted">
      Can&apos;t access your authenticator? Contact your administrator for approved account recovery.
    </p>
  );
}
