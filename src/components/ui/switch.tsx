"use client";

import * as React from "react";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
};

export function Switch({ checked, onCheckedChange, disabled, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors border-[var(--border)] ${
        checked ? "bg-[var(--primary)]" : "bg-[var(--surface)]"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      {...props}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-[var(--text)] shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

