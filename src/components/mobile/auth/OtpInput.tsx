"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

export function OtpInput({
  value,
  onChange,
  disabled,
  hasError,
  autoFocus,
  idPrefix = "otp",
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
  idPrefix?: string;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const clean = value.replace(/\D/g, "").slice(0, 6);
  const cells = Array.from({ length: 6 }, (_, i) => clean[i] ?? "");

  const applyDigits = useCallback(
    (next: string) => {
      onChange(next.replace(/\D/g, "").slice(0, 6));
    },
    [onChange],
  );

  useEffect(() => {
    if (autoFocus) {
      inputsRef.current[0]?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (clean.length === 6) {
      inputsRef.current[5]?.blur();
    }
  }, [clean.length]);

  function focusIndex(index: number) {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  }

  function handleChange(index: number, raw: string) {
    const onlyDigits = raw.replace(/\D/g, "");
    if (!onlyDigits) {
      const next = (clean.slice(0, index) + clean.slice(index + 1)).slice(0, 6);
      applyDigits(next);
      return;
    }
    if (onlyDigits.length > 1) {
      applyDigits((clean + onlyDigits).slice(0, 6));
      focusIndex(Math.min(clean.length + onlyDigits.length - 1, 5));
      return;
    }
    const chars = cells.slice();
    chars[index] = onlyDigits;
    applyDigits(chars.join(""));
    if (index < 5) focusIndex(index + 1);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!cells[index] && index > 0) {
        e.preventDefault();
        const next = clean.slice(0, index - 1) + clean.slice(index);
        applyDigits(next);
        focusIndex(index - 1);
      }
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusIndex(index - 1);
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      focusIndex(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    applyDigits(pasted);
    focusIndex(Math.min(pasted.length, 5));
  }

  return (
    <div className="flex justify-between gap-1.5 sm:gap-2" role="group" aria-label="6-digit verification code">
      {cells.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          id={`${idPrefix}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          value={digit}
          aria-invalid={hasError}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          className={`h-[52px] min-w-0 flex-1 max-w-[48px] rounded-mobile border bg-white text-center text-[20px] font-semibold tabular-nums text-brand-navy outline-none transition ${
            hasError
              ? "border-status-danger focus:border-status-danger"
              : digit
                ? "border-brand-blue/40 focus:border-brand-blue"
                : "border-brand-line focus:border-brand-blue/50"
          } disabled:opacity-50`}
        />
      ))}
    </div>
  );
}
