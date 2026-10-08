"use client";

type Props = {
  tenantName?: string;
  roleLabel?: string;
  projectLabels?: string[];
  inviterName?: string;
  email?: string;
};

export function InviteContextCard({ tenantName, roleLabel, projectLabels, inviterName, email }: Props) {
  const hasMeta = tenantName || roleLabel || projectLabels?.length || inviterName || email;
  if (!hasMeta) return null;

  return (
    <div className="rounded-mobile border border-brand-line/70 bg-white/95 px-4 py-3.5">
      {email ? (
        <p className="text-[13px] text-brand-muted">
          Account <span className="font-semibold text-brand-navy">{email}</span>
        </p>
      ) : null}
      {tenantName ? (
        <p className="mt-2 text-[13px] text-brand-muted">
          Organization <span className="font-semibold text-brand-navy">{tenantName}</span>
        </p>
      ) : null}
      {roleLabel ? (
        <p className="mt-2 text-[13px] text-brand-muted">
          Role <span className="font-semibold text-brand-navy">{roleLabel}</span>
        </p>
      ) : null}
      {projectLabels && projectLabels.length > 0 ? (
        <p className="mt-2 text-[13px] text-brand-muted">
          Project access{" "}
          <span className="block font-semibold text-brand-navy">{projectLabels.join(" · ")}</span>
        </p>
      ) : null}
      {inviterName ? (
        <p className="mt-2 text-[12px] text-brand-mist">Invited by {inviterName}</p>
      ) : null}
    </div>
  );
}
