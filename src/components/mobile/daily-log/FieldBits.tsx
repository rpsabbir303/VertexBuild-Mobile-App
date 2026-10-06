import type { ReactNode } from "react";
import { photoThumbSrc, type FieldPhoto } from "@/lib/mobile/photoEvidence";
import { fieldInput, fieldLabel, recordGroup } from "@/lib/mobile/mobileUi";
import { IconPlus, IconTrash } from "../icons";

export function FieldText({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  multiline,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className={fieldLabel}>{label}</span>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          disabled={disabled}
          rows={3}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldInput} scroll-mb-32 resize-none text-base leading-relaxed`}
        />
      ) : (
        <input
          id={id}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldInput} scroll-mb-32 text-base`}
        />
      )}
    </label>
  );
}

export function ChoiceRow<T extends string>({
  value,
  options,
  onChange,
  disabled,
  label,
}: {
  value: T | null;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div>
      <p className={fieldLabel}>{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className={`m-press h-11 rounded-full px-3.5 text-[13px] font-semibold disabled:opacity-60 ${
                selected
                  ? "bg-brand-navy text-white"
                  : "border border-brand-line bg-white text-brand-navy"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RecordList({ children }: { children: ReactNode }) {
  return <div className={recordGroup}>{children}</div>;
}

const IMPACT_TONE = {
  low: "text-brand-muted",
  medium: "text-[#8A6232]",
  high: "text-[#8A4B3A]",
} as const;

export function RecordRow({
  title,
  meta,
  detail,
  impact,
  photos,
  hideInlineThumbnails,
  onEdit,
  onRemove,
  locked,
}: {
  title: string;
  meta?: string;
  detail?: string;
  impact?: { label: string; tone: keyof typeof IMPACT_TONE };
  photos?: (string | FieldPhoto)[];
  hideInlineThumbnails?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  locked?: boolean;
}) {
  const images = hideInlineThumbnails
    ? []
    : (photos ?? []).map(photoThumbSrc).filter((src): src is string => Boolean(src));
  return (
    <div className="border-b border-brand-line/70 px-3.5 py-3.5 last:border-b-0">
      <p className="text-[15px] font-semibold tracking-[-0.02em] text-brand-navy">{title}</p>
      {impact || meta ? (
        <p className="mt-0.5 text-[13px] text-brand-muted">
          {impact ? <span className={`font-semibold ${IMPACT_TONE[impact.tone]}`}>{impact.label}</span> : null}
          {impact && meta ? " · " : null}
          {meta}
        </p>
      ) : null}
      {detail ? <p className="mt-1.5 text-[13px] leading-relaxed text-brand-navy/80">{detail}</p> : null}
      {images.length > 0 ? (
        <div className="mt-2.5 flex gap-1.5">
          {images.slice(0, 3).map((src, index) => (
            <img
              key={`${index}-${src.slice(-12)}`}
              src={src}
              alt=""
              className="h-12 w-12 rounded-[8px] border border-brand-line/80 object-cover"
            />
          ))}
        </div>
      ) : null}
      {!locked && (onEdit || onRemove) ? (
        <div className="mt-1.5 flex items-center gap-1">
          {onEdit ? (
            <button type="button" onClick={onEdit} className="inline-flex h-10 items-center pr-3 text-[13px] font-semibold text-brand-blue">
              Edit
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand-muted"
            >
              <IconTrash className="h-3.5 w-3.5" />
              Remove
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function EmptyRecord({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="px-3.5 py-4">
      <p className="text-[15px] font-semibold tracking-[-0.02em] text-brand-navy">{title}</p>
      <p className="mt-1 max-w-[34ch] text-[13px] leading-relaxed text-brand-muted">{detail}</p>
    </div>
  );
}

export function AddLine({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="m-press flex h-12 w-full items-center gap-2 border-b border-brand-line/70 px-3.5 text-left text-[14px] font-semibold text-brand-navy last:border-b-0"
    >
      <IconPlus className="h-4 w-4 text-brand-blue" />
      {label}
    </button>
  );
}

export function EntryPanel({ children }: { children: ReactNode }) {
  return <div className="space-y-3 border-b border-brand-line/70 bg-brand-soft/70 px-3.5 py-3">{children}</div>;
}

export function PanelActions({
  onCancel,
  onSave,
  saveLabel,
}: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onCancel} className="h-10 px-2 text-[13px] font-semibold text-brand-muted">
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        className="m-press h-10 rounded-full bg-brand-navy px-4 text-[13px] font-semibold text-white"
      >
        {saveLabel}
      </button>
    </div>
  );
}
