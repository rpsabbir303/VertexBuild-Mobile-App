"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

export function AuthField({
  id,
  label,
  error,
  hint,
  trailing,
  ...inputProps
}: {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  trailing?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const invalid = Boolean(error);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-semibold text-brand-navy">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={`w-full appearance-none rounded-mobile border bg-white py-3 pl-3.5 text-[15px] text-brand-navy outline-none transition placeholder:text-brand-mist focus:bg-white ${
            trailing ? "pr-12" : "pr-3.5"
          } ${
            invalid
              ? "border-status-danger focus:border-status-danger"
              : "border-brand-line focus:border-brand-blue/50"
          }`}
          {...inputProps}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-[13px] font-medium text-status-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12px] text-brand-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
